"""
Tests for newsletter endpoints.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import NewsletterSubscription


class TestSubscribeNewsletter:
    """Tests for POST /api/newsletter/subscribe"""

    async def test_subscribe_new_email(self, client: AsyncClient):
        """Test subscribing a new email to newsletter."""
        response = await client.post(
            "/api/newsletter/subscribe",
            json={
                "email": "new@example.com",
                "source": "popup",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    async def test_subscribe_existing_active(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test subscribing email that is already active returns success (prevents enumeration)."""
        subscription = NewsletterSubscription(
            email="existing@example.com",
            is_active=True,
            source="footer",
        )
        db_session.add(subscription)
        await db_session.commit()

        response = await client.post(
            "/api/newsletter/subscribe",
            json={
                "email": "existing@example.com",
                "source": "popup",
            },
        )
        # Returns success to prevent email enumeration
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    async def test_resubscribe_inactive_email(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test resubscribing email that was previously unsubscribed."""
        subscription = NewsletterSubscription(
            email="inactive@example.com",
            is_active=False,
            source="footer",
        )
        db_session.add(subscription)
        await db_session.commit()

        response = await client.post(
            "/api/newsletter/subscribe",
            json={
                "email": "inactive@example.com",
                "source": "checkout",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    async def test_subscribe_invalid_email(self, client: AsyncClient):
        """Test subscribing with invalid email format."""
        response = await client.post(
            "/api/newsletter/subscribe",
            json={
                "email": "not-an-email",
                "source": "popup",
            },
        )
        assert response.status_code == 422


class TestUnsubscribeNewsletter:
    """Tests for POST /api/newsletter/unsubscribe"""

    async def test_unsubscribe_existing_active(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test unsubscribing an active subscription."""
        subscription = NewsletterSubscription(
            email="unsubscribe@example.com",
            is_active=True,
            source="popup",
        )
        db_session.add(subscription)
        await db_session.commit()

        response = await client.post(
            "/api/newsletter/unsubscribe",
            json={"email": "unsubscribe@example.com"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    async def test_unsubscribe_nonexistent_returns_success(self, client: AsyncClient):
        """Test unsubscribing nonexistent email returns success (prevents enumeration)."""
        response = await client.post(
            "/api/newsletter/unsubscribe",
            json={"email": "nonexistent@example.com"},
        )
        # Always returns success to prevent email enumeration
        assert response.status_code == 200

    async def test_unsubscribe_invalid_email(self, client: AsyncClient):
        """Test unsubscribing with invalid email format."""
        response = await client.post(
            "/api/newsletter/unsubscribe",
            json={"email": "not-an-email"},
        )
        assert response.status_code == 422


class TestNewsletterStatus:
    """Tests for GET /api/newsletter/status (requires authentication)"""

    async def test_status_requires_auth(self, client: AsyncClient):
        """Test that status endpoint requires authentication."""
        response = await client.get("/api/newsletter/status")
        assert response.status_code == 401

    async def test_status_subscribed(
        self, auth_client: AsyncClient, db_session: AsyncSession
    ):
        """Test checking status when authenticated user is subscribed."""
        subscription = NewsletterSubscription(
            email="test@example.com",
            is_active=True,
            source="popup",
        )
        db_session.add(subscription)
        await db_session.commit()

        response = await auth_client.get("/api/newsletter/status")
        assert response.status_code == 200
        data = response.json()
        assert data["subscribed"] is True

    async def test_status_not_subscribed(self, auth_client: AsyncClient):
        """Test checking status when authenticated user is not subscribed."""
        response = await auth_client.get("/api/newsletter/status")
        assert response.status_code == 200
        data = response.json()
        assert data["subscribed"] is False

    async def test_status_inactive(
        self, auth_client: AsyncClient, db_session: AsyncSession
    ):
        """Test checking status when subscription is inactive."""
        subscription = NewsletterSubscription(
            email="test@example.com",
            is_active=False,
            source="footer",
        )
        db_session.add(subscription)
        await db_session.commit()

        response = await auth_client.get("/api/newsletter/status")
        assert response.status_code == 200
        data = response.json()
        assert data["subscribed"] is False
