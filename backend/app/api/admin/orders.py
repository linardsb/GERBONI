"""Admin order management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from datetime import datetime

from ...database import get_db
from ...models import User, Order, OrderItem, OrderStatus
from ...schemas import OrderStatusUpdate, OrderShipment
from ...services import OrderService, EmailService
from ...exceptions import DomainException, domain_to_http
from ...utils.csv_export import csv_streaming_response

import logging

logger = logging.getLogger(__name__)
from ..deps import get_admin_user

router = APIRouter()


@router.get("/export")
async def export_orders_csv(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
    status_filter: str | None = Query(None, alias="status"),
    date_from: str | None = Query(None, description="ISO date YYYY-MM-DD"),
    date_to: str | None = Query(None, description="ISO date YYYY-MM-DD"),
):
    """Export orders as CSV. Admin only."""
    query = select(Order).options(selectinload(Order.items))

    if status_filter:
        query = query.where(Order.status == status_filter)
    if date_from:
        query = query.where(Order.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.where(Order.created_at <= datetime.fromisoformat(date_to + "T23:59:59"))

    query = query.order_by(Order.created_at.desc())
    result = await db.execute(query)
    orders = result.scalars().all()

    headers = [
        "id", "status", "total", "user_id", "guest_email",
        "shipping_name", "shipping_city", "shipping_country",
        "tracking_number", "item_count", "created_at",
    ]
    rows = [
        {
            "id": o.id,
            "status": o.status,
            "total": str(o.total),
            "user_id": o.user_id or "",
            "guest_email": o.guest_email or "",
            "shipping_name": o.shipping_name or "",
            "shipping_city": o.shipping_city or "",
            "shipping_country": o.shipping_country or "",
            "tracking_number": o.tracking_number or "",
            "item_count": len(o.items),
            "created_at": o.created_at.isoformat() if o.created_at else "",
        }
        for o in orders
    ]

    return csv_streaming_response(rows, headers, "orders.csv")


@router.get("")
async def list_orders(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List all orders with optional status filter."""
    query = select(Order).options(selectinload(Order.items))

    if status_filter:
        query = query.where(Order.status == status_filter)

    query = query.order_by(Order.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    orders = result.scalars().all()

    # Get total count
    count_query = select(func.count(Order.id))
    if status_filter:
        count_query = count_query.where(Order.status == status_filter)
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    return {
        "orders": [
            {
                "id": order.id,
                "user_id": order.user_id,
                "guest_email": order.guest_email,
                "status": order.status,
                "total": order.total,
                "shipping_name": order.shipping_name,
                "shipping_city": order.shipping_city,
                "shipping_country": order.shipping_country,
                "tracking_number": order.tracking_number,
                "created_at": order.created_at,
                "updated_at": order.updated_at,
                "item_count": len(order.items),
            }
            for order in orders
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{order_id}")
async def get_order(
    order_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific order with full details."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.variant))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    return {
        "id": order.id,
        "user_id": order.user_id,
        "guest_email": order.guest_email,
        "status": order.status,
        "total": order.total,
        "stripe_payment_id": order.stripe_payment_id,
        "shipping_name": order.shipping_name,
        "shipping_address": order.shipping_address,
        "shipping_city": order.shipping_city,
        "shipping_postal_code": order.shipping_postal_code,
        "shipping_country": order.shipping_country,
        "tracking_number": order.tracking_number,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "items": [
            {
                "id": item.id,
                "variant_id": item.variant_id,
                "quantity": item.quantity,
                "price": item.price,
                "variant": {
                    "color": item.variant.color,
                    "size": item.variant.size,
                    "sku": item.variant.sku,
                    "product_id": item.variant.product_id,
                },
            }
            for item in order.items
        ],
    }


@router.put("/{order_id}/status")
async def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update order status."""
    # Validate status value
    try:
        new_status = OrderStatus(data.status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status: {data.status}",
        )

    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    try:
        if new_status == OrderStatus.PAID:
            await OrderService.mark_paid(db, order.id, stripe_payment_id="admin_manual")
        elif new_status == OrderStatus.PROCESSING:
            await OrderService.transition_status(db, order.id, OrderStatus.PROCESSING)
        elif new_status == OrderStatus.SHIPPED:
            await OrderService.ship_order(db, order.id)
        elif new_status == OrderStatus.DELIVERED:
            await OrderService.mark_delivered(db, order.id)
        elif new_status == OrderStatus.CANCELLED:
            await OrderService.cancel(db, order.id, restore_stock=True)
        elif new_status == OrderStatus.REFUNDED:
            await OrderService.process_refund(db, order.id)
    except DomainException as e:
        raise domain_to_http(e)

    await db.commit()
    await db.refresh(order)
    return {"id": order.id, "status": order.status}


@router.post("/{order_id}/ship")
async def ship_order(
    order_id: int,
    data: OrderShipment,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark order as shipped with tracking number."""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    try:
        await OrderService.ship_order(db, order.id, tracking_number=data.tracking_number)
    except DomainException as e:
        raise domain_to_http(e)

    await db.commit()
    await db.refresh(order)

    # Send shipping notification email
    try:
        email = order.guest_email
        if order.user_id:
            user_result = await db.execute(select(User).where(User.id == order.user_id))
            user_obj = user_result.scalar_one_or_none()
            if user_obj:
                email = user_obj.email
        if email:
            await EmailService.send_shipping_notification(
                email=email,
                order_id=order.id,
                tracking_number=order.tracking_number,
            )
    except Exception as e:
        logger.error(f"Failed to send shipping notification email: {e}")

    return {
        "id": order.id,
        "status": order.status,
        "tracking_number": order.tracking_number,
    }
