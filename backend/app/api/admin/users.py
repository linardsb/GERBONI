"""Admin user management endpoints."""

from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ...models import User, Order, OrderStatus, UserRole
from ...schemas import UserRoleUpdate
from ..deps import get_admin_user, get_super_admin_user
from ...utils.csv_export import csv_streaming_response

router = APIRouter()


@router.get("/export")
async def export_users_csv(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Export users as CSV. Excludes guest sessions."""
    result = await db.execute(
        select(User).where(User.is_guest == False).order_by(User.created_at.desc())
    )
    users = result.scalars().all()

    headers = ["id", "email", "role", "is_active", "created_at"]
    rows = [
        {
            "id": u.id,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else "",
        }
        for u in users
    ]

    return csv_streaming_response(rows, headers, "users.csv")


@router.get("")
async def list_users(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
    role_filter: str | None = Query(None, alias="role"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List all users with order statistics."""
    query = select(User).where(User.is_guest == False)

    if role_filter:
        query = query.where(User.role == role_filter)

    query = query.order_by(User.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    users = result.scalars().all()

    # Get order stats for each user
    user_data = []
    for user in users:
        # Order count
        order_count_result = await db.execute(
            select(func.count(Order.id)).where(Order.user_id == user.id)
        )
        order_count = order_count_result.scalar() or 0

        # Total spent
        total_spent_result = await db.execute(
            select(func.sum(Order.total)).where(
                Order.user_id == user.id,
                Order.status.in_([
                    OrderStatus.PAID.value,
                    OrderStatus.PROCESSING.value,
                    OrderStatus.SHIPPED.value,
                    OrderStatus.DELIVERED.value,
                ])
            )
        )
        total_spent = total_spent_result.scalar() or Decimal("0")

        user_data.append({
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_guest": user.is_guest,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "order_count": order_count,
            "total_spent": total_spent,
        })

    # Get total count
    count_query = select(func.count(User.id)).where(User.is_guest == False)
    if role_filter:
        count_query = count_query.where(User.role == role_filter)
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    return {
        "users": user_data,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{user_id}")
async def get_user(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific user with detailed information."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Get order statistics
    order_count_result = await db.execute(
        select(func.count(Order.id)).where(Order.user_id == user.id)
    )
    order_count = order_count_result.scalar() or 0

    total_spent_result = await db.execute(
        select(func.sum(Order.total)).where(
            Order.user_id == user.id,
            Order.status.in_([
                OrderStatus.PAID.value,
                OrderStatus.PROCESSING.value,
                OrderStatus.SHIPPED.value,
                OrderStatus.DELIVERED.value,
            ])
        )
    )
    total_spent = total_spent_result.scalar() or Decimal("0")

    # Get recent orders
    orders_result = await db.execute(
        select(Order)
        .where(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .limit(5)
    )
    recent_orders = orders_result.scalars().all()

    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "is_guest": user.is_guest,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "order_count": order_count,
        "total_spent": total_spent,
        "recent_orders": [
            {
                "id": order.id,
                "status": order.status,
                "total": order.total,
                "created_at": order.created_at,
            }
            for order in recent_orders
        ],
    }


@router.put("/{user_id}/role")
async def update_user_role(
    user_id: int,
    data: UserRoleUpdate,
    super_admin: User = Depends(get_super_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's role. Requires super_admin."""
    # Validate role value
    try:
        new_role = UserRole(data.role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role: {data.role}. Valid roles: {[r.value for r in UserRole]}",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent demoting the last super_admin
    if user.role == UserRole.SUPER_ADMIN.value and new_role != UserRole.SUPER_ADMIN:
        super_admin_count_result = await db.execute(
            select(func.count(User.id)).where(User.role == UserRole.SUPER_ADMIN.value)
        )
        super_admin_count = super_admin_count_result.scalar() or 0

        if super_admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote the last super admin",
            )

    # Prevent self-demotion
    if user.id == super_admin.id and new_role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot demote yourself",
        )

    user.role = new_role.value
    await db.commit()
    await db.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
    }


@router.put("/{user_id}/activate")
async def activate_user(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Activate a user account."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.is_active = True
    await db.commit()
    await db.refresh(user)

    return {"id": user.id, "is_active": user.is_active}


@router.put("/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a user account."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent deactivating self
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate yourself",
        )

    # Prevent deactivating super_admins (unless you're a super_admin)
    if user.role == UserRole.SUPER_ADMIN.value and admin.role != UserRole.SUPER_ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot deactivate a super admin",
        )

    user.is_active = False
    await db.commit()
    await db.refresh(user)

    return {"id": user.id, "is_active": user.is_active}
