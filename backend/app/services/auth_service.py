from datetime import datetime, timedelta
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
