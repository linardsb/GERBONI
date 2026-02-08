"""
Email sending service via Resend.

All methods are async-compatible and non-blocking.
Failures are logged but don't raise — email sending should never break user flows.
"""

import logging
from decimal import Decimal

import resend

from ..config import get_settings

logger = logging.getLogger(__name__)


class EmailService:
    """Email sending via Resend API."""

    @staticmethod
    def _is_configured() -> bool:
        settings = get_settings()
        return bool(settings.resend_api_key)

    @staticmethod
    def _init_resend() -> None:
        settings = get_settings()
        resend.api_key = settings.resend_api_key

    @staticmethod
    async def send_password_reset(email: str, token: str) -> bool:
        """
        Send password reset email.

        Returns True if sent successfully, False otherwise.
        """
        if not EmailService._is_configured():
            logger.warning("Email not configured, skipping password reset email")
            return False

        settings = get_settings()
        EmailService._init_resend()
        reset_url = f"{settings.frontend_url}/reset-password?token={token}"

        try:
            resend.Emails.send({
                "from": settings.from_email,
                "to": [email],
                "subject": "Reset Your GERBONI Password",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #1a1a1a;">Reset Your Password</h1>
                    <p>We received a request to reset your GERBONI account password.</p>
                    <p>Click the button below to set a new password. This link expires in 1 hour.</p>
                    <a href="{reset_url}"
                       style="display: inline-block; background: #0891b2; color: white;
                              padding: 12px 24px; border-radius: 6px; text-decoration: none;
                              font-weight: bold; margin: 16px 0;">
                        Reset Password
                    </a>
                    <p style="color: #666; font-size: 14px;">
                        If you didn't request this, you can safely ignore this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
                    <p style="color: #999; font-size: 12px;">GERBONI - Latvian City Coat of Arms T-Shirts</p>
                </div>
                """,
            })
            logger.info(f"Password reset email sent to {email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send password reset email to {email}: {e}")
            return False

    @staticmethod
    async def send_order_confirmation(
        email: str,
        order_id: int,
        total: Decimal,
        item_count: int,
    ) -> bool:
        """
        Send order confirmation email after successful payment.

        Returns True if sent successfully, False otherwise.
        """
        if not EmailService._is_configured():
            logger.warning("Email not configured, skipping order confirmation email")
            return False

        settings = get_settings()
        EmailService._init_resend()
        order_url = f"{settings.frontend_url}/en/orders"

        try:
            resend.Emails.send({
                "from": settings.from_email,
                "to": [email],
                "subject": f"Order Confirmed - GERBONI #{order_id}",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #1a1a1a;">Order Confirmed!</h1>
                    <p>Thank you for your purchase! Your order has been confirmed and is being processed.</p>
                    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
                        <p style="margin: 0;"><strong>Order:</strong> #{order_id}</p>
                        <p style="margin: 8px 0 0;"><strong>Items:</strong> {item_count}</p>
                        <p style="margin: 8px 0 0;"><strong>Total:</strong> &euro;{total:.2f}</p>
                    </div>
                    <a href="{order_url}"
                       style="display: inline-block; background: #0891b2; color: white;
                              padding: 12px 24px; border-radius: 6px; text-decoration: none;
                              font-weight: bold; margin: 16px 0;">
                        View Your Orders
                    </a>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
                    <p style="color: #999; font-size: 12px;">GERBONI - Latvian City Coat of Arms T-Shirts</p>
                </div>
                """,
            })
            logger.info(f"Order confirmation email sent for order #{order_id} to {email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send order confirmation for order #{order_id}: {e}")
            return False

    @staticmethod
    async def send_shipping_notification(
        email: str,
        order_id: int,
        tracking_number: str | None = None,
    ) -> bool:
        """
        Send shipping notification email when order ships.

        Returns True if sent successfully, False otherwise.
        """
        if not EmailService._is_configured():
            logger.warning("Email not configured, skipping shipping notification email")
            return False

        settings = get_settings()
        EmailService._init_resend()

        tracking_html = ""
        if tracking_number:
            tracking_html = f"""
            <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0;"><strong>Tracking Number:</strong> {tracking_number}</p>
            </div>
            """

        try:
            resend.Emails.send({
                "from": settings.from_email,
                "to": [email],
                "subject": f"Your Order #{order_id} Has Shipped!",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #1a1a1a;">Your Order Has Shipped!</h1>
                    <p>Great news! Your GERBONI order #{order_id} is on its way.</p>
                    {tracking_html}
                    <p>Estimated delivery: 3-7 business days within Latvia, 7-14 days internationally.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
                    <p style="color: #999; font-size: 12px;">GERBONI - Latvian City Coat of Arms T-Shirts</p>
                </div>
                """,
            })
            logger.info(f"Shipping notification sent for order #{order_id} to {email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send shipping notification for order #{order_id}: {e}")
            return False

    @staticmethod
    async def send_newsletter_welcome(email: str) -> bool:
        """
        Send welcome email to new newsletter subscribers.

        Returns True if sent successfully, False otherwise.
        """
        if not EmailService._is_configured():
            logger.warning("Email not configured, skipping newsletter welcome email")
            return False

        settings = get_settings()
        EmailService._init_resend()

        try:
            resend.Emails.send({
                "from": settings.from_email,
                "to": [email],
                "subject": "Welcome to GERBONI!",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #1a1a1a;">Welcome to GERBONI!</h1>
                    <p>Thank you for subscribing to our newsletter.</p>
                    <p>You'll be the first to know about new designs, exclusive offers,
                       and the stories behind Latvia's city coats of arms.</p>
                    <a href="{settings.frontend_url}/en/products"
                       style="display: inline-block; background: #0891b2; color: white;
                              padding: 12px 24px; border-radius: 6px; text-decoration: none;
                              font-weight: bold; margin: 16px 0;">
                        Browse Our Collection
                    </a>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
                    <p style="color: #999; font-size: 12px;">GERBONI - Latvian City Coat of Arms T-Shirts</p>
                </div>
                """,
            })
            logger.info(f"Newsletter welcome email sent to {email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send newsletter welcome to {email}: {e}")
            return False
