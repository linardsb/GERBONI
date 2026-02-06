"""
Tests for wishlist endpoints.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import WishlistItem, Product


class TestGetWishlist:
    """Tests for GET /api/wishlist"""

    async def test_get_wishlist_requires_auth_or_session(self, client: AsyncClient):
        """Test that getting wishlist requires authentication or guest session."""
        response = await client.get("/api/wishlist")
        assert response.status_code in (401, 422)

    async def test_get_wishlist_empty_authenticated(self, auth_client: AsyncClient):
        """Test getting empty wishlist for authenticated user."""
        response = await auth_client.get("/api/wishlist")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["count"] == 0

    async def test_get_wishlist_empty_guest(
        self, client: AsyncClient, test_guest_session
    ):
        """Test getting empty wishlist for guest session."""
        response = await client.get(
            "/api/wishlist",
            headers={"X-Guest-Session": test_guest_session.session_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["count"] == 0

    async def test_get_wishlist_with_items_authenticated(
        self, auth_client: AsyncClient, db_session: AsyncSession, test_user, test_product: Product
    ):
        """Test getting wishlist with items for authenticated user."""
        wishlist_item = WishlistItem(
            user_id=test_user.id,
            product_id=test_product.id,
        )
        db_session.add(wishlist_item)
        await db_session.commit()

        response = await auth_client.get("/api/wishlist")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["product_id"] == test_product.id
        assert data["count"] == 1

    async def test_get_wishlist_with_items_guest(
        self, client: AsyncClient, db_session: AsyncSession, test_guest_session, test_product: Product
    ):
        """Test getting wishlist with items for guest session."""
        wishlist_item = WishlistItem(
            session_id=test_guest_session.id,
            product_id=test_product.id,
        )
        db_session.add(wishlist_item)
        await db_session.commit()

        response = await client.get(
            "/api/wishlist",
            headers={"X-Guest-Session": test_guest_session.session_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["product_id"] == test_product.id
        assert data["count"] == 1


class TestAddToWishlist:
    """Tests for POST /api/wishlist"""

    async def test_add_to_wishlist_requires_auth_or_session(self, client: AsyncClient):
        """Test that adding to wishlist requires authentication or guest session."""
        response = await client.post("/api/wishlist", json={"product_id": 1})
        assert response.status_code in (401, 422)

    async def test_add_to_wishlist_authenticated(
        self, auth_client: AsyncClient, test_product: Product
    ):
        """Test adding product to wishlist as authenticated user."""
        response = await auth_client.post(
            "/api/wishlist",
            json={"product_id": test_product.id},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["count"] >= 1

    async def test_add_to_wishlist_guest(
        self, client: AsyncClient, test_guest_session, test_product: Product
    ):
        """Test adding product to wishlist as guest."""
        response = await client.post(
            "/api/wishlist",
            json={"product_id": test_product.id},
            headers={"X-Guest-Session": test_guest_session.session_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["count"] >= 1

    async def test_add_to_wishlist_duplicate_prevented(
        self, auth_client: AsyncClient, db_session: AsyncSession, test_user, test_product: Product
    ):
        """Test that duplicate wishlist items are handled."""
        # Add item first time
        wishlist_item = WishlistItem(
            user_id=test_user.id,
            product_id=test_product.id,
        )
        db_session.add(wishlist_item)
        await db_session.commit()

        # Try to add again — should either reject (400) or handle gracefully (200)
        response = await auth_client.post(
            "/api/wishlist",
            json={"product_id": test_product.id},
        )
        assert response.status_code in (200, 400)

    async def test_add_to_wishlist_nonexistent_product(self, auth_client: AsyncClient):
        """Test adding non-existent product to wishlist."""
        response = await auth_client.post(
            "/api/wishlist",
            json={"product_id": 99999},
        )
        assert response.status_code == 404


class TestRemoveFromWishlist:
    """Tests for DELETE /api/wishlist/{product_id}"""

    async def test_remove_from_wishlist_requires_auth_or_session(
        self, client: AsyncClient
    ):
        """Test that removing from wishlist requires authentication or guest session."""
        response = await client.delete("/api/wishlist/1")
        assert response.status_code in (401, 422)

    async def test_remove_from_wishlist_authenticated(
        self, auth_client: AsyncClient, db_session: AsyncSession, test_user, test_product: Product
    ):
        """Test removing product from wishlist as authenticated user."""
        wishlist_item = WishlistItem(
            user_id=test_user.id,
            product_id=test_product.id,
        )
        db_session.add(wishlist_item)
        await db_session.commit()

        response = await auth_client.delete(f"/api/wishlist/{test_product.id}")
        assert response.status_code == 200

    async def test_remove_from_wishlist_guest(
        self, client: AsyncClient, db_session: AsyncSession, test_guest_session, test_product: Product
    ):
        """Test removing product from wishlist as guest."""
        wishlist_item = WishlistItem(
            session_id=test_guest_session.id,
            product_id=test_product.id,
        )
        db_session.add(wishlist_item)
        await db_session.commit()

        response = await client.delete(
            f"/api/wishlist/{test_product.id}",
            headers={"X-Guest-Session": test_guest_session.session_token},
        )
        assert response.status_code == 200

    async def test_remove_from_wishlist_not_found(self, auth_client: AsyncClient):
        """Test removing non-existent wishlist item."""
        response = await auth_client.delete("/api/wishlist/99999")
        assert response.status_code == 404


class TestCheckWishlist:
    """Tests for GET /api/wishlist/check/{product_id}"""

    async def test_check_wishlist_requires_auth_or_session(self, client: AsyncClient):
        """Test that checking wishlist requires authentication or guest session."""
        response = await client.get("/api/wishlist/check/1")
        assert response.status_code in (401, 422)

    async def test_check_wishlist_item_exists_authenticated(
        self, auth_client: AsyncClient, db_session: AsyncSession, test_user, test_product: Product
    ):
        """Test checking if product is in wishlist (authenticated user)."""
        wishlist_item = WishlistItem(
            user_id=test_user.id,
            product_id=test_product.id,
        )
        db_session.add(wishlist_item)
        await db_session.commit()

        response = await auth_client.get(f"/api/wishlist/check/{test_product.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["in_wishlist"] is True

    async def test_check_wishlist_item_not_exists_authenticated(
        self, auth_client: AsyncClient, test_product: Product
    ):
        """Test checking if product is not in wishlist (authenticated user)."""
        response = await auth_client.get(f"/api/wishlist/check/{test_product.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["in_wishlist"] is False

    async def test_check_wishlist_item_exists_guest(
        self, client: AsyncClient, db_session: AsyncSession, test_guest_session, test_product: Product
    ):
        """Test checking if product is in wishlist (guest session)."""
        wishlist_item = WishlistItem(
            session_id=test_guest_session.id,
            product_id=test_product.id,
        )
        db_session.add(wishlist_item)
        await db_session.commit()

        response = await client.get(
            f"/api/wishlist/check/{test_product.id}",
            headers={"X-Guest-Session": test_guest_session.session_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["in_wishlist"] is True

    async def test_check_wishlist_item_not_exists_guest(
        self, client: AsyncClient, test_guest_session, test_product: Product
    ):
        """Test checking if product is not in wishlist (guest session)."""
        response = await client.get(
            f"/api/wishlist/check/{test_product.id}",
            headers={"X-Guest-Session": test_guest_session.session_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["in_wishlist"] is False


class TestMoveToCart:
    """Tests for POST /api/wishlist/move-to-cart/{product_id}"""

    async def test_move_to_cart_requires_auth_or_session(
        self, client: AsyncClient
    ):
        """Moving to cart requires authentication or guest session."""
        response = await client.post(
            "/api/wishlist/move-to-cart/1",
            json={"variant_id": 1, "quantity": 1},
        )
        assert response.status_code in (401, 422)

    async def test_move_to_cart_authenticated(
        self,
        auth_client: AsyncClient,
        db_session: AsyncSession,
        test_user,
        test_product: Product,
        test_variant,
    ):
        """Move wishlist item to cart as authenticated user."""
        # Add to wishlist first
        wishlist_item = WishlistItem(
            user_id=test_user.id,
            product_id=test_product.id,
        )
        db_session.add(wishlist_item)
        await db_session.commit()

        response = await auth_client.post(
            f"/api/wishlist/move-to-cart/{test_product.id}",
            json={"variant_id": test_variant.id, "quantity": 1},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "moved_to_cart"

        # Verify removed from wishlist
        check_response = await auth_client.get(
            f"/api/wishlist/check/{test_product.id}"
        )
        assert check_response.json()["in_wishlist"] is False

    async def test_move_to_cart_guest(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        test_guest_session,
        test_product: Product,
        test_variant,
    ):
        """Move wishlist item to cart as guest."""
        wishlist_item = WishlistItem(
            session_id=test_guest_session.id,
            product_id=test_product.id,
        )
        db_session.add(wishlist_item)
        await db_session.commit()

        response = await client.post(
            f"/api/wishlist/move-to-cart/{test_product.id}",
            json={"variant_id": test_variant.id, "quantity": 1},
            headers={"X-Guest-Session": test_guest_session.session_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "moved_to_cart"

    async def test_move_to_cart_product_not_in_wishlist(
        self,
        auth_client: AsyncClient,
        test_variant,
    ):
        """Moving a product not in wishlist returns error."""
        response = await auth_client.post(
            "/api/wishlist/move-to-cart/99999",
            json={"variant_id": test_variant.id, "quantity": 1},
        )
        assert response.status_code in (400, 404)

    async def test_move_to_cart_verifies_cart_addition(
        self,
        auth_client: AsyncClient,
        db_session: AsyncSession,
        test_user,
        test_product: Product,
        test_variant,
    ):
        """After move-to-cart, item appears in cart."""
        wishlist_item = WishlistItem(
            user_id=test_user.id,
            product_id=test_product.id,
        )
        db_session.add(wishlist_item)
        await db_session.commit()

        await auth_client.post(
            f"/api/wishlist/move-to-cart/{test_product.id}",
            json={"variant_id": test_variant.id, "quantity": 1},
        )

        # Check cart has the item
        cart_response = await auth_client.get("/api/cart")
        assert cart_response.status_code == 200
        cart_data = cart_response.json()
        variant_ids = [item["variant_id"] for item in cart_data.get("items", [])]
        assert test_variant.id in variant_ids
