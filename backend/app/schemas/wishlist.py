"""Pydantic schemas for wishlist operations."""

from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict


class WishlistProductRead(BaseModel):
    """Product info for wishlist display."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    city_name: str
    city_name_lv: str
    coat_of_arms_image: str
    min_price: Decimal | None = None
    total_stock: int | None = None


class WishlistItemRead(BaseModel):
    """Wishlist item response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product: WishlistProductRead
    created_at: datetime


class WishlistRead(BaseModel):
    """Complete wishlist response."""

    items: list[WishlistItemRead]
    count: int


class WishlistAdd(BaseModel):
    """Request to add product to wishlist."""

    product_id: int


class WishlistCheckResponse(BaseModel):
    """Response for checking if product is in wishlist."""

    in_wishlist: bool
    wishlist_item_id: int | None = None


class WishlistMoveToCartRequest(BaseModel):
    """Request to move wishlist item to cart."""

    variant_id: int
    quantity: int = 1
