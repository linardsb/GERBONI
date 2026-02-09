import logging
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..schemas import (
    UserCreate, UserRead, UserLogin, Token,
    GuestSessionCreate, GuestSessionRead,
    ForgotPasswordRequest, ResetPasswordRequest, MessageResponse,
    ChangePasswordRequest,
    TwoFactorSetupResponse, TwoFactorVerifyRequest,
    TwoFactorBackupCodesResponse, LoginResponse, TwoFactorDisableRequest,
    UserProfileRead, UserProfileUpdate,
)
from ..services import AuthService, EmailService
from ..config import get_settings
from .deps import get_current_user_required
from ..models import User
from ..middleware import limiter

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)


@router.post("/register", response_model=UserRead)
@limiter.limit("10/hour")  # Prevent mass account creation
async def register(
    request: Request,
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    user = await AuthService.create_user(db, user_data.email, user_data.password)
    return user


@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")  # Prevent brute force attacks
async def login(
    request: Request,
    user_data: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    user = await AuthService.authenticate_user(db, user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # If 2FA is enabled, return a temp token instead of the full JWT
    if user.two_factor_enabled:
        temp_token = AuthService.create_2fa_temp_token(user.id)
        return LoginResponse(requires_2fa=True, temp_token=temp_token)

    access_token = AuthService.create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    return LoginResponse(access_token=access_token)


@router.get("/me", response_model=UserRead)
async def get_me(user: User = Depends(get_current_user_required)):
    return user


@router.post("/guest-session", response_model=GuestSessionRead)
@limiter.limit("30/minute")  # Reasonable limit for guest sessions
async def create_guest_session(
    request: Request,
    data: GuestSessionCreate | None = None,
    db: AsyncSession = Depends(get_db),
):
    email = data.email if data else None
    session = await AuthService.create_guest_session(db, email)
    return session


@router.post("/convert-guest", response_model=Token)
@limiter.limit("5/minute")  # Same as login - prevent brute force
async def convert_guest(
    request: Request,
    session_token: str,
    password: str,
    db: AsyncSession = Depends(get_db),
):
    user = await AuthService.convert_guest_to_user(db, session_token, password)
    access_token = AuthService.create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    return Token(access_token=access_token)


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("3/minute")  # Strict limit to prevent email enumeration
async def forgot_password(
    request: Request,
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Request a password reset email.
    Always returns success to prevent email enumeration attacks.
    """
    reset_token = await AuthService.create_password_reset_token(db, data.email)

    if reset_token:
        await EmailService.send_password_reset(data.email, reset_token.token)
        if settings.debug:
            logger.debug("Password reset token created for %s", data.email)

    # Always return success to prevent email enumeration
    return MessageResponse(
        message="If an account exists with this email, you will receive a password reset link shortly."
    )


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("5/minute")  # Prevent brute force token guessing
async def reset_password(
    request: Request,
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Reset password using a valid reset token.
    """
    user = await AuthService.reset_password(db, data.token, data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    return MessageResponse(message="Password reset successful. You can now log in with your new password.")


@router.get("/verify-reset-token")
async def verify_reset_token(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify if a password reset token is valid.
    """
    reset_token = await AuthService.verify_password_reset_token(db, token)
    return {"valid": reset_token is not None}


@router.post("/me/change-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def change_password(
    request: Request,
    data: ChangePasswordRequest,
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    """
    Change the current user's password.
    Requires the current password for verification.
    """
    success = await AuthService.change_password(
        db, user, data.current_password, data.new_password
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    return MessageResponse(message="Password changed successfully")


# ── Profile Endpoints ───────────────────────────────────────────────


@router.get("/me/profile", response_model=UserProfileRead)
async def get_profile(
    user: User = Depends(get_current_user_required),
):
    """Get the current user's full profile including preferences."""
    import json
    # Parse JSON list fields for the response
    data = {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "display_name": user.display_name,
        "phone": user.phone,
        "birthday": user.birthday,
        "preferred_size": user.preferred_size,
        "preferred_colors": json.loads(user.preferred_colors) if user.preferred_colors else [],
        "preferred_cities": json.loads(user.preferred_cities) if user.preferred_cities else [],
    }
    return UserProfileRead(**data)


@router.patch("/me/profile", response_model=UserProfileRead)
async def update_profile(
    data: UserProfileUpdate,
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's profile preferences."""
    import json
    from datetime import date

    if data.display_name is not None:
        user.display_name = data.display_name or None
    if data.phone is not None:
        user.phone = data.phone or None
    if data.birthday is not None:
        if data.birthday:
            try:
                user.birthday = date.fromisoformat(data.birthday)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid date format. Use YYYY-MM-DD.",
                )
        else:
            user.birthday = None
    if data.preferred_size is not None:
        user.preferred_size = data.preferred_size or None
    if data.preferred_colors is not None:
        user.preferred_colors = json.dumps(data.preferred_colors) if data.preferred_colors else None
    if data.preferred_cities is not None:
        user.preferred_cities = json.dumps(data.preferred_cities) if data.preferred_cities else None

    await db.commit()
    await db.refresh(user)

    return UserProfileRead(
        id=user.id,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        display_name=user.display_name,
        phone=user.phone,
        birthday=user.birthday,
        preferred_size=user.preferred_size,
        preferred_colors=json.loads(user.preferred_colors) if user.preferred_colors else [],
        preferred_cities=json.loads(user.preferred_cities) if user.preferred_cities else [],
    )


# ── 2FA Endpoints ────────────────────────────────────────────────────


@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
async def setup_2fa(
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    """Generate TOTP secret and QR code for 2FA setup.
    Persists the secret on the user (but does not enable 2FA yet)."""
    if user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is already enabled",
        )

    secret = AuthService.generate_totp_secret()
    provisioning_uri = AuthService.get_totp_provisioning_uri(secret, user.email)
    qr_code = AuthService.generate_qr_code_base64(provisioning_uri)

    # Persist secret so /2fa/enable can verify against it
    user.two_factor_secret = secret
    await db.commit()

    return TwoFactorSetupResponse(
        secret=secret,
        provisioning_uri=provisioning_uri,
        qr_code=qr_code,
    )


@router.post("/2fa/enable", response_model=TwoFactorBackupCodesResponse)
async def enable_2fa(
    data: TwoFactorVerifyRequest,
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    """
    Confirm 2FA setup by verifying a TOTP code.
    The client must have called /2fa/setup first and pass the code
    generated from the secret. On success, 2FA is enabled and backup
    codes are returned (shown once).
    """
    if user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is already enabled",
        )

    # The secret was returned by /2fa/setup — client sends it back
    # For security, we need the secret in the request. But the plan says
    # the client generates a TOTP from the secret. We need the secret
    # stored temporarily. Since setup doesn't persist, we ask client to
    # include it. Let's accept secret + code in the body.
    # Actually, the plan says /2fa/setup returns the secret. Then /2fa/enable
    # verifies the code. The client must send the secret along with the code
    # so we can verify. Let's parse it from the request.
    #
    # Alternative: persist the secret on setup (but not enable yet).
    # That's cleaner. Let's do that — we store the secret on setup
    # but keep two_factor_enabled=False until /enable confirms.

    # If user doesn't have a secret yet, they need to call /setup first
    if not user.two_factor_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Call /2fa/setup first to generate a secret",
        )

    if not AuthService.verify_totp(user.two_factor_secret, data.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code",
        )

    # Enable 2FA and generate backup codes
    backup_codes = AuthService.generate_backup_codes()
    user.two_factor_enabled = True
    user.backup_codes = AuthService.hash_backup_codes(backup_codes)
    await db.commit()

    return TwoFactorBackupCodesResponse(backup_codes=backup_codes)


@router.post("/2fa/disable", response_model=MessageResponse)
async def disable_2fa(
    data: TwoFactorDisableRequest,
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    """Disable 2FA. Requires current password and a valid TOTP code."""
    if not user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled",
        )

    if not AuthService.verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password",
        )

    if not AuthService.verify_totp(user.two_factor_secret, data.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code",
        )

    user.two_factor_enabled = False
    user.two_factor_secret = None
    user.backup_codes = None
    await db.commit()

    return MessageResponse(message="Two-factor authentication has been disabled")


@router.post("/2fa/verify", response_model=LoginResponse)
@limiter.limit("5/minute")  # Rate limit to prevent brute force
async def verify_2fa(
    request: Request,
    data: TwoFactorVerifyRequest,
    temp_token: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify 2FA code during login.
    Called after /login returns requires_2fa=true with a temp_token.
    Accepts either a 6-digit TOTP code or an 8-character backup code.
    """
    user_id = AuthService.decode_2fa_temp_token(temp_token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired verification token",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid verification token",
        )

    code = data.code.strip()
    verified = False

    # Try TOTP first (6-digit code)
    if len(code) == 6 and code.isdigit():
        verified = AuthService.verify_totp(user.two_factor_secret, code)

    # Try backup code (8-char alphanumeric)
    if not verified and user.backup_codes:
        success, updated_hashes = AuthService.verify_backup_code(user.backup_codes, code)
        if success:
            verified = True
            user.backup_codes = updated_hashes
            await db.flush()

    if not verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code",
        )

    # Issue full JWT
    access_token = AuthService.create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    await db.commit()
    return LoginResponse(access_token=access_token)
