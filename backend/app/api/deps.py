from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import User, GuestSession, UserRole
from ..services import AuthService

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if not credentials:
        return None

    payload = AuthService.decode_token(credentials.credentials)
    if not payload:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    result = await db.execute(select(User).where(User.id == int(user_id)))
    return result.scalar_one_or_none()


async def get_current_user_required(
    user: User | None = Depends(get_current_user),
) -> User:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_guest_session(
    session_token: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> GuestSession | None:
    if not session_token:
        return None
    return await AuthService.get_guest_session(db, session_token)


async def get_guest_session_header(
    x_guest_session: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> GuestSession | None:
    """Resolve guest session from X-Guest-Session header.

    Returns None if header is missing or session is invalid/expired.
    Use with get_auth() or require_auth() for the full 3-way auth pattern.
    """
    if not x_guest_session:
        return None
    return await AuthService.get_guest_session(db, x_guest_session)


@dataclass
class AuthResult:
    """Resolved authentication context — either JWT user or guest session (or neither).

    Use require_auth() to guarantee at least one is present.
    Use get_auth() when anonymous access is acceptable (e.g. GET /cart returns empty).
    """
    user: User | None = None
    guest_session: GuestSession | None = None

    @property
    def user_id(self) -> int | None:
        return self.user.id if self.user else None

    @property
    def guest_email(self) -> str | None:
        return self.guest_session.email if self.guest_session else None

    @property
    def session_id(self) -> int | None:
        return self.guest_session.id if self.guest_session else None

    @property
    def is_authenticated(self) -> bool:
        return self.user is not None or self.guest_session is not None


async def get_auth(
    user: User | None = Depends(get_current_user),
    guest_session: GuestSession | None = Depends(get_guest_session_header),
) -> AuthResult:
    """Resolve auth from JWT or X-Guest-Session header. Allows anonymous."""
    return AuthResult(user=user, guest_session=guest_session)


async def require_auth(
    user: User | None = Depends(get_current_user),
    x_guest_session: str | None = Header(default=None),
    guest_session: GuestSession | None = Depends(get_guest_session_header),
) -> AuthResult:
    """Require either JWT user or valid guest session. Raises 401 if neither.

    Distinguishes between:
    - X-Guest-Session provided but invalid → "Invalid guest session"
    - No auth at all → "Authentication required"
    """
    if user:
        return AuthResult(user=user, guest_session=None)
    if x_guest_session and not guest_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid guest session",
        )
    if guest_session:
        return AuthResult(user=None, guest_session=guest_session)
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
    )


async def get_admin_user(
    user: User = Depends(get_current_user_required),
) -> User:
    """Require user to be an admin or super_admin."""
    if user.role not in [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


async def get_super_admin_user(
    user: User = Depends(get_current_user_required),
) -> User:
    """Require user to be a super_admin."""
    if user.role != UserRole.SUPER_ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required",
        )
    return user
