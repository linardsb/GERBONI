from decimal import Decimal
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import CartItem
from ..schemas import CartItemCreate, CartItemUpdate, CartRead, CartItemRead, CartItemVariant
from ..services import CartService, CartOwner
from ..exceptions import DomainException, domain_to_http
from .deps import get_auth, require_auth, AuthResult
from ..middleware import limiter

router = APIRouter()


def build_cart_response(items: list[CartItem], totals) -> CartRead:
    """Format cart items for API response."""
    cart_items = []

    for item in items:
        variant = item.variant
        product = variant.product

        cart_items.append(
            CartItemRead(
                id=item.id,
                variant_id=item.variant_id,
                quantity=item.quantity,
                variant=CartItemVariant(
                    id=variant.id,
                    color=variant.color,
                    size=variant.size,
                    price=variant.price,
                    stock=variant.stock,
                    product_city=product.city_name,
                    product_city_lv=product.city_name_lv,
                    product_image=product.coat_of_arms_image,
                ),
            )
        )

    return CartRead(items=cart_items, total=totals.total, item_count=totals.item_count)


@router.get("", response_model=CartRead)
@limiter.limit("60/minute")
async def get_cart(
    request: Request,
    auth: AuthResult = Depends(get_auth),
    db: AsyncSession = Depends(get_db),
):
    # Allow empty cart for anonymous users
    if not auth.is_authenticated:
        return CartRead(items=[], total=Decimal("0.00"), item_count=0)

    owner = CartOwner(user_id=auth.user_id, session_id=auth.session_id)

    items = await CartService.get_cart_items(db, owner)
    totals = CartService.calculate_totals(items)
    return build_cart_response(items, totals)


@router.post("", response_model=CartRead)
@limiter.limit("30/minute")
async def add_to_cart(
    request: Request,
    item_data: CartItemCreate,
    auth: AuthResult = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    owner = CartOwner(user_id=auth.user_id, session_id=auth.session_id)

    try:
        items = await CartService.add_item(db, owner, item_data.variant_id, item_data.quantity)
        await db.commit()
        totals = CartService.calculate_totals(items)
        return build_cart_response(items, totals)
    except DomainException as e:
        raise domain_to_http(e)


@router.put("/{item_id}", response_model=CartRead)
@limiter.limit("30/minute")
async def update_cart_item(
    request: Request,
    item_id: int,
    item_data: CartItemUpdate,
    auth: AuthResult = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    owner = CartOwner(user_id=auth.user_id, session_id=auth.session_id)

    try:
        items = await CartService.update_item(db, owner, item_id, item_data.quantity)
        await db.commit()
        totals = CartService.calculate_totals(items)
        return build_cart_response(items, totals)
    except DomainException as e:
        raise domain_to_http(e)


@router.delete("/{item_id}", response_model=CartRead)
@limiter.limit("30/minute")
async def remove_cart_item(
    request: Request,
    item_id: int,
    auth: AuthResult = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    owner = CartOwner(user_id=auth.user_id, session_id=auth.session_id)

    try:
        items = await CartService.remove_item(db, owner, item_id)
        await db.commit()
        totals = CartService.calculate_totals(items)
        return build_cart_response(items, totals)
    except DomainException as e:
        raise domain_to_http(e)
