from datetime import datetime
from sqlalchemy import DateTime, func, ForeignKey, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (
        Index("ix_cart_items_user_variant", "user_id", "variant_id"),
        Index("ix_cart_items_session_variant", "session_id", "variant_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    session_id: Mapped[int | None] = mapped_column(
        ForeignKey("guest_sessions.id"), nullable=True
    )
    variant_id: Mapped[int] = mapped_column(ForeignKey("tshirt_variants.id"))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User | None"] = relationship(back_populates="cart_items")
    guest_session: Mapped["GuestSession | None"] = relationship(
        back_populates="cart_items"
    )
    variant: Mapped["TShirtVariant"] = relationship(back_populates="cart_items")


from .user import User, GuestSession
from .product import TShirtVariant
