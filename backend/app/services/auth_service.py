import json
import secrets
import string
import io
import base64
from datetime import datetime, timedelta

import pyotp
import qrcode
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from ..config import get_settings
from ..models import User, GuestSession, PasswordResetToken

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                minutes=settings.access_token_expire_minutes
            )
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

    @staticmethod
    def decode_token(token: str) -> dict | None:
        try:
            payload = jwt.decode(
                token, settings.secret_key, algorithms=[settings.algorithm]
            )
            return payload
        except JWTError:
            return None

    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    @staticmethod
    async def create_user(db: AsyncSession, email: str, password: str) -> User:
        existing = await AuthService.get_user_by_email(db, email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        user = User(
            email=email,
            password_hash=AuthService.get_password_hash(password),
            is_guest=False,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def authenticate_user(
        db: AsyncSession, email: str, password: str
    ) -> User | None:
        user = await AuthService.get_user_by_email(db, email)
        if not user or not user.password_hash:
            return None
        if not AuthService.verify_password(password, user.password_hash):
            return None
        return user

    @staticmethod
    async def create_guest_session(
        db: AsyncSession, email: str | None = None
    ) -> GuestSession:
        session = GuestSession(email=email)
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return session

    @staticmethod
    async def get_guest_session(
        db: AsyncSession, session_token: str
    ) -> GuestSession | None:
        result = await db.execute(
            select(GuestSession).where(
                GuestSession.session_token == session_token,
                GuestSession.expires_at > datetime.utcnow(),
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def convert_guest_to_user(
        db: AsyncSession, session_token: str, password: str
    ) -> User:
        session = await AuthService.get_guest_session(db, session_token)
        if not session or not session.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid session or no email associated",
            )

        # Check if user already exists
        existing = await AuthService.get_user_by_email(db, session.email)
        if existing and not existing.is_guest:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already exists",
            )

        if existing and existing.is_guest:
            # Convert existing guest user
            existing.password_hash = AuthService.get_password_hash(password)
            existing.is_guest = False
            await db.commit()
            await db.refresh(existing)
            return existing

        # Create new user
        return await AuthService.create_user(db, session.email, password)

    @staticmethod
    async def create_password_reset_token(db: AsyncSession, email: str) -> PasswordResetToken | None:
        """Create a password reset token for the user with the given email."""
        user = await AuthService.get_user_by_email(db, email)
        if not user:
            # Don't reveal that the email doesn't exist
            return None

        # Invalidate any existing tokens
        existing = await db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.used == False,
                PasswordResetToken.expires_at > datetime.utcnow(),
            )
        )
        for token in existing.scalars().all():
            token.used = True

        # Create new token
        reset_token = PasswordResetToken(user_id=user.id)
        db.add(reset_token)
        await db.commit()
        await db.refresh(reset_token)
        return reset_token

    @staticmethod
    async def verify_password_reset_token(db: AsyncSession, token: str) -> PasswordResetToken | None:
        """Verify a password reset token is valid and not expired."""
        result = await db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token == token,
                PasswordResetToken.used == False,
                PasswordResetToken.expires_at > datetime.utcnow(),
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def reset_password(db: AsyncSession, token: str, new_password: str) -> User | None:
        """Reset a user's password using a valid token."""
        reset_token = await AuthService.verify_password_reset_token(db, token)
        if not reset_token:
            return None

        # Get the user
        result = await db.execute(select(User).where(User.id == reset_token.user_id))
        user = result.scalar_one_or_none()
        if not user:
            return None

        # Update password
        user.password_hash = AuthService.get_password_hash(new_password)

        # Mark token as used
        reset_token.used = True

        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def change_password(
        db: AsyncSession, user: "User", current_password: str, new_password: str
    ) -> bool:
        """Change a user's password after verifying the current password."""
        if not user.password_hash:
            return False

        if not AuthService.verify_password(current_password, user.password_hash):
            return False

        user.password_hash = AuthService.get_password_hash(new_password)
        await db.commit()
        return True

    # ── 2FA (TOTP) Methods ──────────────────────────────────────────────

    @staticmethod
    def generate_totp_secret() -> str:
        """Generate a new TOTP secret key."""
        return pyotp.random_base32()

    @staticmethod
    def get_totp_provisioning_uri(secret: str, email: str) -> str:
        """Get the otpauth:// URI for QR code generation."""
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(name=email, issuer_name="GERBONI")

    @staticmethod
    def generate_qr_code_base64(provisioning_uri: str) -> str:
        """Generate a QR code as a base64-encoded PNG."""
        img = qrcode.make(provisioning_uri)
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        return base64.b64encode(buffer.read()).decode("utf-8")

    @staticmethod
    def verify_totp(secret: str, code: str) -> bool:
        """Verify a 6-digit TOTP code (allows 1-step window for clock drift)."""
        totp = pyotp.TOTP(secret)
        return totp.verify(code, valid_window=1)

    @staticmethod
    def generate_backup_codes(count: int = 10) -> list[str]:
        """Generate a list of 8-character alphanumeric backup codes."""
        chars = string.ascii_uppercase + string.digits
        return [
            "".join(secrets.choice(chars) for _ in range(8))
            for _ in range(count)
        ]

    @staticmethod
    def hash_backup_codes(codes: list[str]) -> str:
        """Hash backup codes and return as JSON-encoded list."""
        hashed = [pwd_context.hash(code) for code in codes]
        return json.dumps(hashed)

    @staticmethod
    def verify_backup_code(stored_hashes_json: str, code: str) -> tuple[bool, str | None]:
        """
        Check a backup code against stored hashes.
        Returns (success, updated_hashes_json). If success, the used code
        is removed from the list.
        """
        try:
            hashes = json.loads(stored_hashes_json)
        except (json.JSONDecodeError, TypeError):
            return False, None

        for i, h in enumerate(hashes):
            if pwd_context.verify(code, h):
                hashes.pop(i)
                return True, json.dumps(hashes)

        return False, None

    @staticmethod
    def create_2fa_temp_token(user_id: int) -> str:
        """Create a short-lived token for the 2FA verification step."""
        return AuthService.create_access_token(
            data={"sub": str(user_id), "type": "2fa_pending"},
            expires_delta=timedelta(minutes=5),
        )

    @staticmethod
    def decode_2fa_temp_token(token: str) -> int | None:
        """Decode a 2FA temp token and return user_id, or None if invalid."""
        payload = AuthService.decode_token(token)
        if not payload:
            return None
        if payload.get("type") != "2fa_pending":
            return None
        sub = payload.get("sub")
        if not sub:
            return None
        try:
            return int(sub)
        except (ValueError, TypeError):
            return None
