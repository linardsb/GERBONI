from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..schemas import (
    UserCreate, UserRead, UserLogin, Token,
    GuestSessionCreate, GuestSessionRead,
    ForgotPasswordRequest, ResetPasswordRequest, MessageResponse,
    ChangePasswordRequest
)
from ..services import AuthService, EmailService
from ..config import get_settings
from .deps import get_current_user_required
from ..models import User
from ..middleware import limiter

router = APIRouter()
settings = get_settings()


@router.post("/register", response_model=UserRead)
@limiter.limit("10/hour")  # Prevent mass account creation
async def register(
    request: Request,
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    user = await AuthService.create_user(db, user_data.email, user_data.password)
    return user


@router.post("/login", response_model=Token)
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
    access_token = AuthService.create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    return Token(access_token=access_token)


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
            print(f"Password reset token for {data.email}: {reset_token.token}")

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
