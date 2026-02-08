"""Order business logic service with state machine.

Follows the static method pattern established by AuthService.
All methods accept db: AsyncSession as first parameter.
Services don't commit transactions - caller controls boundaries.
"""

from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..exceptions import (
    AuthorizationError,
    EmptyCartError,
    EntityNotFoundError,
    InsufficientStockError,
    InvalidStateTransitionError,
)
from ..models import Order, OrderItem, OrderStatus, CartItem, TShirtVariant


# State machine: maps current status to valid next statuses
VALID_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.PENDING: {OrderStatus.PAID, OrderStatus.CANCELLED},
    OrderStatus.PAID: {OrderStatus.PROCESSING, OrderStatus.REFUNDED, OrderStatus.CANCELLED},
    OrderStatus.PROCESSING: {OrderStatus.SHIPPED, OrderStatus.REFUNDED, OrderStatus.CANCELLED},
    OrderStatus.SHIPPED: {OrderStatus.DELIVERED, OrderStatus.REFUNDED},
    OrderStatus.DELIVERED: {OrderStatus.REFUNDED},
    OrderStatus.CANCELLED: set(),  # Terminal state
    OrderStatus.REFUNDED: set(),   # Terminal state
}


@dataclass
class OrderOwner:
    """Identifies order owner - either user or guest."""
    user_id: int | None
    guest_email: str | None


@dataclass
class ShippingInfo:
    """Shipping address information."""
    name: str
    address: str
    city: str
    postal_code: str
    country: str = "Latvia"


