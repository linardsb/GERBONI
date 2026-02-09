"""Tests for newsletter campaign admin endpoints."""

import pytest
from unittest.mock import patch, MagicMock


class TestCampaignCRUD:
    """Tests for campaign CRUD operations."""

    @pytest.mark.asyncio
    async def test_create_campaign(self, admin_client):
        """Admin can create a draft campaign."""
        response = await admin_client.post(
            "/api/admin/newsletters",
            json={
                "title": "Summer Sale",
                "subject": "Hot Summer Deals!",
                "intro_text": "Check out our latest collection.",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Summer Sale"
        assert data["status"] == "draft"
        assert data["recipient_count"] == 0

    @pytest.mark.asyncio
    async def test_create_campaign_with_products(self, admin_client, test_product):
        """Campaign can include featured product IDs."""
        response = await admin_client.post(
            "/api/admin/newsletters",
            json={
                "title": "New Arrivals",
                "subject": "New Products!",
                "intro_text": "See what's new.",
                "featured_product_ids": [test_product.id],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["featured_product_ids"] == [test_product.id]

    @pytest.mark.asyncio
    async def test_list_campaigns(self, admin_client):
        """List all campaigns."""
        await admin_client.post(
            "/api/admin/newsletters",
            json={"title": "First", "subject": "S1", "intro_text": "t1"},
        )
        await admin_client.post(
            "/api/admin/newsletters",
            json={"title": "Second", "subject": "S2", "intro_text": "t2"},
        )

        response = await admin_client.get("/api/admin/newsletters")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2
        titles = [c["title"] for c in data]
        assert "First" in titles
        assert "Second" in titles

    @pytest.mark.asyncio
    async def test_get_campaign(self, admin_client):
        """Get a single campaign by ID."""
        create = await admin_client.post(
            "/api/admin/newsletters",
            json={"title": "Detail", "subject": "S", "intro_text": "t"},
        )
        campaign_id = create.json()["id"]

        response = await admin_client.get(f"/api/admin/newsletters/{campaign_id}")
        assert response.status_code == 200
        assert response.json()["title"] == "Detail"

    @pytest.mark.asyncio
    async def test_get_campaign_not_found(self, admin_client):
        """Non-existent campaign returns 404."""
        response = await admin_client.get("/api/admin/newsletters/99999")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_draft(self, admin_client):
        """Update a draft campaign."""
        create = await admin_client.post(
            "/api/admin/newsletters",
            json={"title": "Old", "subject": "S", "intro_text": "t"},
        )
        campaign_id = create.json()["id"]

        response = await admin_client.put(
            f"/api/admin/newsletters/{campaign_id}",
            json={"title": "Updated Title"},
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Updated Title"

    @pytest.mark.asyncio
    async def test_delete_draft(self, admin_client):
        """Delete a draft campaign."""
        create = await admin_client.post(
            "/api/admin/newsletters",
            json={"title": "Delete Me", "subject": "S", "intro_text": "t"},
        )
        campaign_id = create.json()["id"]

        response = await admin_client.delete(f"/api/admin/newsletters/{campaign_id}")
        assert response.status_code == 200

        # Verify gone
        response = await admin_client.get(f"/api/admin/newsletters/{campaign_id}")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_non_admin_rejected(self, auth_client):
        """Regular users cannot access campaign endpoints."""
        response = await auth_client.get("/api/admin/newsletters")
        assert response.status_code == 403


class TestCampaignStateRules:
    """Tests for campaign state enforcement."""

    async def _create_and_send(self, admin_client, db_session):
        """Helper: create campaign and send it."""
        from app.models.newsletter import NewsletterSubscription

        # Add a subscriber so send actually processes
        sub = NewsletterSubscription(email="subscriber@example.com", is_active=True)
        db_session.add(sub)
        await db_session.commit()

        create = await admin_client.post(
            "/api/admin/newsletters",
            json={"title": "Sent", "subject": "S", "intro_text": "t"},
        )
        campaign_id = create.json()["id"]

        with patch("app.services.campaign_service.CampaignService._send_campaign_email", return_value=True):
            await admin_client.post(f"/api/admin/newsletters/{campaign_id}/send")

        return campaign_id

    @pytest.mark.asyncio
    async def test_cannot_edit_sent(self, admin_client, db_session):
        """Cannot update a sent campaign."""
        campaign_id = await self._create_and_send(admin_client, db_session)
        response = await admin_client.put(
            f"/api/admin/newsletters/{campaign_id}",
            json={"title": "Nope"},
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_cannot_delete_sent(self, admin_client, db_session):
        """Cannot delete a sent campaign."""
        campaign_id = await self._create_and_send(admin_client, db_session)
        response = await admin_client.delete(f"/api/admin/newsletters/{campaign_id}")
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_cannot_resend(self, admin_client, db_session):
        """Cannot send an already-sent campaign."""
        campaign_id = await self._create_and_send(admin_client, db_session)
        response = await admin_client.post(f"/api/admin/newsletters/{campaign_id}/send")
        assert response.status_code == 400


class TestCampaignSend:
    """Tests for campaign sending workflow."""

    @pytest.mark.asyncio
    async def test_send_no_subscribers(self, admin_client):
        """Sending with no subscribers completes with 0 counts."""
        create = await admin_client.post(
            "/api/admin/newsletters",
            json={"title": "Empty", "subject": "S", "intro_text": "t"},
        )
        campaign_id = create.json()["id"]

        response = await admin_client.post(f"/api/admin/newsletters/{campaign_id}/send")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "sent"
        assert data["recipient_count"] == 0
        assert data["sent_count"] == 0

    @pytest.mark.asyncio
    async def test_send_with_subscribers(self, admin_client, db_session):
        """Sending emails to active subscribers."""
        from app.models.newsletter import NewsletterSubscription

        sub1 = NewsletterSubscription(email="a@example.com", is_active=True)
        sub2 = NewsletterSubscription(email="b@example.com", is_active=True)
        db_session.add_all([sub1, sub2])
        await db_session.commit()

        create = await admin_client.post(
            "/api/admin/newsletters",
            json={"title": "Send Test", "subject": "S", "intro_text": "Hello!"},
        )
        campaign_id = create.json()["id"]

        with patch("app.services.campaign_service.CampaignService._send_campaign_email", return_value=True) as mock_send:
            response = await admin_client.post(f"/api/admin/newsletters/{campaign_id}/send")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "sent"
        assert data["recipient_count"] == 2
        assert data["sent_count"] == 2
        assert data["failed_count"] == 0
        assert mock_send.call_count == 2

    @pytest.mark.asyncio
    async def test_send_with_featured_products(self, admin_client, db_session, test_product):
        """Campaign with featured products includes them in email."""
        from app.models.newsletter import NewsletterSubscription

        sub = NewsletterSubscription(email="c@example.com", is_active=True)
        db_session.add(sub)
        await db_session.commit()

        create = await admin_client.post(
            "/api/admin/newsletters",
            json={
                "title": "Products",
                "subject": "S",
                "intro_text": "Check these out!",
                "featured_product_ids": [test_product.id],
            },
        )
        campaign_id = create.json()["id"]

        sent_html = []

        def capture_send(to_email, subject, html):
            sent_html.append(html)
            return True

        with patch(
            "app.services.campaign_service.CampaignService._send_campaign_email",
            side_effect=capture_send,
        ):
            response = await admin_client.post(f"/api/admin/newsletters/{campaign_id}/send")

        assert response.status_code == 200
        assert len(sent_html) == 1
        assert "Riga" in sent_html[0]

    @pytest.mark.asyncio
    async def test_send_partial_failure(self, admin_client, db_session):
        """Partial send failure tracks counts correctly."""
        from app.models.newsletter import NewsletterSubscription

        sub1 = NewsletterSubscription(email="ok@example.com", is_active=True)
        sub2 = NewsletterSubscription(email="fail@example.com", is_active=True)
        db_session.add_all([sub1, sub2])
        await db_session.commit()

        create = await admin_client.post(
            "/api/admin/newsletters",
            json={"title": "Partial", "subject": "S", "intro_text": "t"},
        )
        campaign_id = create.json()["id"]

        # First call succeeds, second fails
        with patch(
            "app.services.campaign_service.CampaignService._send_campaign_email",
            side_effect=[True, False],
        ):
            response = await admin_client.post(f"/api/admin/newsletters/{campaign_id}/send")

        data = response.json()
        assert data["sent_count"] == 1
        assert data["failed_count"] == 1
        assert data["status"] == "partial"  # partial: some succeeded, some failed
