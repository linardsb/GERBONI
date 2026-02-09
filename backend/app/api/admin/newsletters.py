"""Admin newsletter campaign endpoints."""

import json
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ...models import User
from ...schemas import CampaignCreate, CampaignUpdate, CampaignRead
from ...services import CampaignService
from ...exceptions import DomainException, domain_to_http
from ..deps import get_admin_user
from ...middleware import limiter

router = APIRouter()


def _campaign_to_read(campaign) -> CampaignRead:
    """Convert campaign model to read schema with JSON parsing."""
    return CampaignRead(
        id=campaign.id,
        title=campaign.title,
        subject=campaign.subject,
        intro_text=campaign.intro_text,
        featured_product_ids=(
            json.loads(campaign.featured_product_ids)
            if campaign.featured_product_ids else []
        ),
        status=campaign.status,
        recipient_count=campaign.recipient_count,
        sent_count=campaign.sent_count,
        failed_count=campaign.failed_count,
        created_by=campaign.created_by,
        created_at=campaign.created_at,
        sent_at=campaign.sent_at,
    )


@router.get("", response_model=list[CampaignRead])
async def list_campaigns(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all newsletter campaigns."""
    campaigns = await CampaignService.list_all(db)
    return [_campaign_to_read(c) for c in campaigns]


@router.post("", response_model=CampaignRead)
async def create_campaign(
    data: CampaignCreate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new draft campaign."""
    campaign = await CampaignService.create(
        db,
        title=data.title,
        subject=data.subject,
        intro_text=data.intro_text,
        featured_product_ids=data.featured_product_ids,
        created_by=admin.id,
    )
    await db.commit()
    await db.refresh(campaign)
    return _campaign_to_read(campaign)


@router.get("/{campaign_id}", response_model=CampaignRead)
async def get_campaign(
    campaign_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get campaign details."""
    try:
        campaign = await CampaignService.get(db, campaign_id)
        return _campaign_to_read(campaign)
    except DomainException as e:
        raise domain_to_http(e)


@router.put("/{campaign_id}", response_model=CampaignRead)
async def update_campaign(
    campaign_id: int,
    data: CampaignUpdate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a draft campaign."""
    try:
        campaign = await CampaignService.update(
            db,
            campaign_id,
            title=data.title,
            subject=data.subject,
            intro_text=data.intro_text,
            featured_product_ids=data.featured_product_ids,
        )
        await db.commit()
        await db.refresh(campaign)
        return _campaign_to_read(campaign)
    except DomainException as e:
        raise domain_to_http(e)


@router.post("/{campaign_id}/send", response_model=CampaignRead)
@limiter.limit("5/minute")
async def send_campaign(
    request: Request,
    campaign_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a draft campaign to all active subscribers."""
    try:
        campaign = await CampaignService.send(db, campaign_id)
        await db.commit()
        await db.refresh(campaign)
        return _campaign_to_read(campaign)
    except DomainException as e:
        raise domain_to_http(e)


@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a draft campaign."""
    try:
        await CampaignService.delete(db, campaign_id)
        await db.commit()
        return {"status": "deleted"}
    except DomainException as e:
        raise domain_to_http(e)
