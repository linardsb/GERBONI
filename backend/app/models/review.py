"""Product review model."""

from datetime import datetime
from sqlalchemy import (
    String,
    Text,
    DateTime,
    func,
    ForeignKey,
    Integer,
    Boolean,
    UniqueConstraint,
    CheckConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base


class Review(Base):
    """Customer review for a product."""

    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="SET NULL"), nullable=True
    )

    rating: Mapped[int] = mapped_column(Integer)  # 1-5
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_verified_purchase: Mapped[bool] = mapped_column(Boolean, default=False)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=True)
    helpful_count: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    product: Mapped["Product"] = relationship(back_populates="reviews")
    user: Mapped["User"] = relationship(back_populates="reviews")
    order: Mapped["Order | None"] = relationship(back_populates="reviews")

    # Constraints
    __table_args__ = (
        # One review per user per product
        UniqueConstraint("user_id", "product_id", name="uq_review_user_product"),
        # Rating must be 1-5
        CheckConstraint("rating >= 1 AND rating <= 5", name="check_rating_range"),
    )


class ReviewHelpful(Base):
    """Tracks which users found a review helpful."""

    __tablename__ = "review_helpful"

    id: Mapped[int] = mapped_column(primary_key=True)
    review_id: Mapped[int] = mapped_column(
        ForeignKey("reviews.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    session_id: Mapped[int | None] = mapped_column(
        ForeignKey("guest_sessions.id", ondelete="CASCADE"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Prevent duplicate votes
    __table_args__ = (
        UniqueConstraint("review_id", "user_id", name="uq_helpful_review_user"),
        UniqueConstraint("review_id", "session_id", name="uq_helpful_review_session"),
    )


from .product import Product
from .user import User
from .order import Order
