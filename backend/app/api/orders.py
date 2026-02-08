from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Order
from ..schemas import OrderCreate, OrderRead
from ..services import OrderService, OrderOwner, ShippingInfo, CartOwner, CartService, DiscountService
from ..exceptions import DomainException, domain_to_http
from .deps import require_auth, AuthResult

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
        "subtotal": order.subtotal,
        "discount_code": order.discount_code,
        "discount_amount": order.discount_amount,
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
    auth: AuthResult = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    owner = OrderOwner(user_id=auth.user_id, guest_email=auth.guest_email)

    try:
        orders = await OrderService.list_orders(db, owner, skip, limit)
        return [_format_order(order) for order in orders]
    except DomainException as e:
        raise domain_to_http(e)


@router.get("/{order_id}", response_model=OrderRead)
async def get_order(
    order_id: int,
    auth: AuthResult = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    owner = OrderOwner(user_id=auth.user_id, guest_email=auth.guest_email)

    try:
        order = await OrderService.get_order(db, order_id, owner)
        return _format_order(order)
    except DomainException as e:
        raise domain_to_http(e)


@router.post("", response_model=OrderRead)
async def create_order(
    order_data: OrderCreate,
    auth: AuthResult = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    # Get cart items
    cart_owner = CartOwner(
        user_id=auth.user_id,
        session_id=auth.session_id,
    )
    cart_items = await CartService.get_cart_items(db, cart_owner)

    # Determine guest email
    guest_email = order_data.guest_email or auth.guest_email

    order_owner = OrderOwner(
        user_id=auth.user_id,
        guest_email=guest_email,
    )

    shipping = ShippingInfo(
        name=order_data.shipping.name,
        address=order_data.shipping.address,
        city=order_data.shipping.city,
        postal_code=order_data.shipping.postal_code,
        country=order_data.shipping.country,
    )

    # Validate discount code if provided
    discount_code_str = None
    discount_amount = Decimal("0.00")
    if order_data.discount_code:
        try:
            subtotal = sum(
                item.variant.price * item.quantity for item in cart_items
            )
            discount_obj, discount_amount = await DiscountService.validate_code(
                db, order_data.discount_code, subtotal
            )
            discount_code_str = discount_obj.code
        except DomainException as e:
            raise domain_to_http(e)

    try:
        order = await OrderService.create_from_cart(
            db, order_owner, cart_items, shipping,
            discount_code=discount_code_str,
            discount_amount=discount_amount,
        )

        # Increment discount usage after successful order creation
        if discount_code_str and discount_obj:
            await DiscountService.increment_usage(db, discount_obj.id)

        await db.commit()
        return _format_order(order)
    except DomainException as e:
        raise domain_to_http(e)
