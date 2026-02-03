from decimal import Decimal
from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import CartItem, User, GuestSession
from ..schemas import CartItemCreate, CartItemUpdate, CartRead, CartItemRead, CartItemVariant
from ..services import AuthService, CartService, CartOwner
from ..exceptions import DomainException, AuthorizationError, domain_to_http
from .deps import get_current_user

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


async def get_cart_owner(
    user: User | None,
    x_guest_session: str | None,
    db: AsyncSession,
) -> CartOwner:
    """Resolve cart owner from user or guest session header."""
    session = None
    if not user and x_guest_session:
        session = await AuthService.get_guest_session(db, x_guest_session)

    try:
        return CartOwner(
            user_id=user.id if user else None,
            session_id=session.id if session else None,
        )
    except AuthorizationError:
        raise domain_to_http(AuthorizationError("User or guest session required"))


@router.get("", response_model=CartRead)
async def get_cart(
    x_guest_session: str | None = Header(default=None),
    user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = None
    if not user and x_guest_session:
        session = await AuthService.get_guest_session(db, x_guest_session)

    # Allow empty cart for anonymous users
    if not user and not session:
        return CartRead(items=[], total=Decimal("0.00"), item_count=0)

    owner = CartOwner(
        user_id=user.id if user else None,
        session_id=session.id if session else None,
    )

    items = await CartService.get_cart_items(db, owner)
    totals = CartService.calculate_totals(items)
    return build_cart_response(items, totals)


@router.post("", response_model=CartRead)
async def add_to_cart(
    item_data: CartItemCreate,
    x_guest_session: str | None = Header(default=None),
    user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    owner = await get_cart_owner(user, x_guest_session, db)

    try:
        items = await CartService.add_item(db, owner, item_data.variant_id, item_data.quantity)
        await db.commit()
        totals = CartService.calculate_totals(items)
        return build_cart_response(items, totals)
    except DomainException as e:
        raise domain_to_http(e)


@router.put("/{item_id}", response_model=CartRead)
async def update_cart_item(
    item_id: int,
    item_data: CartItemUpdate,
    x_guest_session: str | None = Header(default=None),
    user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    owner = await get_cart_owner(user, x_guest_session, db)

    try:
        items = await CartService.update_item(db, owner, item_id, item_data.quantity)
        await db.commit()
        totals = CartService.calculate_totals(items)
        return build_cart_response(items, totals)
    except DomainException as e:
        raise domain_to_http(e)


@router.delete("/{item_id}", response_model=CartRead)
async def remove_cart_item(
    item_id: int,
    x_guest_session: str | None = Header(default=None),
    user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    owner = await get_cart_owner(user, x_guest_session, db)

    try:
        items = await CartService.remove_item(db, owner, item_id)
        await db.commit()
        totals = CartService.calculate_totals(items)
        return build_cart_response(items, totals)
    except DomainException as e:
        raise domain_to_http(e)
