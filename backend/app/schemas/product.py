from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class VariantRead(BaseModel):
    id: int
    color: str
    size: str
    price: Decimal
    stock: int
    sku: str

    class Config:
        from_attributes = True


class ProductRead(BaseModel):
    id: int
    city_name: str
    city_name_lv: str
    coat_of_arms_image: str
    description: str
    description_lv: str | None
    is_active: bool
    variants: list[VariantRead]
    created_at: datetime

    class Config:
        from_attributes = True


class ProductListRead(BaseModel):
    id: int
    city_name: str
    city_name_lv: str
    coat_of_arms_image: str
    description: str
    description_lv: str | None = None
    is_active: bool
    min_price: Decimal | None = None
    total_stock: int = 0
    created_at: datetime

    class Config:
        from_attributes = True
