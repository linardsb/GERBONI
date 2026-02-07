"""
Tests for order endpoints.
"""

import pytest
from decimal import Decimal
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Order, OrderItem, TShirtVariant, OrderStatus, GuestSession


class TestCreateOrder:
    """Tests for POST /api/orders"""

    async def test_create_order_empty_cart(self, auth_client: AsyncClient):
        """Test creating order with empty cart fails."""
        response = await auth_client.post(
            "/api/orders",
            json={
                "shipping": {
                    "name": "Test User",
                    "address": "123 Test St",
                    "city": "Riga",
                    "postal_code": "LV-1001",
                    "country": "Latvia",
                }
            },
        )
        # Should fail because cart is empty
        assert response.status_code in [400, 422]

    async def test_create_order_success(
        self, auth_client: AsyncClient, test_variant: TShirtVariant
    ):
        """Test successful order creation."""
        # Add item to cart first
        await auth_client.post(
            "/api/cart",
            json={"variant_id": test_variant.id, "quantity": 2},
        )

        # Create order
        response = await auth_client.post(
            "/api/orders",
            json={
                "shipping": {
                    "name": "Test User",
                    "address": "123 Test St",
                    "city": "Riga",
                    "postal_code": "LV-1001",
                    "country": "Latvia",
                }
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "pending"
        assert len(data["items"]) == 1
        assert data["items"][0]["quantity"] == 2

    async def test_order_clears_cart(
        self, auth_client: AsyncClient, test_variant: TShirtVariant
    ):
        """Test that creating order clears the cart."""
        # Add item to cart
        await auth_client.post(
            "/api/cart",
            json={"variant_id": test_variant.id, "quantity": 1},
        )

        # Create order
        await auth_client.post(
            "/api/orders",
            json={
                "shipping": {
                    "name": "Test User",
                    "address": "123 Test St",
                    "city": "Riga",
                    "postal_code": "LV-1001",
                    "country": "Latvia",
                }
            },
        )

        # Check cart is empty
        cart_response = await auth_client.get("/api/cart")
        assert cart_response.json()["items"] == []


class TestListOrders:
    """Tests for GET /api/orders"""

    async def test_list_orders_empty(self, auth_client: AsyncClient):
        """Test listing orders when none exist."""
        response = await auth_client.get("/api/orders")
        assert response.status_code == 200
        assert response.json() == []

    async def test_list_orders_with_data(
        self, auth_client: AsyncClient, test_variant: TShirtVariant
    ):
        """Test listing orders with data."""
        # Create an order first
        await auth_client.post(
            "/api/cart",
            json={"variant_id": test_variant.id, "quantity": 1},
        )
        await auth_client.post(
            "/api/orders",
            json={
                "shipping": {
                    "name": "Test User",
                    "address": "123 Test St",
                    "city": "Riga",
                    "postal_code": "LV-1001",
                    "country": "Latvia",
                }
            },
        )

        # List orders
        response = await auth_client.get("/api/orders")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    async def test_list_orders_unauthenticated(self, client: AsyncClient):
        """Test listing orders without auth fails."""
        response = await client.get("/api/orders")
        assert response.status_code == 401


class TestGetOrder:
    """Tests for GET /api/orders/{id}"""

    async def test_get_order_success(
        self, auth_client: AsyncClient, test_variant: TShirtVariant
    ):
        """Test getting a specific order."""
        # Create an order first
        await auth_client.post(
            "/api/cart",
            json={"variant_id": test_variant.id, "quantity": 1},
        )
        create_response = await auth_client.post(
            "/api/orders",
            json={
                "shipping": {
                    "name": "Test User",
                    "address": "123 Test St",
                    "city": "Riga",
                    "postal_code": "LV-1001",
                    "country": "Latvia",
                }
            },
        )
        order_id = create_response.json()["id"]

        # Get order
        response = await auth_client.get(f"/api/orders/{order_id}")
        assert response.status_code == 200
        assert response.json()["id"] == order_id

    async def test_get_order_not_found(self, auth_client: AsyncClient):
        """Test getting a non-existent order."""
        response = await auth_client.get("/api/orders/99999")
        assert response.status_code == 404

    async def test_get_other_users_order(
        self, client: AsyncClient, db_session: AsyncSession, test_variant: TShirtVariant
    ):
        """Test that users cannot access other users' orders."""
        from app.services import AuthService

        # Create two users
        owner_user = User(
            email="owner@example.com",
            password_hash=AuthService.get_password_hash("TestPass123"),
            is_guest=False,
        )
        db_session.add(owner_user)

        other_user = User(
            email="other@example.com",
            password_hash=AuthService.get_password_hash("TestPass123"),
            is_guest=False,
        )
        db_session.add(other_user)
        await db_session.commit()
        await db_session.refresh(owner_user)
        await db_session.refresh(other_user)

        # Create an order for the owner user
        order = Order(
            user_id=owner_user.id,
            status=OrderStatus.PENDING.value,
            total=24.99,
        )
        db_session.add(order)
        await db_session.commit()
        await db_session.refresh(order)

        # Try to access with the other user's token
        other_token = AuthService.create_access_token(data={"sub": str(other_user.id)})
        response = await client.get(
            f"/api/orders/{order.id}",
            headers={"Authorization": f"Bearer {other_token}"},
        )
        # Should be not found or forbidden
        assert response.status_code in [401, 403, 404]


class TestOrderShipping:
    """Tests for order shipping information."""

    async def test_order_includes_shipping(
        self, auth_client: AsyncClient, test_variant: TShirtVariant
    ):
        """Test that order includes shipping information."""
        await auth_client.post(
            "/api/cart",
            json={"variant_id": test_variant.id, "quantity": 1},
        )

        response = await auth_client.post(
            "/api/orders",
            json={
                "shipping": {
                    "name": "John Doe",
                    "address": "456 Main St",
                    "city": "Riga",
                    "postal_code": "LV-1050",
                    "country": "Latvia",
                }
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["shipping_name"] == "John Doe"
        assert data["shipping_city"] == "Riga"
        assert data["shipping_country"] == "Latvia"


# =============================================================================
# Guest Session Order Access Tests (BUG-008 regression)
# =============================================================================


class TestGuestListOrders:
    """Tests for GET /api/orders with guest session."""

    async def test_guest_list_orders(
        self, client: AsyncClient, db_session: AsyncSession,
        test_guest_session: GuestSession, test_variant: TShirtVariant,
    ):
        """Guest with valid session can list their orders."""
        order = Order(
            guest_email=test_guest_session.email,
            status=OrderStatus.PENDING.value,
            total=Decimal("24.99"),
            shipping_name="Guest User",
            shipping_address="456 Guest St",
            shipping_city="Riga",
            shipping_postal_code="LV-1001",
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

        response = await client.get(
            "/api/orders",
            headers={"X-Guest-Session": test_guest_session.session_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["guest_email"] == test_guest_session.email

    async def test_guest_list_orders_invalid_session(self, client: AsyncClient):
        """Guest with invalid session token gets 401."""
        response = await client.get(
            "/api/orders",
            headers={"X-Guest-Session": "invalid-token-xyz"},
        )
        assert response.status_code == 401

    async def test_guest_list_orders_no_auth(self, client: AsyncClient):
        """No auth at all gets 401."""
        response = await client.get("/api/orders")
        assert response.status_code == 401

    async def test_guest_cannot_see_other_guest_orders(
        self, client: AsyncClient, db_session: AsyncSession,
        test_guest_session: GuestSession, test_variant: TShirtVariant,
    ):
        """Guest cannot see orders belonging to a different guest email."""
        order = Order(
            guest_email="other-guest@example.com",
            status=OrderStatus.PENDING.value,
            total=Decimal("24.99"),
            shipping_name="Other Guest",
            shipping_address="789 Other St",
            shipping_city="Riga",
            shipping_postal_code="LV-1001",
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

        response = await client.get(
            "/api/orders",
            headers={"X-Guest-Session": test_guest_session.session_token},
        )
        assert response.status_code == 200
        assert response.json() == []


class TestGuestGetOrder:
    """Tests for GET /api/orders/{id} with guest session."""

    async def test_guest_get_own_order(
        self, client: AsyncClient, db_session: AsyncSession,
        test_guest_session: GuestSession, test_variant: TShirtVariant,
    ):
        """Guest with valid session can get their own order."""
        order = Order(
            guest_email=test_guest_session.email,
            status=OrderStatus.PENDING.value,
            total=Decimal("24.99"),
            shipping_name="Guest User",
            shipping_address="456 Guest St",
            shipping_city="Riga",
            shipping_postal_code="LV-1001",
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

        response = await client.get(
            f"/api/orders/{order.id}",
            headers={"X-Guest-Session": test_guest_session.session_token},
        )
        assert response.status_code == 200
        assert response.json()["id"] == order.id

    async def test_guest_get_order_invalid_session(
        self, client: AsyncClient, db_session: AsyncSession,
        test_guest_session: GuestSession, test_variant: TShirtVariant,
    ):
        """Guest with invalid session token gets 401."""
        order = Order(
            guest_email=test_guest_session.email,
            status=OrderStatus.PENDING.value,
            total=Decimal("24.99"),
        )
        db_session.add(order)
        await db_session.commit()

        response = await client.get(
            f"/api/orders/{order.id}",
            headers={"X-Guest-Session": "invalid-token-xyz"},
        )
        assert response.status_code == 401

    async def test_guest_get_order_no_auth(
        self, client: AsyncClient, db_session: AsyncSession,
        test_guest_session: GuestSession,
    ):
        """No auth at all gets 401 (was security bug — returned any order)."""
        order = Order(
            guest_email=test_guest_session.email,
            status=OrderStatus.PENDING.value,
            total=Decimal("24.99"),
        )
        db_session.add(order)
        await db_session.commit()

        response = await client.get(f"/api/orders/{order.id}")
        assert response.status_code == 401

    async def test_guest_cannot_get_other_guest_order(
        self, client: AsyncClient, db_session: AsyncSession,
        test_guest_session: GuestSession,
    ):
        """Guest cannot access orders belonging to a different guest email."""
        order = Order(
            guest_email="other-guest@example.com",
            status=OrderStatus.PENDING.value,
            total=Decimal("24.99"),
        )
        db_session.add(order)
        await db_session.commit()

        response = await client.get(
            f"/api/orders/{order.id}",
            headers={"X-Guest-Session": test_guest_session.session_token},
        )
        assert response.status_code == 404
