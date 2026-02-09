"""Admin discount code CRUD endpoints."""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ...models import User
from ...schemas import DiscountCodeCreate, DiscountCodeRead
from ...services import DiscountService
from ...exceptions import DomainException, domain_to_http
from ..deps import get_admin_user
from ...middleware import limiter

router = APIRouter()


@router.get("", response_model=list[DiscountCodeRead])
async def list_discounts(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all discount codes."""
    return await DiscountService.list_all(db)


@router.post("", response_model=DiscountCodeRead)
@limiter.limit("10/minute")
async def create_discount(
    request: Request,
    data: DiscountCodeCreate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new discount code."""
    discount = await DiscountService.create(
        db,
        code=data.code,
        type=data.type,
        value=data.value,
        min_order_amount=data.min_order_amount,
        max_uses=data.max_uses,
        valid_from=data.valid_from,
        valid_until=data.valid_until,
    )
    await db.commit()
    await db.refresh(discount)
    return discount


@router.put("/{discount_id}/deactivate", response_model=DiscountCodeRead)
async def deactivate_discount(
    discount_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a discount code."""
    try:
        discount = await DiscountService.deactivate(db, discount_id)
        await db.commit()
        await db.refresh(discount)
        return discount
    except DomainException as e:
        raise domain_to_http(e)
