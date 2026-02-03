from fastapi import APIRouter, Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Order, CartItem, TShirtVariant, User
from ..schemas import OrderCreate, OrderRead
from ..services import AuthService, OrderService, OrderOwner, ShippingInfo, CartOwner, CartService
from ..exceptions import DomainException, AuthorizationError, domain_to_http
from .deps import get_current_user

router = APIRouter()


def _format_order(order: Order) -> dict:
    """Format order for API response."""
    items = []
    for item in order.items:
        variant = item.variant
        product = variant.product
        items.append({
            "id": item.id,
            "variant_id": item.variant_id,
            "quantity": item.quantity,
            "price": item.price,
            "variant": {
                "id": variant.id,
                "color": variant.color,
                "size": variant.size,
                "product_city": product.city_name,
                "product_image": product.coat_of_arms_image,
            },
        })

    return {
        "id": order.id,
        "user_id": order.user_id,
        "guest_email": order.guest_email,
        "status": order.status,
        "total": order.total,
        "shipping_name": order.shipping_name,
        "shipping_address": order.shipping_address,
        "shipping_city": order.shipping_city,
        "shipping_postal_code": order.shipping_postal_code,
        "shipping_country": order.shipping_country,
        "tracking_number": order.tracking_number,
        "items": items,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
    }


@router.get("", response_model=list[OrderRead])
async def list_orders(
    skip: int = 0,
    limit: int = 20,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user:
        raise domain_to_http(AuthorizationError("Authentication required"))

    owner = OrderOwner(user_id=user.id, guest_email=None)

    try:
        orders = await OrderService.list_orders(db, owner, skip, limit)
        return [_format_order(order) for order in orders]
    except DomainException as e:
        raise domain_to_http(e)


@router.get("/{order_id}", response_model=OrderRead)
async def get_order(
    order_id: int,
    user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    owner = OrderOwner(user_id=user.id if user else None, guest_email=None)

    try:
        order = await OrderService.get_order(db, order_id, owner if user else None)
        return _format_order(order)
    except DomainException as e:
        raise domain_to_http(e)


@router.post("", response_model=OrderRead)
async def create_order(
    order_data: OrderCreate,
    x_guest_session: str | None = Header(default=None),
    user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = None
    if not user and x_guest_session:
        session = await AuthService.get_guest_session(db, x_guest_session)

    if not user and not session:
        raise domain_to_http(AuthorizationError("User or guest session required"))

    # Get cart items
    cart_owner = CartOwner(
        user_id=user.id if user else None,
        session_id=session.id if session else None,
    )
    cart_items = await CartService.get_cart_items(db, cart_owner)

    # Determine guest email
    guest_email = order_data.guest_email or (session.email if session else None)

    order_owner = OrderOwner(
        user_id=user.id if user else None,
        guest_email=guest_email,
    )

    shipping = ShippingInfo(
        name=order_data.shipping.name,
        address=order_data.shipping.address,
        city=order_data.shipping.city,
        postal_code=order_data.shipping.postal_code,
        country=order_data.shipping.country,
    )

    try:
        order = await OrderService.create_from_cart(db, order_owner, cart_items, shipping)
        await db.commit()
        return _format_order(order)
    except DomainException as e:
        raise domain_to_http(e)
