"""
Tests for Stripe payment integration.
"""

import pytest
from decimal import Decimal
from unittest.mock import patch, AsyncMock, MagicMock

from app.models import Order, OrderItem, OrderStatus


class TestCreateCheckout:
    """Tests for creating Stripe checkout sessions."""

    @pytest.mark.asyncio
    async def test_create_checkout_success(
        self, auth_client, test_order, mock_stripe_service
    ):
        """Successfully create a checkout session for a pending order."""
        with patch("app.api.payments.StripeService", mock_stripe_service):
            response = await auth_client.post(
                f"/api/payments/create-checkout?order_id={test_order.id}"
            )

        assert response.status_code == 200
        data = response.json()
        assert "checkout_url" in data
        assert "checkout.stripe.com" in data["checkout_url"]

    @pytest.mark.asyncio
    async def test_create_checkout_order_not_found(self, auth_client, mock_stripe_service):
        """Return 404 for non-existent order."""
        with patch("app.api.payments.StripeService", mock_stripe_service):
            response = await auth_client.post(
                "/api/payments/create-checkout?order_id=99999"
            )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_create_checkout_already_paid(
        self, auth_client, test_paid_order, mock_stripe_service
    ):
        """Return 400 for already paid order."""
        with patch("app.api.payments.StripeService", mock_stripe_service):
            response = await auth_client.post(
                f"/api/payments/create-checkout?order_id={test_paid_order.id}"
            )

        assert response.status_code == 400
        assert "already processed" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_create_checkout_other_users_order(
        self, client, db_session, test_user, test_variant, mock_stripe_service
    ):
        """Authenticated user cannot create checkout for another user's order."""
        from app.models import Order, OrderItem, OrderStatus, User
        from app.services import AuthService

        # Create a second user
        other_user = User(
            email="other@example.com",
            password_hash=AuthService.get_password_hash("OtherPass123"),
            is_guest=False,
            is_active=True,
        )
        db_session.add(other_user)
        await db_session.flush()

        # Create an order for the second user
        other_order = Order(
            user_id=other_user.id,
            status=OrderStatus.PENDING.value,
            total=Decimal("24.99"),
            shipping_name="Other User",
            shipping_address="456 Other Street",
            shipping_city="Riga",
            shipping_postal_code="LV-1002",
            shipping_country="Latvia",
        )
        db_session.add(other_order)
        await db_session.flush()

        order_item = OrderItem(
            order_id=other_order.id,
            variant_id=test_variant.id,
            quantity=1,
            price=Decimal("24.99"),
        )
        db_session.add(order_item)
        await db_session.commit()

        # Get token for original test_user (not the order owner)
        token = AuthService.create_access_token(data={"sub": str(test_user.id)})
        client.headers["Authorization"] = f"Bearer {token}"

        with patch("app.api.payments.StripeService", mock_stripe_service):
            response = await client.post(
                f"/api/payments/create-checkout?order_id={other_order.id}"
            )

        # Order not found because it belongs to other_user, not test_user
        assert response.status_code == 404


class TestStripeWebhook:
    """Tests for Stripe webhook handling."""

    @pytest.mark.asyncio
    async def test_webhook_missing_signature(self, client):
        """Reject webhooks without signature header."""
        response = await client.post(
            "/api/payments/webhooks/stripe",
            content=b"{}",
        )

        assert response.status_code == 400
        assert "signature" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_webhook_checkout_completed(
        self,
        client,
        db_session,
        test_order,
        stripe_checkout_completed_event,
    ):
        """Process checkout.session.completed webhook."""
        # Update the event with the actual order ID
        stripe_checkout_completed_event["data"]["object"]["metadata"]["order_id"] = str(
            test_order.id
        )

        with patch("app.api.payments.StripeService") as mock_stripe:
            mock_stripe.construct_webhook_event = MagicMock(
                return_value=stripe_checkout_completed_event
            )

            response = await client.post(
                "/api/payments/webhooks/stripe",
                content=b"test_payload",
                headers={"stripe-signature": "test_sig"},
            )

        assert response.status_code == 200
        assert response.json()["status"] == "ok"

        # Verify order status updated
        from sqlalchemy import select
        from app.models import Order

        result = await db_session.execute(
            select(Order).where(Order.id == test_order.id)
        )
        order = result.scalar_one()
        assert order.status == OrderStatus.PAID.value

    @pytest.mark.asyncio
    async def test_webhook_checkout_expired(
        self,
        client,
        db_session,
        test_order,
        stripe_checkout_expired_event,
    ):
        """Process checkout.session.expired webhook."""
        stripe_checkout_expired_event["data"]["object"]["metadata"]["order_id"] = str(
            test_order.id
        )

        with patch("app.api.payments.StripeService") as mock_stripe:
            mock_stripe.construct_webhook_event = MagicMock(
                return_value=stripe_checkout_expired_event
            )

            response = await client.post(
                "/api/payments/webhooks/stripe",
                content=b"test_payload",
                headers={"stripe-signature": "test_sig"},
            )

        assert response.status_code == 200

        # Verify order status updated to cancelled
        from sqlalchemy import select
        from app.models import Order

        result = await db_session.execute(
            select(Order).where(Order.id == test_order.id)
        )
        order = result.scalar_one()
        assert order.status == OrderStatus.CANCELLED.value

    @pytest.mark.asyncio
    async def test_webhook_invalid_signature(self, client):
        """Reject webhooks with invalid signature."""
        with patch("app.api.payments.StripeService") as mock_stripe:
            mock_stripe.construct_webhook_event = MagicMock(
                side_effect=Exception("Invalid signature")
            )

            response = await client.post(
                "/api/payments/webhooks/stripe",
                content=b"test_payload",
                headers={"stripe-signature": "invalid_sig"},
            )

        assert response.status_code == 400
        assert "invalid" in response.json()["detail"]["message"].lower()

    @pytest.mark.asyncio
    async def test_webhook_idempotent_handling(
        self,
        client,
        db_session,
        test_paid_order,
        stripe_checkout_completed_event,
    ):
        """Handle duplicate webhooks gracefully (idempotent)."""
        stripe_checkout_completed_event["data"]["object"]["metadata"]["order_id"] = str(
            test_paid_order.id
        )

        with patch("app.api.payments.StripeService") as mock_stripe:
            mock_stripe.construct_webhook_event = MagicMock(
                return_value=stripe_checkout_completed_event
            )

            # First webhook (should succeed but order already paid)
            response = await client.post(
                "/api/payments/webhooks/stripe",
                content=b"test_payload",
                headers={"stripe-signature": "test_sig"},
            )

        # Should return OK even for duplicate (idempotent)
        assert response.status_code == 200


