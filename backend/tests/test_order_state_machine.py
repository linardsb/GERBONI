"""
Tests for the order state machine in OrderService.
Validates all valid/invalid transitions, full lifecycle, and stock restoration.
"""

import pytest
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Order, OrderItem, OrderStatus, TShirtVariant
from app.services import OrderService
from app.exceptions import InvalidStateTransitionError, EntityNotFoundError


class TestCanTransition:
    """Tests for OrderService.can_transition (pure function)."""

    @pytest.mark.parametrize(
        "current,target",
        [
            (OrderStatus.PENDING, OrderStatus.PAID),
            (OrderStatus.PENDING, OrderStatus.CANCELLED),
            (OrderStatus.PAID, OrderStatus.PROCESSING),
            (OrderStatus.PAID, OrderStatus.REFUNDED),
            (OrderStatus.PAID, OrderStatus.CANCELLED),
            (OrderStatus.PROCESSING, OrderStatus.SHIPPED),
            (OrderStatus.PROCESSING, OrderStatus.REFUNDED),
            (OrderStatus.PROCESSING, OrderStatus.CANCELLED),
            (OrderStatus.SHIPPED, OrderStatus.DELIVERED),
            (OrderStatus.SHIPPED, OrderStatus.REFUNDED),
            (OrderStatus.DELIVERED, OrderStatus.REFUNDED),
        ],
    )
    def test_valid_transitions(self, current, target):
        """All valid state transitions should return True."""
        assert OrderService.can_transition(current, target) is True

    @pytest.mark.parametrize(
        "current,target",
        [
            (OrderStatus.PENDING, OrderStatus.PROCESSING),
            (OrderStatus.PENDING, OrderStatus.SHIPPED),
            (OrderStatus.PENDING, OrderStatus.DELIVERED),
            (OrderStatus.PENDING, OrderStatus.REFUNDED),
            (OrderStatus.PAID, OrderStatus.SHIPPED),
            (OrderStatus.PAID, OrderStatus.DELIVERED),
            (OrderStatus.PAID, OrderStatus.PENDING),
            (OrderStatus.PROCESSING, OrderStatus.PENDING),
            (OrderStatus.PROCESSING, OrderStatus.PAID),
            (OrderStatus.PROCESSING, OrderStatus.DELIVERED),
            (OrderStatus.SHIPPED, OrderStatus.PENDING),
            (OrderStatus.SHIPPED, OrderStatus.PAID),
            (OrderStatus.SHIPPED, OrderStatus.PROCESSING),
            (OrderStatus.SHIPPED, OrderStatus.CANCELLED),
            (OrderStatus.DELIVERED, OrderStatus.PENDING),
            (OrderStatus.DELIVERED, OrderStatus.PAID),
            (OrderStatus.DELIVERED, OrderStatus.CANCELLED),
            (OrderStatus.CANCELLED, OrderStatus.PENDING),
            (OrderStatus.CANCELLED, OrderStatus.PAID),
            (OrderStatus.CANCELLED, OrderStatus.PROCESSING),
            (OrderStatus.CANCELLED, OrderStatus.SHIPPED),
            (OrderStatus.CANCELLED, OrderStatus.DELIVERED),
            (OrderStatus.CANCELLED, OrderStatus.REFUNDED),
            (OrderStatus.REFUNDED, OrderStatus.PENDING),
            (OrderStatus.REFUNDED, OrderStatus.PAID),
            (OrderStatus.REFUNDED, OrderStatus.CANCELLED),
        ],
    )
    def test_invalid_transitions(self, current, target):
        """All invalid state transitions should return False."""
        assert OrderService.can_transition(current, target) is False

    def test_terminal_states_have_no_transitions(self):
        """Cancelled and Refunded are terminal — no outgoing transitions."""
        for target in OrderStatus:
            assert OrderService.can_transition(OrderStatus.CANCELLED, target) is False
            assert OrderService.can_transition(OrderStatus.REFUNDED, target) is False


