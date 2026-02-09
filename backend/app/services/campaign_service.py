"""Newsletter campaign management service."""

import json
import logging
from datetime import datetime, timezone
from decimal import Decimal

import resend
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..models import NewsletterCampaign, Product
from ..models.newsletter import NewsletterSubscription
from ..exceptions import EntityNotFoundError, InvalidStateTransitionError

logger = logging.getLogger(__name__)


class CampaignService:
    """Newsletter campaign business logic. HTTP-agnostic."""

    @staticmethod
    async def create(
        db: AsyncSession,
        title: str,
        subject: str,
        intro_text: str,
        featured_product_ids: list[int] | None,
        created_by: int,
    ) -> NewsletterCampaign:
        campaign = NewsletterCampaign(
            title=title,
            subject=subject,
            intro_text=intro_text,
            featured_product_ids=json.dumps(featured_product_ids) if featured_product_ids else None,
            created_by=created_by,
        )
        db.add(campaign)
        await db.flush()
        return campaign

    @staticmethod
    async def get(db: AsyncSession, campaign_id: int) -> NewsletterCampaign:
        result = await db.execute(
            select(NewsletterCampaign).where(NewsletterCampaign.id == campaign_id)
        )
        campaign = result.scalar_one_or_none()
        if not campaign:
            raise EntityNotFoundError(f"Campaign {campaign_id} not found")
        return campaign

    @staticmethod
    async def list_all(db: AsyncSession) -> list[NewsletterCampaign]:
        result = await db.execute(
            select(NewsletterCampaign).order_by(NewsletterCampaign.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def update(
        db: AsyncSession,
        campaign_id: int,
        title: str | None = None,
        subject: str | None = None,
        intro_text: str | None = None,
        featured_product_ids: list[int] | None = None,
    ) -> NewsletterCampaign:
        campaign = await CampaignService.get(db, campaign_id)
        if campaign.status != "draft":
            raise InvalidStateTransitionError("Only draft campaigns can be edited")

        if title is not None:
            campaign.title = title
        if subject is not None:
            campaign.subject = subject
        if intro_text is not None:
            campaign.intro_text = intro_text
        if featured_product_ids is not None:
            campaign.featured_product_ids = json.dumps(featured_product_ids) if featured_product_ids else None

        await db.flush()
        return campaign

    @staticmethod
    async def delete(db: AsyncSession, campaign_id: int) -> None:
        campaign = await CampaignService.get(db, campaign_id)
        if campaign.status != "draft":
            raise InvalidStateTransitionError("Only draft campaigns can be deleted")
        await db.delete(campaign)
        await db.flush()

    @staticmethod
    async def send(db: AsyncSession, campaign_id: int) -> NewsletterCampaign:
        campaign = await CampaignService.get(db, campaign_id)
        if campaign.status != "draft":
            raise InvalidStateTransitionError("Only draft campaigns can be sent")

        # Query active subscribers
        result = await db.execute(
            select(NewsletterSubscription).where(NewsletterSubscription.is_active == True)
        )
        subscribers = list(result.scalars().all())

        campaign.status = "sending"
        campaign.recipient_count = len(subscribers)
        await db.flush()

        if not subscribers:
            campaign.status = "sent"
            campaign.sent_at = datetime.now(timezone.utc)
            await db.flush()
            return campaign

        # Load featured products if any
        products = []
        product_ids = json.loads(campaign.featured_product_ids) if campaign.featured_product_ids else []
        if product_ids:
            result = await db.execute(
                select(Product).where(Product.id.in_(product_ids))
            )
            products = list(result.scalars().all())

        # Build email HTML
        html = CampaignService._build_email_html(campaign, products)

        # Send to each subscriber
        sent = 0
        failed = 0
        for sub in subscribers:
            success = CampaignService._send_campaign_email(
                to_email=sub.email,
                subject=campaign.subject,
                html=html,
            )
            if success:
                sent += 1
            else:
                failed += 1

        campaign.sent_count = sent
        campaign.failed_count = failed
        campaign.status = "sent" if failed == 0 else ("failed" if sent == 0 else "sent")
        campaign.sent_at = datetime.now(timezone.utc)
        await db.flush()
        return campaign

    @staticmethod
    def _build_email_html(campaign: NewsletterCampaign, products: list) -> str:
        settings = get_settings()

        product_cards = ""
        for p in products:
            product_url = f"{settings.frontend_url}/en/products/{p.id}"
            image_url = f"{settings.frontend_url}{p.coat_of_arms_image}" if p.coat_of_arms_image else ""
            product_cards += f"""
            <div style="display: inline-block; width: 200px; margin: 8px; vertical-align: top;
                        border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                {f'<img src="{image_url}" alt="{p.city_name}" style="width: 100%; height: 150px; object-fit: cover;">' if image_url else ''}
                <div style="padding: 12px;">
                    <p style="margin: 0; font-weight: bold;">{p.city_name}</p>
                    <a href="{product_url}"
                       style="display: inline-block; margin-top: 8px; color: #0891b2; text-decoration: none;">
                        View Product &rarr;
                    </a>
                </div>
            </div>
            """

        products_section = ""
        if product_cards:
            products_section = f"""
            <div style="margin: 24px 0;">
                <h2 style="color: #1a1a1a; font-size: 18px;">Featured Products</h2>
                <div style="text-align: center;">
                    {product_cards}
                </div>
            </div>
            """

        unsubscribe_url = f"{settings.frontend_url}/en/unsubscribe"

        return f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #0891b2; padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">GERBONI</h1>
            </div>
            <div style="padding: 24px;">
                <p style="font-size: 16px; line-height: 1.6; color: #333;">
                    {campaign.intro_text}
                </p>
                {products_section}
            </div>
            <div style="border-top: 1px solid #eee; padding: 16px; text-align: center;">
                <p style="color: #999; font-size: 12px;">
                    GERBONI - Latvian City Coat of Arms T-Shirts
                </p>
                <p style="color: #999; font-size: 12px;">
                    <a href="{unsubscribe_url}" style="color: #999;">Unsubscribe</a>
                </p>
            </div>
        </div>
        """

    @staticmethod
    def _send_campaign_email(to_email: str, subject: str, html: str) -> bool:
        settings = get_settings()
        if not settings.resend_api_key:
            logger.warning("Email not configured, skipping campaign email")
            return False

        resend.api_key = settings.resend_api_key
        try:
            resend.Emails.send({
                "from": settings.from_email,
                "to": [to_email],
                "subject": subject,
                "html": html,
            })
            return True
        except Exception as e:
            logger.error(f"Failed to send campaign email to {to_email}: {e}")
            return False
