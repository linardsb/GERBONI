"""
Tests for order endpoints.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Order, OrderItem, TShirtVariant, OrderStatus


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
