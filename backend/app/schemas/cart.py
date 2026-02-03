from decimal import Decimal
from pydantic import BaseModel


class CartItemCreate(BaseModel):
    variant_id: int
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemVariant(BaseModel):
    id: int
    color: str
    size: str
    price: Decimal
    stock: int
    product_city: str
    product_city_lv: str
    product_image: str

    class Config:
        from_attributes = True


class CartItemRead(BaseModel):
    id: int
    variant_id: int
    quantity: int
    variant: CartItemVariant

    class Config:
        from_attributes = True


class CartRead(BaseModel):
    items: list[CartItemRead]
    total: Decimal
    item_count: int
