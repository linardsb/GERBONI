from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, EmailStr


class OrderItemCreate(BaseModel):
    variant_id: int
    quantity: int


class OrderItemRead(BaseModel):
    id: int
    variant_id: int
    quantity: int
    price: Decimal
    variant: "VariantWithProduct"

    class Config:
        from_attributes = True


class VariantWithProduct(BaseModel):
    id: int
    color: str
    size: str
    product_city: str
    product_image: str

    class Config:
        from_attributes = True


class ShippingInfo(BaseModel):
    name: str
    address: str
    city: str
    postal_code: str
    country: str = "Latvia"


class OrderCreate(BaseModel):
    shipping: ShippingInfo
    guest_email: EmailStr | None = None
    discount_code: str | None = None


class OrderRead(BaseModel):
    id: int
    user_id: int | None
    guest_email: str | None
    status: str
    subtotal: Decimal | None = None
    discount_code: str | None = None
    discount_amount: Decimal = Decimal("0.00")
    total: Decimal
    shipping_name: str | None
    shipping_address: str | None
    shipping_city: str | None
    shipping_postal_code: str | None
    shipping_country: str | None
    tracking_number: str | None
    items: list[OrderItemRead]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


from .product import VariantRead
