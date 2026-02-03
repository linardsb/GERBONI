from fastapi import APIRouter
from .products import router as products_router
from .cart import router as cart_router
from .orders import router as orders_router
from .auth import router as auth_router
from .payments import router as payments_router
from .agent import router as agent_router
from .addresses import router as addresses_router
from .newsletter import router as newsletter_router
from .wishlist import router as wishlist_router
from .recommendations import router as recommendations_router
from .reviews import router as reviews_router
from .admin import admin_router


def create_api_router() -> APIRouter:
    """
    Create the API router with all endpoints.

    This function is used to create both the legacy /api router
    and the versioned /api/v1 router.
    """
    router = APIRouter()
    router.include_router(products_router, prefix="/products", tags=["products"])
    router.include_router(cart_router, prefix="/cart", tags=["cart"])
    router.include_router(orders_router, prefix="/orders", tags=["orders"])
    router.include_router(auth_router, prefix="/auth", tags=["auth"])
    router.include_router(payments_router, prefix="/payments", tags=["payments"])
    router.include_router(agent_router, prefix="/agent", tags=["agent"])
    router.include_router(addresses_router, prefix="/addresses", tags=["addresses"])
    router.include_router(newsletter_router, prefix="/newsletter", tags=["newsletter"])
    router.include_router(wishlist_router, prefix="/wishlist", tags=["wishlist"])
    router.include_router(recommendations_router, prefix="/recommendations", tags=["recommendations"])
    router.include_router(reviews_router, tags=["reviews"])
    router.include_router(admin_router, prefix="/admin", tags=["admin"])
    return router


# Legacy router (backward compatible at /api)
api_router = create_api_router()

# Versioned router (at /api/v1)
api_v1_router = create_api_router()
