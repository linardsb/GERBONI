"""
Tests for cart endpoints.
"""

import pytest
from httpx import AsyncClient

from app.models import User, GuestSession, TShirtVariant


class TestCartWithAuth:
    """Tests for cart operations with authenticated user."""

    async def test_get_empty_cart(self, auth_client: AsyncClient):
        """Test getting an empty cart."""
        response = await auth_client.get("/api/cart")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        # Total is returned as string (Decimal serialization)
        assert float(data["total"]) == 0
        assert data["item_count"] == 0

    async def test_add_to_cart(self, auth_client: AsyncClient, test_variant: TShirtVariant):
        """Test adding an item to cart."""
        response = await auth_client.post(
            "/api/cart",
            json={"variant_id": test_variant.id, "quantity": 2},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["quantity"] == 2
        assert data["item_count"] == 2

    async def test_add_to_cart_updates_quantity(
        self, auth_client: AsyncClient, test_variant: TShirtVariant
    ):
        """Test that adding same item increases quantity."""
        # Add first time
        await auth_client.post(
            "/api/cart",
            json={"variant_id": test_variant.id, "quantity": 1},
        )
        # Add again
        response = await auth_client.post(
            "/api/cart",
            json={"variant_id": test_variant.id, "quantity": 2},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["quantity"] == 3

    async def test_update_cart_item(self, auth_client: AsyncClient, test_variant: TShirtVariant):
        """Test updating cart item quantity."""
        # Add item first
        add_response = await auth_client.post(
            "/api/cart",
            json={"variant_id": test_variant.id, "quantity": 1},
        )
        item_id = add_response.json()["items"][0]["id"]

        # Update quantity
        response = await auth_client.put(
            f"/api/cart/{item_id}",
            json={"quantity": 5},
        )
        assert response.status_code == 200
        assert response.json()["items"][0]["quantity"] == 5

    async def test_remove_cart_item(self, auth_client: AsyncClient, test_variant: TShirtVariant):
        """Test removing item from cart."""
        # Add item first
        add_response = await auth_client.post(
            "/api/cart",
            json={"variant_id": test_variant.id, "quantity": 1},
        )
        item_id = add_response.json()["items"][0]["id"]

        # Remove item
        response = await auth_client.delete(f"/api/cart/{item_id}")
        assert response.status_code == 200
        assert response.json()["items"] == []

    async def test_add_nonexistent_variant(self, auth_client: AsyncClient):
        """Test adding non-existent variant fails."""
        response = await auth_client.post(
            "/api/cart",
            json={"variant_id": 99999, "quantity": 1},
        )
        assert response.status_code == 404

    async def test_add_zero_quantity(self, auth_client: AsyncClient, test_variant: TShirtVariant):
        """Test adding zero quantity doesn't add item to cart."""
        response = await auth_client.post(
            "/api/cart",
            json={"variant_id": test_variant.id, "quantity": 0},
        )
        # API accepts the request but cart should remain empty
        assert response.status_code == 200
        data = response.json()
        # Zero quantity means no item was actually added
        assert data["item_count"] == 0


class TestCartWithGuest:
    """Tests for cart operations with guest session."""

    async def test_guest_add_to_cart(
        self, client: AsyncClient, test_guest_session: GuestSession, test_variant: TShirtVariant
    ):
        """Test guest adding item to cart."""
        response = await client.post(
            "/api/cart",
            json={"variant_id": test_variant.id, "quantity": 1},
            headers={"X-Guest-Session": test_guest_session.session_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1

    async def test_guest_get_cart(
        self, client: AsyncClient, test_guest_session: GuestSession, test_variant: TShirtVariant
    ):
        """Test guest getting their cart."""
        # Add item first
        await client.post(
            "/api/cart",
            json={"variant_id": test_variant.id, "quantity": 2},
            headers={"X-Guest-Session": test_guest_session.session_token},
        )

        # Get cart
        response = await client.get(
            "/api/cart",
            headers={"X-Guest-Session": test_guest_session.session_token},
        )
        assert response.status_code == 200
        assert response.json()["item_count"] == 2

    async def test_cart_without_auth_or_guest(self, client: AsyncClient, test_variant: TShirtVariant):
        """Test cart operations without any auth returns empty cart or creates guest."""
        response = await client.get("/api/cart")
        # Depending on implementation, may return empty cart or 401
        assert response.status_code in [200, 401]


class TestCartTotal:
    """Tests for cart total calculation."""

    async def test_cart_total_calculation(
        self, auth_client: AsyncClient, test_variant: TShirtVariant
    ):
        """Test that cart total is calculated correctly."""
        # Add 3 items at 24.99 each
        response = await auth_client.post(
            "/api/cart",
            json={"variant_id": test_variant.id, "quantity": 3},
        )
        assert response.status_code == 200
        data = response.json()
        expected_total = float(test_variant.price) * 3
        # Total is returned as string (Decimal serialization)
        assert abs(float(data["total"]) - expected_total) < 0.01
