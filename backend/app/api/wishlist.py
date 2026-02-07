"""Wishlist API endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..schemas.wishlist import (
    WishlistRead,
    WishlistAdd,
    WishlistCheckResponse,
    WishlistMoveToCartRequest,
)
from ..services import WishlistService, WishlistOwner, CartService, CartOwner
from ..exceptions import DomainException, domain_to_http
from .deps import get_auth, AuthResult

router = APIRouter()


def _format_wishlist_item(item) -> dict:
    """Format wishlist item for API response."""
    product_info = WishlistService.calculate_product_info(item.product)
    return {
        "id": item.id,
        "product_id": item.product_id,
        "product": {
            "id": item.product.id,
            "city_name": item.product.city_name,
            "city_name_lv": item.product.city_name_lv,
            "coat_of_arms_image": item.product.coat_of_arms_image,
            "min_price": product_info["min_price"],
            "total_stock": product_info["total_stock"],
        },
        "created_at": item.created_at,
    }


def _format_wishlist(items: list) -> dict:
    """Format complete wishlist for API response."""
    return {
        "items": [_format_wishlist_item(item) for item in items],
        "count": len(items),
    }


@router.get("", response_model=WishlistRead)
async def get_wishlist(
    auth: AuthResult = Depends(get_auth),
    db: AsyncSession = Depends(get_db),
):
    """Get user's wishlist."""
    try:
        owner = WishlistOwner(user_id=auth.user_id, session_id=auth.session_id)
        items = await WishlistService.get_wishlist_items(db, owner)
        return _format_wishlist(items)
    except DomainException as e:
        raise domain_to_http(e)


@router.post("", response_model=WishlistRead)
async def add_to_wishlist(
    data: WishlistAdd,
    auth: AuthResult = Depends(get_auth),
    db: AsyncSession = Depends(get_db),
):
    """Add product to wishlist."""
    try:
        owner = WishlistOwner(user_id=auth.user_id, session_id=auth.session_id)
        items = await WishlistService.add_item(db, owner, data.product_id)
        await db.commit()
        return _format_wishlist(items)
    except DomainException as e:
        raise domain_to_http(e)


@router.delete("/{product_id}", response_model=WishlistRead)
async def remove_from_wishlist(
    product_id: int,
    auth: AuthResult = Depends(get_auth),
    db: AsyncSession = Depends(get_db),
):
    """Remove product from wishlist."""
    try:
        owner = WishlistOwner(user_id=auth.user_id, session_id=auth.session_id)
        items = await WishlistService.remove_item(db, owner, product_id)
        await db.commit()
        return _format_wishlist(items)
    except DomainException as e:
        raise domain_to_http(e)


@router.get("/check/{product_id}", response_model=WishlistCheckResponse)
async def check_wishlist(
    product_id: int,
    auth: AuthResult = Depends(get_auth),
    db: AsyncSession = Depends(get_db),
):
    """Check if product is in wishlist."""
    try:
        owner = WishlistOwner(user_id=auth.user_id, session_id=auth.session_id)
        in_wishlist, item_id = await WishlistService.check_item(db, owner, product_id)
        return {"in_wishlist": in_wishlist, "wishlist_item_id": item_id}
    except DomainException as e:
        raise domain_to_http(e)


@router.post("/move-to-cart/{product_id}")
async def move_to_cart(
    product_id: int,
    data: WishlistMoveToCartRequest,
    auth: AuthResult = Depends(get_auth),
    db: AsyncSession = Depends(get_db),
):
    """Move wishlist item to cart."""
    try:
        owner = WishlistOwner(user_id=auth.user_id, session_id=auth.session_id)
        cart_owner = CartOwner(user_id=auth.user_id, session_id=auth.session_id)

        # Add to cart
        await CartService.add_item(db, cart_owner, data.variant_id, data.quantity)

        # Remove from wishlist
        await WishlistService.remove_item(db, owner, product_id)

        await db.commit()
        return {"status": "moved_to_cart"}
    except DomainException as e:
        raise domain_to_http(e)
