"""Wishlist model for saving products for later."""

from datetime import datetime
from sqlalchemy import DateTime, func, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base


class WishlistItem(Base):
    """User wishlist item - supports both authenticated users and guests."""

    __tablename__ = "wishlist_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    session_id: Mapped[int | None] = mapped_column(
        ForeignKey("guest_sessions.id", ondelete="CASCADE"), nullable=True, index=True
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User | None"] = relationship(back_populates="wishlist_items")
    guest_session: Mapped["GuestSession | None"] = relationship(
        back_populates="wishlist_items"
    )
    product: Mapped["Product"] = relationship(back_populates="wishlist_items")

    # Unique constraints to prevent duplicate wishlist entries
    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_wishlist_user_product"),
        UniqueConstraint("session_id", "product_id", name="uq_wishlist_session_product"),
    )


from .user import User, GuestSession
from .product import Product
