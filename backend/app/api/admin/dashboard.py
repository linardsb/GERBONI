"""Admin dashboard endpoints."""

from datetime import datetime, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ...models import User, Order, OrderStatus, TShirtVariant
from ...schemas import DashboardStats
from ..deps import get_admin_user

router = APIRouter()

LOW_STOCK_THRESHOLD = 10


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard statistics."""
    # Total orders
    total_orders_result = await db.execute(select(func.count(Order.id)))
    total_orders = total_orders_result.scalar() or 0

    # Pending orders
    pending_orders_result = await db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.PENDING.value)
    )
    pending_orders = pending_orders_result.scalar() or 0

    # Total revenue (paid orders only)
    total_revenue_result = await db.execute(
        select(func.sum(Order.total)).where(
            Order.status.in_([
                OrderStatus.PAID.value,
                OrderStatus.PROCESSING.value,
                OrderStatus.SHIPPED.value,
                OrderStatus.DELIVERED.value,
            ])
        )
    )
    total_revenue = total_revenue_result.scalar() or Decimal("0")

    # Total customers (non-guest users)
    total_customers_result = await db.execute(
        select(func.count(User.id)).where(User.is_guest == False)
    )
    total_customers = total_customers_result.scalar() or 0

    # Orders today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    orders_today_result = await db.execute(
        select(func.count(Order.id)).where(Order.created_at >= today_start)
    )
    orders_today = orders_today_result.scalar() or 0

    # Revenue today
    revenue_today_result = await db.execute(
        select(func.sum(Order.total)).where(
            Order.created_at >= today_start,
            Order.status.in_([
                OrderStatus.PAID.value,
                OrderStatus.PROCESSING.value,
                OrderStatus.SHIPPED.value,
                OrderStatus.DELIVERED.value,
            ])
        )
    )
    revenue_today = revenue_today_result.scalar() or Decimal("0")

    # Low stock variants
    low_stock_result = await db.execute(
        select(func.count(TShirtVariant.id)).where(
            TShirtVariant.stock < LOW_STOCK_THRESHOLD
        )
    )
    low_stock_variants = low_stock_result.scalar() or 0

    return DashboardStats(
        total_orders=total_orders,
        pending_orders=pending_orders,
        total_revenue=total_revenue,
        total_customers=total_customers,
        orders_today=orders_today,
        revenue_today=revenue_today,
        low_stock_variants=low_stock_variants,
    )
