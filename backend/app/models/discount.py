"""Discount code model."""

from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import String, DateTime, func, Numeric, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class DiscountType(str, Enum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"


class DiscountCode(Base):
    __tablename__ = "discount_codes"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    type: Mapped[str] = mapped_column(String(20))  # percentage | fixed
    value: Mapped[Decimal] = mapped_column(Numeric(10, 2))  # percentage 0-100 or fixed EUR

    min_order_amount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    max_uses: Mapped[int | None] = mapped_column(Integer, nullable=True)
    used_count: Mapped[int] = mapped_column(Integer, default=0)

    active: Mapped[bool] = mapped_column(Boolean, default=True)
    valid_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
