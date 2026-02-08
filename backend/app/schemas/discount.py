"""Discount code schemas."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, field_validator


class DiscountValidateRequest(BaseModel):
    code: str
    subtotal: Decimal


class DiscountValidateResponse(BaseModel):
    valid: bool
    code: str
    type: str | None = None
    value: Decimal | None = None
    discount_amount: Decimal | None = None
    message: str | None = None


class DiscountCodeCreate(BaseModel):
    code: str
    type: str  # percentage | fixed
    value: Decimal
    min_order_amount: Decimal | None = None
    max_uses: int | None = None
    valid_from: datetime | None = None
    valid_until: datetime | None = None

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in ("percentage", "fixed"):
            raise ValueError("type must be 'percentage' or 'fixed'")
        return v

    @field_validator("value")
    @classmethod
    def validate_value(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("value must be positive")
        return v


class DiscountCodeRead(BaseModel):
    id: int
    code: str
    type: str
    value: Decimal
    min_order_amount: Decimal | None
    max_uses: int | None
    used_count: int
    active: bool
    valid_from: datetime | None
    valid_until: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True
