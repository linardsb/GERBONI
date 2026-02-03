"""Admin dashboard schemas."""

from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class DashboardStats(BaseModel):
    """Dashboard statistics summary."""
    total_orders: int
    pending_orders: int
    total_revenue: Decimal
    total_customers: int
    orders_today: int
    revenue_today: Decimal
    low_stock_variants: int


class OrderStatusUpdate(BaseModel):
    """Update order status."""
    status: str


class OrderShipment(BaseModel):
    """Mark order as shipped with tracking."""
    tracking_number: str


class VariantUpdate(BaseModel):
    """Update product variant."""
    price: Decimal | None = None
    stock: int | None = None


class UserRoleUpdate(BaseModel):
    """Update user role."""
    role: str


class AdminOrderRead(BaseModel):
    """Order data for admin view."""
    id: int
    user_id: int | None
    guest_email: str | None
    status: str
    total: Decimal
    shipping_name: str | None
    shipping_city: str | None
    shipping_country: str | None
    tracking_number: str | None
    created_at: datetime
    updated_at: datetime
    item_count: int

    class Config:
        from_attributes = True


class AdminUserRead(BaseModel):
    """User data for admin view."""
    id: int
    email: str
    role: str
    is_guest: bool
    is_active: bool
    created_at: datetime
    order_count: int
    total_spent: Decimal

    class Config:
        from_attributes = True


class AdminProductRead(BaseModel):
    """Product data for admin view."""
    id: int
    city_name: str
    city_name_lv: str
    is_active: bool
    variant_count: int
    total_stock: int
    low_stock_count: int

    class Config:
        from_attributes = True


class AdminVariantRead(BaseModel):
    """Variant data for admin view."""
    id: int
    product_id: int
    color: str
    size: str
    price: Decimal
    stock: int
    sku: str

    class Config:
        from_attributes = True
