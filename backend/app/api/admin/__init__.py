"""Admin API router aggregation."""

from fastapi import APIRouter

from .dashboard import router as dashboard_router
from .orders import router as orders_router
from .products import router as products_router
from .users import router as users_router
from .discounts import router as discounts_router

admin_router = APIRouter()
admin_router.include_router(dashboard_router, prefix="/dashboard", tags=["admin-dashboard"])
admin_router.include_router(orders_router, prefix="/orders", tags=["admin-orders"])
admin_router.include_router(products_router, prefix="/products", tags=["admin-products"])
admin_router.include_router(users_router, prefix="/users", tags=["admin-users"])
admin_router.include_router(discounts_router, prefix="/discounts", tags=["admin-discounts"])
