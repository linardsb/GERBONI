"""
Tests for review endpoints.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Review, ReviewHelpful, Product


class TestListReviews:
    """Tests for GET /api/products/{id}/reviews"""

    async def test_list_reviews_empty(self, client: AsyncClient, test_product: Product):
        """Test listing reviews when none exist."""
        response = await client.get(f"/api/products/{test_product.id}/reviews")
        assert response.status_code == 200
        data = response.json()
        assert data["reviews"] == []
        assert data["total"] == 0

    async def test_list_reviews_with_data(
        self, client: AsyncClient, db_session: AsyncSession, test_product: Product, test_user
    ):
        """Test listing reviews with data."""
        review = Review(
            product_id=test_product.id,
            user_id=test_user.id,
            rating=5,
            title="Great shirt!",
            content="Love the design and quality.",
            is_verified_purchase=True,
        )
        db_session.add(review)
        await db_session.commit()

        response = await client.get(f"/api/products/{test_product.id}/reviews")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["reviews"]) == 1
        assert data["reviews"][0]["rating"] == 5
        assert data["reviews"][0]["title"] == "Great shirt!"

    async def test_list_reviews_pagination(
        self, client: AsyncClient, db_session: AsyncSession, test_product: Product
    ):
        """Test review pagination."""
        from app.models import User
        from app.services import AuthService

        # Create multiple users and reviews (unique constraint: one review per user per product)
        for i in range(15):
            user = User(
                email=f"reviewer{i}@example.com",
                password_hash=AuthService.get_password_hash("TestPass123"),
                is_guest=False,
                is_active=True,
            )
            db_session.add(user)
            await db_session.flush()

            review = Review(
                product_id=test_product.id,
                user_id=user.id,
                rating=4 + (i % 2),
                title=f"Review {i}",
            )
            db_session.add(review)
        await db_session.commit()

        # Get first page
        response = await client.get(
            f"/api/products/{test_product.id}/reviews?page=1&page_size=10"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["reviews"]) == 10
        assert data["total"] == 15


class TestCreateReview:
    """Tests for POST /api/products/{id}/reviews"""

    async def test_create_review_requires_auth(
        self, client: AsyncClient, test_product: Product
    ):
        """Test that creating review requires authentication."""
        response = await client.post(
            f"/api/products/{test_product.id}/reviews",
            json={
                "rating": 5,
                "title": "Great product",
                "content": "Really happy with this purchase!",
            },
        )
        assert response.status_code == 401

    async def test_create_review_success(
        self, auth_client: AsyncClient, test_product: Product
    ):
        """Test creating a review."""
        response = await auth_client.post(
            f"/api/products/{test_product.id}/reviews",
            json={
                "rating": 5,
                "title": "Great product",
                "content": "Really happy with this purchase!",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["rating"] == 5
        assert data["title"] == "Great product"

    async def test_create_review_duplicate_not_allowed(
        self, auth_client: AsyncClient, db_session: AsyncSession, test_product: Product, test_user
    ):
        """Test that duplicate reviews are not allowed."""
        # Create first review
        review = Review(
            product_id=test_product.id,
            user_id=test_user.id,
            rating=5,
            title="First review",
        )
        db_session.add(review)
        await db_session.commit()

        # Try to create second review
        response = await auth_client.post(
            f"/api/products/{test_product.id}/reviews",
            json={
                "rating": 4,
                "title": "Second review",
            },
        )
        assert response.status_code == 400

    async def test_create_review_invalid_rating(
        self, auth_client: AsyncClient, test_product: Product
    ):
        """Test creating review with invalid rating."""
        response = await auth_client.post(
            f"/api/products/{test_product.id}/reviews",
            json={
                "rating": 6,
                "title": "Invalid rating",
            },
        )
        assert response.status_code == 422


class TestUpdateReview:
    """Tests for PUT /api/reviews/{id}"""

    async def test_update_review_success(
        self, auth_client: AsyncClient, db_session: AsyncSession, test_product: Product, test_user
    ):
        """Test updating own review."""
        # Create review via API to avoid async session issues
        create_resp = await auth_client.post(
            f"/api/products/{test_product.id}/reviews",
            json={
                "rating": 4,
                "title": "Good product",
                "content": "Original content",
            },
        )
        assert create_resp.status_code == 200
        review_id = create_resp.json()["id"]

        response = await auth_client.put(
            f"/api/reviews/{review_id}",
            json={
                "rating": 5,
                "title": "Great product",
                "content": "Updated content - even better than I thought!",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["rating"] == 5

    async def test_update_review_requires_auth(self, client: AsyncClient):
        """Test that updating review requires authentication."""
        response = await client.put(
            "/api/reviews/1",
            json={
                "rating": 5,
                "title": "Updated",
            },
        )
        assert response.status_code == 401

    async def test_update_review_not_found(self, auth_client: AsyncClient):
        """Test updating non-existent review."""
        response = await auth_client.put(
            "/api/reviews/99999",
            json={
                "rating": 5,
                "title": "Updated",
            },
        )
        assert response.status_code == 404


class TestDeleteReview:
    """Tests for DELETE /api/reviews/{id}"""

    async def test_delete_review_success(
        self, auth_client: AsyncClient, db_session: AsyncSession, test_product: Product, test_user
    ):
        """Test deleting own review."""
        review = Review(
            product_id=test_product.id,
            user_id=test_user.id,
            rating=4,
            title="To be deleted",
        )
        db_session.add(review)
        await db_session.commit()
        await db_session.refresh(review)

        response = await auth_client.delete(f"/api/reviews/{review.id}")
        assert response.status_code == 200
        assert response.json()["status"] == "deleted"

    async def test_delete_review_requires_auth(self, client: AsyncClient):
        """Test that deleting review requires authentication."""
        response = await client.delete("/api/reviews/1")
        assert response.status_code == 401

    async def test_delete_review_not_found(self, auth_client: AsyncClient):
        """Test deleting non-existent review."""
        response = await auth_client.delete("/api/reviews/99999")
        assert response.status_code == 404


class TestReviewHelpful:
    """Tests for POST /api/reviews/{id}/helpful"""

    async def test_mark_review_helpful_as_user(
        self, auth_client: AsyncClient, db_session: AsyncSession, test_product: Product, test_user
    ):
        """Test marking review as helpful (authenticated user)."""
        review = Review(
            product_id=test_product.id,
            user_id=test_user.id,
            rating=5,
            title="Helpful review",
        )
        db_session.add(review)
        await db_session.commit()
        await db_session.refresh(review)

        response = await auth_client.post(f"/api/reviews/{review.id}/helpful")
        assert response.status_code == 200
        data = response.json()
        assert data["helpful_count"] == 1

    async def test_mark_review_helpful_as_guest(
        self, client: AsyncClient, db_session: AsyncSession, test_product: Product, test_user, test_guest_session
    ):
        """Test marking review as helpful (guest session)."""
        review = Review(
            product_id=test_product.id,
            user_id=test_user.id,
            rating=5,
            title="Helpful review",
        )
        db_session.add(review)
        await db_session.commit()
        await db_session.refresh(review)

        response = await client.post(
            f"/api/reviews/{review.id}/helpful",
            headers={"X-Guest-Session": test_guest_session.session_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["helpful_count"] == 1

    async def test_mark_review_helpful_duplicate_prevented(
        self, auth_client: AsyncClient, db_session: AsyncSession, test_product: Product, test_user
    ):
        """Test that marking same review helpful twice is handled."""
        review = Review(
            product_id=test_product.id,
            user_id=test_user.id,
            rating=5,
            title="Helpful review",
        )
        db_session.add(review)
        await db_session.commit()
        await db_session.refresh(review)

        # Mark as helpful first time
        response = await auth_client.post(f"/api/reviews/{review.id}/helpful")
        assert response.status_code == 200

        # Second call should still succeed (toggle or idempotent)
        response = await auth_client.post(f"/api/reviews/{review.id}/helpful")
        assert response.status_code in (200, 400)


class TestCanReview:
    """Tests for GET /api/products/{id}/can-review"""

    async def test_can_review_requires_auth(
        self, client: AsyncClient, test_product: Product
    ):
        """Test that checking review eligibility requires authentication."""
        response = await client.get(f"/api/products/{test_product.id}/can-review")
        assert response.status_code == 401

    async def test_can_review_without_purchase(
        self, auth_client: AsyncClient, test_product: Product
    ):
        """Test checking review eligibility without purchase."""
        response = await auth_client.get(f"/api/products/{test_product.id}/can-review")
        assert response.status_code == 200
        data = response.json()
        assert "can_review" in data

    async def test_can_review_after_existing_review(
        self, auth_client: AsyncClient, db_session: AsyncSession, test_product: Product, test_user
    ):
        """Test checking review eligibility after already reviewing."""
        review = Review(
            product_id=test_product.id,
            user_id=test_user.id,
            rating=5,
            title="Already reviewed",
        )
        db_session.add(review)
        await db_session.commit()

        response = await auth_client.get(f"/api/products/{test_product.id}/can-review")
        assert response.status_code == 200
        data = response.json()
        assert data["can_review"] is False
