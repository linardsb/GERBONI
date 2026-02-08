"""
Tests for EmailService.

All tests mock the Resend API to avoid actual email sending.
"""

import pytest
from decimal import Decimal
from unittest.mock import patch, MagicMock

from app.services import EmailService


@pytest.fixture(autouse=True)
def mock_resend_configured():
    """Ensure EmailService considers itself configured in tests."""
    with patch("app.services.email_service.get_settings") as mock_settings:
        settings = MagicMock()
        settings.resend_api_key = "re_test_123"
        settings.from_email = "GERBONI <noreply@gerboni.lv>"
        settings.site_url = "https://gerboni.lv"
        settings.frontend_url = "http://localhost:3000"
        settings.debug = False
        mock_settings.return_value = settings
        yield settings


@pytest.fixture
def mock_resend_send():
    """Mock the resend.Emails.send method."""
    with patch("app.services.email_service.resend.Emails.send") as mock_send:
        mock_send.return_value = {"id": "email_123"}
        yield mock_send


class TestEmailServiceConfig:
    """Tests for email service configuration."""

    async def test_not_configured_returns_false(self):
        """EmailService returns False when API key is not set."""
        with patch("app.services.email_service.get_settings") as mock_settings:
            settings = MagicMock()
            settings.resend_api_key = ""
            mock_settings.return_value = settings
            result = await EmailService.send_password_reset("test@example.com", "token123")
            assert result is False

    async def test_is_configured_with_api_key(self):
        """EmailService reports configured when API key is set."""
        assert EmailService._is_configured() is True


class TestPasswordResetEmail:
    """Tests for password reset email."""

    async def test_send_password_reset_success(self, mock_resend_send):
        """Successfully send password reset email."""
        result = await EmailService.send_password_reset("user@example.com", "reset_token_abc")
        assert result is True
        mock_resend_send.assert_called_once()

        call_args = mock_resend_send.call_args[0][0]
        assert call_args["to"] == ["user@example.com"]
        assert "Reset" in call_args["subject"]
        assert "reset_token_abc" in call_args["html"]

    async def test_send_password_reset_includes_reset_url(self, mock_resend_send):
        """Password reset email contains the reset URL with token."""
        await EmailService.send_password_reset("user@example.com", "my_token")
        call_args = mock_resend_send.call_args[0][0]
        assert "reset-password?token=my_token" in call_args["html"]

    async def test_send_password_reset_failure(self, mock_resend_send):
        """Email send failure returns False, doesn't raise."""
        mock_resend_send.side_effect = Exception("API error")
        result = await EmailService.send_password_reset("user@example.com", "token")
        assert result is False


class TestOrderConfirmationEmail:
    """Tests for order confirmation email."""

    async def test_send_order_confirmation_success(self, mock_resend_send):
        """Successfully send order confirmation email."""
        result = await EmailService.send_order_confirmation(
            email="buyer@example.com",
            order_id=42,
            total=Decimal("49.98"),
            item_count=2,
        )
        assert result is True
        mock_resend_send.assert_called_once()

        call_args = mock_resend_send.call_args[0][0]
        assert call_args["to"] == ["buyer@example.com"]
        assert "#42" in call_args["subject"]
        assert "49.98" in call_args["html"]
        assert "2" in call_args["html"]

    async def test_send_order_confirmation_failure(self, mock_resend_send):
        """Order confirmation email failure returns False, doesn't raise."""
        mock_resend_send.side_effect = Exception("Network error")
        result = await EmailService.send_order_confirmation(
            email="buyer@example.com",
            order_id=1,
            total=Decimal("24.99"),
            item_count=1,
        )
        assert result is False


class TestShippingNotificationEmail:
    """Tests for shipping notification email."""

    async def test_send_shipping_notification_success(self, mock_resend_send):
        """Successfully send shipping notification email."""
        result = await EmailService.send_shipping_notification(
            email="buyer@example.com",
            order_id=42,
            tracking_number="LV123456789",
        )
        assert result is True
        mock_resend_send.assert_called_once()

        call_args = mock_resend_send.call_args[0][0]
        assert call_args["to"] == ["buyer@example.com"]
        assert "#42" in call_args["subject"]
        assert "LV123456789" in call_args["html"]

    async def test_send_shipping_notification_without_tracking(self, mock_resend_send):
        """Shipping notification works without tracking number."""
        result = await EmailService.send_shipping_notification(
            email="buyer@example.com",
            order_id=42,
        )
        assert result is True
        call_args = mock_resend_send.call_args[0][0]
        assert "Tracking Number" not in call_args["html"]

    async def test_send_shipping_notification_failure(self, mock_resend_send):
        """Shipping notification failure returns False, doesn't raise."""
        mock_resend_send.side_effect = Exception("API error")
        result = await EmailService.send_shipping_notification(
            email="buyer@example.com",
            order_id=1,
        )
        assert result is False


class TestNewsletterWelcomeEmail:
    """Tests for newsletter welcome email."""

    async def test_send_newsletter_welcome_success(self, mock_resend_send):
        """Successfully send newsletter welcome email."""
        result = await EmailService.send_newsletter_welcome("subscriber@example.com")
        assert result is True
        mock_resend_send.assert_called_once()

        call_args = mock_resend_send.call_args[0][0]
        assert call_args["to"] == ["subscriber@example.com"]
        assert "Welcome" in call_args["subject"]

    async def test_send_newsletter_welcome_failure(self, mock_resend_send):
        """Newsletter welcome failure returns False, doesn't raise."""
        mock_resend_send.side_effect = Exception("Rate limit")
        result = await EmailService.send_newsletter_welcome("subscriber@example.com")
        assert result is False