class TestGetCheckoutSession:
    """Tests for retrieving checkout session status."""

    @pytest.mark.asyncio
    async def test_get_session_success(self, client, mock_stripe_service):
        """Successfully retrieve a checkout session."""
        with patch("app.api.payments.StripeService", mock_stripe_service):
            response = await client.get("/api/payments/session/cs_test_123")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "payment_status" in data

    @pytest.mark.asyncio
    async def test_get_session_not_found(self, client):
        """Return 404 for non-existent session."""
        with patch("app.api.payments.StripeService") as mock_stripe:
            mock_stripe.retrieve_session = AsyncMock(
                side_effect=Exception("No such session")
            )

            response = await client.get("/api/payments/session/cs_nonexistent")

        assert response.status_code == 404


class TestGuestCheckout:
    """Tests for guest checkout support in payments API."""

    @pytest.fixture
    async def guest_order(self, db_session, test_guest_session, test_variant):
        """Create an order for a guest user."""
        order = Order(
            user_id=None,
            guest_email=test_guest_session.email,
            status=OrderStatus.PENDING.value,
            total=Decimal("24.99"),
            shipping_name="Guest User",
            shipping_address="789 Guest Ave",
            shipping_city="Riga",
            shipping_postal_code="LV-1003",
            shipping_country="Latvia",
        )
        db_session.add(order)
        await db_session.flush()

        order_item = OrderItem(
            order_id=order.id,
            variant_id=test_variant.id,
            quantity=1,
            price=Decimal("24.99"),
        )
        db_session.add(order_item)
        await db_session.commit()
        await db_session.refresh(order)
        return order

    @pytest.mark.asyncio
    async def test_create_checkout_guest_session(
        self, client, test_guest_session, guest_order, mock_stripe_service
    ):
        """Guest with valid session can checkout their order."""
        with patch("app.api.payments.StripeService", mock_stripe_service):
            response = await client.post(
                f"/api/payments/create-checkout?order_id={guest_order.id}",
                headers={"X-Guest-Session": test_guest_session.session_token},
            )

        assert response.status_code == 200
        data = response.json()
        assert "checkout_url" in data

    @pytest.mark.asyncio
    async def test_create_checkout_no_auth_rejected(
        self, client, guest_order, mock_stripe_service
    ):
        """No user + no session should return 401."""
        with patch("app.api.payments.StripeService", mock_stripe_service):
            response = await client.post(
                f"/api/payments/create-checkout?order_id={guest_order.id}"
            )

        assert response.status_code == 401
        assert "authentication required" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_create_checkout_invalid_guest_session(
        self, client, guest_order, mock_stripe_service
    ):
        """Invalid session token should return 401."""
        with patch("app.api.payments.StripeService", mock_stripe_service):
            response = await client.post(
                f"/api/payments/create-checkout?order_id={guest_order.id}",
                headers={"X-Guest-Session": "invalid-token-12345"},
            )

        assert response.status_code == 401
        assert "invalid guest session" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_create_checkout_guest_wrong_order(
        self, client, db_session, test_guest_session, test_variant, mock_stripe_service
    ):
        """Guest cannot checkout another guest's order."""
        # Create order for a different guest email
        other_order = Order(
            user_id=None,
            guest_email="other-guest@example.com",
            status=OrderStatus.PENDING.value,
            total=Decimal("24.99"),
            shipping_name="Other Guest",
            shipping_address="999 Other St",
            shipping_city="Riga",
            shipping_postal_code="LV-1004",
            shipping_country="Latvia",
        )
        db_session.add(other_order)
        await db_session.flush()

        order_item = OrderItem(
            order_id=other_order.id,
            variant_id=test_variant.id,
            quantity=1,
            price=Decimal("24.99"),
        )
        db_session.add(order_item)
        await db_session.commit()

        with patch("app.api.payments.StripeService", mock_stripe_service):
            response = await client.post(
                f"/api/payments/create-checkout?order_id={other_order.id}",
                headers={"X-Guest-Session": test_guest_session.session_token},
            )

        # Should be 404 because order belongs to different guest
        assert response.status_code == 404
