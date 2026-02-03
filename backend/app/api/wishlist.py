"""Wishlist API endpoints."""

from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import User, GuestSession
from ..schemas.wishlist import (
    WishlistRead,
    WishlistItemRead,
    WishlistProductRead,
    WishlistAdd,
    WishlistCheckResponse,
    WishlistMoveToCartRequest,
)
from ..services import WishlistService, WishlistOwner, CartService, CartOwner
from ..exceptions import DomainException, domain_to_http
from .deps import get_current_user, get_guest_session

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
    user: User | None = Depends(get_current_user),
    x_guest_session: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Get user's wishlist."""
    # Get guest session if header provided
    guest_session = None
    if x_guest_session:
        from ..services import AuthService
        guest_session = await AuthService.get_guest_session(db, x_guest_session)

    try:
        owner = WishlistOwner(
            user_id=user.id if user else None,
            session_id=guest_session.id if guest_session else None,
        )
        items = await WishlistService.get_wishlist_items(db, owner)
        return _format_wishlist(items)
    except DomainException as e:
        raise domain_to_http(e)


@router.post("", response_model=WishlistRead)
async def add_to_wishlist(
    data: WishlistAdd,
    user: User | None = Depends(get_current_user),
    x_guest_session: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Add product to wishlist."""
    # Get guest session if header provided
    guest_session = None
    if x_guest_session:
        from ..services import AuthService
        guest_session = await AuthService.get_guest_session(db, x_guest_session)

    try:
        owner = WishlistOwner(
            user_id=user.id if user else None,
            session_id=guest_session.id if guest_session else None,
        )
        items = await WishlistService.add_item(db, owner, data.product_id)
        await db.commit()
        return _format_wishlist(items)
    except DomainException as e:
        raise domain_to_http(e)


@router.delete("/{product_id}", response_model=WishlistRead)
async def remove_from_wishlist(
    product_id: int,
    user: User | None = Depends(get_current_user),
    x_guest_session: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Remove product from wishlist."""
    # Get guest session if header provided
    guest_session = None
    if x_guest_session:
        from ..services import AuthService
        guest_session = await AuthService.get_guest_session(db, x_guest_session)

    try:
        owner = WishlistOwner(
            user_id=user.id if user else None,
            session_id=guest_session.id if guest_session else None,
        )
        items = await WishlistService.remove_item(db, owner, product_id)
        await db.commit()
        return _format_wishlist(items)
    except DomainException as e:
        raise domain_to_http(e)


@router.get("/check/{product_id}", response_model=WishlistCheckResponse)
async def check_wishlist(
    product_id: int,
    user: User | None = Depends(get_current_user),
    x_guest_session: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Check if product is in wishlist."""
    # Get guest session if header provided
    guest_session = None
    if x_guest_session:
        from ..services import AuthService
        guest_session = await AuthService.get_guest_session(db, x_guest_session)

    try:
        owner = WishlistOwner(
            user_id=user.id if user else None,
            session_id=guest_session.id if guest_session else None,
        )
        in_wishlist, item_id = await WishlistService.check_item(db, owner, product_id)
        return {"in_wishlist": in_wishlist, "wishlist_item_id": item_id}
    except DomainException as e:
        raise domain_to_http(e)


@router.post("/move-to-cart/{product_id}")
async def move_to_cart(
    product_id: int,
    data: WishlistMoveToCartRequest,
    user: User | None = Depends(get_current_user),
    x_guest_session: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Move wishlist item to cart."""
    # Get guest session if header provided
    guest_session = None
    if x_guest_session:
        from ..services import AuthService
        guest_session = await AuthService.get_guest_session(db, x_guest_session)

    try:
        wishlist_owner = WishlistOwner(
            user_id=user.id if user else None,
            session_id=guest_session.id if guest_session else None,
        )
        cart_owner = CartOwner(
            user_id=user.id if user else None,
            session_id=guest_session.id if guest_session else None,
        )

        # Add to cart
        await CartService.add_item(db, cart_owner, data.variant_id, data.quantity)

        # Remove from wishlist
        await WishlistService.remove_item(db, wishlist_owner, product_id)

        await db.commit()
        return {"status": "moved_to_cart"}
    except DomainException as e:
        raise domain_to_http(e)
