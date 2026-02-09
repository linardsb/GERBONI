from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import NewsletterSubscription, User
from ..schemas import NewsletterSubscribe, NewsletterUnsubscribe, MessageResponse
from ..services import EmailService
from ..middleware import limiter
from .deps import get_current_user_required

router = APIRouter()


@router.post("/subscribe", response_model=MessageResponse)
@limiter.limit("10/minute")  # Prevent abuse
async def subscribe(
    request: Request,
    data: NewsletterSubscribe,
    db: AsyncSession = Depends(get_db),
):
    """Subscribe to the newsletter."""
    # Check if already subscribed
    result = await db.execute(
        select(NewsletterSubscription).where(
            NewsletterSubscription.email == data.email.lower()
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        if existing.is_active:
            # Already subscribed, return success anyway to prevent email enumeration
            return MessageResponse(message="Thanks for subscribing! You'll receive 10% off your first order.")

        # Reactivate subscription
        existing.is_active = True
        existing.unsubscribed_at = None
        existing.source = data.source
        await db.commit()
        return MessageResponse(message="Welcome back! Your subscription has been reactivated.")

    # Create new subscription
    subscription = NewsletterSubscription(
        email=data.email.lower(),
        source=data.source,
    )
    db.add(subscription)
    await db.commit()

    # Send welcome email (non-blocking, failure won't affect response)
    await EmailService.send_newsletter_welcome(data.email.lower())

    return MessageResponse(message="Thanks for subscribing! You'll receive 10% off your first order.")


@router.post("/unsubscribe", response_model=MessageResponse)
async def unsubscribe(
    data: NewsletterUnsubscribe,
    db: AsyncSession = Depends(get_db),
):
    """Unsubscribe from the newsletter."""
    result = await db.execute(
        select(NewsletterSubscription).where(
            NewsletterSubscription.email == data.email.lower()
        )
    )
    subscription = result.scalar_one_or_none()

    if subscription and subscription.is_active:
        subscription.is_active = False
        subscription.unsubscribed_at = datetime.now(timezone.utc)
        await db.commit()

    # Always return success to prevent email enumeration
    return MessageResponse(message="You have been unsubscribed from our newsletter.")


@router.get("/status")
async def check_status(
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    """Check newsletter subscription status for the authenticated user."""
    result = await db.execute(
        select(NewsletterSubscription).where(
            NewsletterSubscription.email == user.email.lower()
        )
    )
    subscription = result.scalar_one_or_none()

    return {
        "subscribed": subscription is not None and subscription.is_active,
    }