class TestTransitionStatus:
    """Tests for OrderService.transition_status."""

    async def test_transition_pending_to_paid(
        self, db_session: AsyncSession, test_order
    ):
        """Transition pending order to paid with metadata."""
        order = await OrderService.transition_status(
            db_session,
            test_order.id,
            OrderStatus.PAID,
            metadata={"stripe_payment_id": "pi_test_123"},
        )
        assert order.status == OrderStatus.PAID.value
        assert order.stripe_payment_id == "pi_test_123"

    async def test_transition_with_tracking_number(
        self, db_session: AsyncSession, test_paid_order
    ):
        """Transition to shipped with tracking number in metadata."""
        # Move to processing first
        test_paid_order.status = OrderStatus.PROCESSING.value
        await db_session.flush()

        order = await OrderService.transition_status(
            db_session,
            test_paid_order.id,
            OrderStatus.SHIPPED,
            metadata={"tracking_number": "TRACK-123"},
        )
        assert order.status == OrderStatus.SHIPPED.value
        assert order.tracking_number == "TRACK-123"

    async def test_transition_invalid_raises(
        self, db_session: AsyncSession, test_order
    ):
        """Invalid transition raises InvalidStateTransitionError."""
        with pytest.raises(InvalidStateTransitionError):
            await OrderService.transition_status(
                db_session, test_order.id, OrderStatus.SHIPPED
            )

    async def test_transition_nonexistent_order(self, db_session: AsyncSession):
        """Transitioning non-existent order raises EntityNotFoundError."""
        with pytest.raises(EntityNotFoundError):
            await OrderService.transition_status(
                db_session, 99999, OrderStatus.PAID
            )


class TestMarkPaid:
    """Tests for OrderService.mark_paid."""

    async def test_mark_paid_success(
        self, db_session: AsyncSession, test_order
    ):
        """Mark pending order as paid."""
        order = await OrderService.mark_paid(
            db_session, test_order.id, stripe_payment_id="pi_test_456"
        )
        assert order.status == OrderStatus.PAID.value
        assert order.stripe_payment_id == "pi_test_456"

    async def test_mark_paid_already_paid(
        self, db_session: AsyncSession, test_paid_order
    ):
        """Cannot mark already-paid order as paid again."""
        with pytest.raises(InvalidStateTransitionError):
            await OrderService.mark_paid(
                db_session, test_paid_order.id, stripe_payment_id="pi_test_789"
            )


class TestCancel:
    """Tests for OrderService.cancel."""

    async def test_cancel_pending(
        self, db_session: AsyncSession, test_order
    ):
        """Cancel a pending order."""
        order = await OrderService.cancel(db_session, test_order.id)
        assert order.status == OrderStatus.CANCELLED.value

    async def test_cancel_paid_restores_stock(
        self, db_session: AsyncSession, test_paid_order, test_variant
    ):
        """Cancelling a paid order restores stock."""
        initial_stock = test_variant.stock
        order = await OrderService.cancel(
            db_session, test_paid_order.id, restore_stock=True
        )
        assert order.status == OrderStatus.CANCELLED.value

        # Reload variant to check stock
        await db_session.refresh(test_variant)
        assert test_variant.stock == initial_stock + 1  # 1 item in test_paid_order

    async def test_cancel_delivered_fails(
        self, db_session: AsyncSession, test_paid_order
    ):
        """Cannot cancel a delivered order."""
        test_paid_order.status = OrderStatus.DELIVERED.value
        await db_session.flush()

        with pytest.raises(InvalidStateTransitionError):
            await OrderService.cancel(db_session, test_paid_order.id)


class TestProcessRefund:
    """Tests for OrderService.process_refund."""

    async def test_refund_paid_order(
        self, db_session: AsyncSession, test_paid_order
    ):
        """Refund a paid order."""
        order = await OrderService.process_refund(db_session, test_paid_order.id)
        assert order.status == OrderStatus.REFUNDED.value

    async def test_refund_delivered_order(
        self, db_session: AsyncSession, test_paid_order
    ):
        """Refund a delivered order."""
        test_paid_order.status = OrderStatus.DELIVERED.value
        await db_session.flush()

        order = await OrderService.process_refund(db_session, test_paid_order.id)
        assert order.status == OrderStatus.REFUNDED.value

    async def test_refund_pending_fails(
        self, db_session: AsyncSession, test_order
    ):
        """Cannot refund a pending order (not yet paid)."""
        with pytest.raises(InvalidStateTransitionError):
            await OrderService.process_refund(db_session, test_order.id)

    async def test_refund_restores_stock(
        self, db_session: AsyncSession, test_paid_order, test_variant
    ):
        """Refunding restores stock for all items."""
        initial_stock = test_variant.stock
        await OrderService.process_refund(
            db_session, test_paid_order.id, restore_stock=True
        )

        await db_session.refresh(test_variant)
        assert test_variant.stock == initial_stock + 1


