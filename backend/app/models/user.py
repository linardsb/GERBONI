from datetime import datetime, date, timedelta, timezone
from enum import Enum
from sqlalchemy import String, Boolean, DateTime, Date, Text, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base
import secrets


class UserRole(str, Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_guest: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    role: Mapped[str] = mapped_column(String(50), default=UserRole.CUSTOMER.value)

    # 2FA fields
    two_factor_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    two_factor_secret: Mapped[str | None] = mapped_column(String(64), nullable=True)
    backup_codes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Profile fields
    display_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    birthday: Mapped[date | None] = mapped_column(Date, nullable=True)
    preferred_size: Mapped[str | None] = mapped_column(String(10), nullable=True)
    preferred_colors: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array
    preferred_cities: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    orders: Mapped[list["Order"]] = relationship(back_populates="user")
    cart_items: Mapped[list["CartItem"]] = relationship(back_populates="user")
    wishlist_items: Mapped[list["WishlistItem"]] = relationship(back_populates="user")
    reviews: Mapped[list["Review"]] = relationship(back_populates="user")


class GuestSession(Base):
    __tablename__ = "guest_sessions"
    __table_args__ = (
        Index("ix_guest_sessions_expires_at", "expires_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    session_token: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, default=lambda: secrets.token_urlsafe(32)
    )
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc) + timedelta(days=7),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    cart_items: Mapped[list["CartItem"]] = relationship(back_populates="guest_session")
    wishlist_items: Mapped[list["WishlistItem"]] = relationship(back_populates="guest_session")


from .order import Order
from .cart import CartItem
from .wishlist import WishlistItem
from .review import Review