class OrderService:
    @staticmethod
    def can_transition(current: OrderStatus, target: OrderStatus) -> bool:
        """Check if transition from current to target status is valid (pure function)."""
        return target in VALID_TRANSITIONS.get(current, set())

    @staticmethod
    async def get_order(
        db: AsyncSession,
        order_id: int,
        owner: OrderOwner | None = None,
    ) -> Order:
        """Get order by ID with items loaded.

        Args:
            db: Database session
            order_id: Order ID to fetch
            owner: If provided, restrict to orders owned by this user/guest

        Raises:
            EntityNotFoundError: Order not found or doesn't belong to owner
        """
        stmt = (
            select(Order)
            .options(
                selectinload(Order.items)
                .selectinload(OrderItem.variant)
                .selectinload(TShirtVariant.product)
            )
            .where(Order.id == order_id)
        )

        if owner and owner.user_id:
            stmt = stmt.where(Order.user_id == owner.user_id)
        elif owner and owner.guest_email:
            stmt = stmt.where(Order.guest_email == owner.guest_email)

        result = await db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            raise EntityNotFoundError("Order not found")

        return order

    @staticmethod
    async def list_orders(
        db: AsyncSession,
        owner: OrderOwner,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Order]:
        """List orders for owner with pagination.

        Raises:
            AuthorizationError: If no owner identity provided
        """
        if not owner.user_id and not owner.guest_email:
            raise AuthorizationError("User or guest email required")

        stmt = (
            select(Order)
            .options(
                selectinload(Order.items)
                .selectinload(OrderItem.variant)
                .selectinload(TShirtVariant.product)
            )
        )

        if owner.user_id:
            stmt = stmt.where(Order.user_id == owner.user_id)
        else:
            stmt = stmt.where(Order.guest_email == owner.guest_email)

        stmt = stmt.order_by(Order.created_at.desc()).offset(skip).limit(limit)

        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def create_from_cart(
        db: AsyncSession,
        owner: OrderOwner,
        cart_items: list[CartItem],
        shipping: ShippingInfo,
        discount_code: str | None = None,
        discount_amount: Decimal = Decimal("0.00"),
    ) -> Order:
        """Create order from cart items.

        Decrements stock and clears cart items. Does not commit - caller must commit.

        Raises:
            AuthorizationError: No owner identity provided
            EmptyCartError: Cart is empty
            InsufficientStockError: Item exceeds available stock
        """
        if not owner.user_id and not owner.guest_email:
            raise AuthorizationError("User or guest email required")

        if not cart_items:
            raise EmptyCartError("Cart is empty")

        # Calculate subtotal
        subtotal = Decimal("0.00")
        for item in cart_items:
            subtotal += item.variant.price * item.quantity

        total = subtotal - discount_amount

        # Create order
        order = Order(
            user_id=owner.user_id,
            guest_email=owner.guest_email,
            subtotal=subtotal,
            discount_code=discount_code,
            discount_amount=discount_amount,
            total=total,
            shipping_name=shipping.name,
            shipping_address=shipping.address,
            shipping_city=shipping.city,
            shipping_postal_code=shipping.postal_code,
            shipping_country=shipping.country,
        )
        db.add(order)
        await db.flush()

        # Create order items and update stock
        for cart_item in cart_items:
            variant = cart_item.variant
            if variant.stock < cart_item.quantity:
                raise InsufficientStockError(
                    f"Insufficient stock for {variant.product.city_name} "
                    f"({variant.color}, {variant.size})"
                )

            order_item = OrderItem(
                order_id=order.id,
                variant_id=cart_item.variant_id,
                quantity=cart_item.quantity,
                price=variant.price,
            )
            db.add(order_item)

            # Decrease stock
            variant.stock -= cart_item.quantity

            # Remove cart item
            await db.delete(cart_item)

        await db.flush()
        await db.refresh(order)

        # Reload with items
        return await OrderService.get_order(db, order.id)

    @staticmethod
    async def transition_status(
        db: AsyncSession,
        order_id: int,
        target: OrderStatus,
        metadata: dict | None = None,
    ) -> Order:
        """Transition order to target status with validation.

        Args:
            db: Database session
            order_id: Order to transition
            target: Target status
            metadata: Optional data to set (stripe_payment_id, tracking_number, etc.)

        Raises:
            EntityNotFoundError: Order not found
            InvalidStateTransitionError: Invalid transition
        """
        order = await OrderService.get_order(db, order_id)
        current = OrderStatus(order.status)

        if not OrderService.can_transition(current, target):
            raise InvalidStateTransitionError(
                f"Cannot transition from {current.value} to {target.value}"
            )

        order.status = target.value

        # Apply optional metadata
        if metadata:
            if "stripe_payment_id" in metadata:
                order.stripe_payment_id = metadata["stripe_payment_id"]
            if "tracking_number" in metadata:
                order.tracking_number = metadata["tracking_number"]

        await db.flush()
        return order

    @staticmethod
    async def mark_paid(
        db: AsyncSession,
        order_id: int,
        stripe_payment_id: str,
    ) -> Order:
        """Mark order as paid from webhook.

        Raises:
            EntityNotFoundError: Order not found
            InvalidStateTransitionError: Order not in PENDING status
        """
        return await OrderService.transition_status(
            db,
            order_id,
            OrderStatus.PAID,
            metadata={"stripe_payment_id": stripe_payment_id},
        )

    @staticmethod
    async def cancel(
        db: AsyncSession,
        order_id: int,
        restore_stock: bool = True,
    ) -> Order:
        """Cancel order, optionally restoring stock.

        Raises:
            EntityNotFoundError: Order not found
            InvalidStateTransitionError: Order cannot be cancelled from current status
        """
        order = await OrderService.get_order(db, order_id)
        current = OrderStatus(order.status)

        if not OrderService.can_transition(current, OrderStatus.CANCELLED):
            raise InvalidStateTransitionError(
                f"Cannot cancel order in {current.value} status"
            )

        order.status = OrderStatus.CANCELLED.value

        if restore_stock and current != OrderStatus.PENDING:
            # Only restore stock if payment was made (not just pending)
            await OrderService._restore_stock(db, order)

        await db.flush()
        return order

    @staticmethod
    async def process_refund(
        db: AsyncSession,
        order_id: int,
        reason: str | None = None,
        restore_stock: bool = True,
    ) -> Order:
        """Refund order, optionally restoring stock.

        Raises:
            EntityNotFoundError: Order not found
            InvalidStateTransitionError: Order cannot be refunded from current status
        """
        order = await OrderService.get_order(db, order_id)
        current = OrderStatus(order.status)

        if not OrderService.can_transition(current, OrderStatus.REFUNDED):
            raise InvalidStateTransitionError(
                f"Cannot refund order in {current.value} status"
            )

        order.status = OrderStatus.REFUNDED.value

        if restore_stock:
            await OrderService._restore_stock(db, order)

        await db.flush()
        return order

    @staticmethod
    async def ship_order(
        db: AsyncSession,
        order_id: int,
        tracking_number: str | None = None,
    ) -> Order:
        """Mark order as shipped.

        Raises:
            EntityNotFoundError: Order not found
            InvalidStateTransitionError: Order not in PROCESSING status
        """
        metadata = {}
        if tracking_number:
            metadata["tracking_number"] = tracking_number

        return await OrderService.transition_status(
            db,
            order_id,
            OrderStatus.SHIPPED,
            metadata=metadata or None,
        )

    @staticmethod
    async def mark_delivered(
        db: AsyncSession,
        order_id: int,
    ) -> Order:
        """Mark order as delivered.

        Raises:
            EntityNotFoundError: Order not found
            InvalidStateTransitionError: Order not in SHIPPED status
        """
        return await OrderService.transition_status(
            db,
            order_id,
            OrderStatus.DELIVERED,
        )

    @staticmethod
    async def _restore_stock(db: AsyncSession, order: Order) -> None:
        """Restore stock for all items in order (internal helper)."""
        for item in order.items:
            result = await db.execute(
                select(TShirtVariant).where(TShirtVariant.id == item.variant_id)
            )
            variant = result.scalar_one()
            variant.stock += item.quantity