class TestShipOrder:
    """Tests for OrderService.ship_order."""

    async def test_ship_from_processing(
        self, db_session: AsyncSession, test_paid_order
    ):
        """Ship a processing order."""
        test_paid_order.status = OrderStatus.PROCESSING.value
        await db_session.flush()

        order = await OrderService.ship_order(
            db_session, test_paid_order.id, tracking_number="TRACK-LV-001"
        )
        assert order.status == OrderStatus.SHIPPED.value
        assert order.tracking_number == "TRACK-LV-001"

    async def test_ship_without_tracking(
        self, db_session: AsyncSession, test_paid_order
    ):
        """Ship without tracking number."""
        test_paid_order.status = OrderStatus.PROCESSING.value
        await db_session.flush()

        order = await OrderService.ship_order(db_session, test_paid_order.id)
        assert order.status == OrderStatus.SHIPPED.value

    async def test_ship_from_pending_fails(
        self, db_session: AsyncSession, test_order
    ):
        """Cannot ship a pending order."""
        with pytest.raises(InvalidStateTransitionError):
            await OrderService.ship_order(db_session, test_order.id)


class TestMarkDelivered:
    """Tests for OrderService.mark_delivered."""

    async def test_deliver_shipped_order(
        self, db_session: AsyncSession, test_paid_order
    ):
        """Mark shipped order as delivered."""
        test_paid_order.status = OrderStatus.SHIPPED.value
        await db_session.flush()

        order = await OrderService.mark_delivered(db_session, test_paid_order.id)
        assert order.status == OrderStatus.DELIVERED.value

    async def test_deliver_processing_fails(
        self, db_session: AsyncSession, test_paid_order
    ):
        """Cannot deliver a processing order (must be shipped first)."""
        test_paid_order.status = OrderStatus.PROCESSING.value
        await db_session.flush()

        with pytest.raises(InvalidStateTransitionError):
            await OrderService.mark_delivered(db_session, test_paid_order.id)


class TestFullLifecycle:
    """Full order lifecycle integration test."""

    async def test_full_lifecycle_pending_to_delivered(
        self, db_session: AsyncSession, test_order
    ):
        """Test complete lifecycle: pending → paid → processing → shipped → delivered."""
        # pending → paid
        order = await OrderService.mark_paid(
            db_session, test_order.id, stripe_payment_id="pi_lifecycle"
        )
        assert order.status == OrderStatus.PAID.value

        # paid → processing
        order = await OrderService.transition_status(
            db_session, test_order.id, OrderStatus.PROCESSING
        )
        assert order.status == OrderStatus.PROCESSING.value

        # processing → shipped
        order = await OrderService.ship_order(
            db_session, test_order.id, tracking_number="TRACK-LIFECYCLE"
        )
        assert order.status == OrderStatus.SHIPPED.value
        assert order.tracking_number == "TRACK-LIFECYCLE"

        # shipped → delivered
        order = await OrderService.mark_delivered(db_session, test_order.id)
        assert order.status == OrderStatus.DELIVERED.value

    async def test_lifecycle_with_refund(
        self, db_session: AsyncSession, test_order, test_variant
    ):
        """Test lifecycle ending in refund: pending → paid → refunded."""
        initial_stock = test_variant.stock

        order = await OrderService.mark_paid(
            db_session, test_order.id, stripe_payment_id="pi_refund"
        )
        assert order.status == OrderStatus.PAID.value

        order = await OrderService.process_refund(
            db_session, test_order.id, restore_stock=True
        )
        assert order.status == OrderStatus.REFUNDED.value

        await db_session.refresh(test_variant)
        assert test_variant.stock == initial_stock + 1
