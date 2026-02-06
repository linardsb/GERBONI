# BUG-004: Admin Orders API Calling Wrong Service Methods

**Status**: Fixed
**Severity**: Critical
**Date Discovered**: 2026-02-06
**Date Fixed**: 2026-02-06
**GitHub Issue**: N/A
**Fragile Area**: Order State Machine

## Summary

The admin orders API (`backend/app/api/admin_orders.py`) was calling OrderService methods with incorrect signatures. The API was written against a different interface than what actually existed in `backend/app/services/order_service.py`, causing 7 API endpoints to fail with 500 errors.

## Root Cause

The admin API code used method signatures like:
```python
# WRONG (in admin_orders.py)
await order_service.mark_paid(db, order, payment_id=payment_intent_id)
await order_service.mark_processing(db, order)
await order_service.mark_shipped(db, order, tracking_number=tracking)
```

But the actual OrderService methods expected:
```python
# CORRECT (in order_service.py)
async def mark_paid(db: AsyncSession, order_id: int, stripe_payment_id: str) -> Order
async def mark_processing(db: AsyncSession, order_id: int) -> Order
async def mark_shipped(db: AsyncSession, order_id: int, tracking_number: str) -> Order
```

**Key differences**:
1. Methods take `order_id: int`, not `order: Order` object
2. Parameter names differ (`stripe_payment_id` vs `payment_id`)
3. Some methods were completely missing or had wrong names

This suggests the admin API was written **before** the OrderService was fully implemented, or was copied from old code that used a different service interface.

## Symptoms

- **500 Internal Server Error** on all admin order status endpoints
- Error logs: `TypeError: mark_paid() got an unexpected keyword argument 'payment_id'`
- Admin dashboard unusable for order management
- No way to manually transition order states
- **7 endpoints affected**:
  - `POST /api/admin/orders/{id}/mark-paid`
  - `POST /api/admin/orders/{id}/mark-processing`
  - `POST /api/admin/orders/{id}/mark-shipped`
  - `POST /api/admin/orders/{id}/mark-delivered`
  - `POST /api/admin/orders/{id}/cancel`
  - `POST /api/admin/orders/{id}/refund`
  - `GET /api/admin/orders` (list with filtering)

## Fix Applied

### 1. Corrected mark_paid Endpoint

**Before**:
```python
@router.post("/orders/{order_id}/mark-paid")
async def mark_order_paid(
    order_id: int,
    payment_intent_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> OrderResponse:
    order = await order_service.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # WRONG: order_service.mark_paid expects (db, order_id, stripe_payment_id)
    updated = await order_service.mark_paid(db, order, payment_id=payment_intent_id)
    return OrderResponse.model_validate(updated)
```

**After**:
```python
@router.post("/orders/{order_id}/mark-paid")
async def mark_order_paid(
    order_id: int,
    payment_intent_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> OrderResponse:
    # CORRECT: Pass order_id directly, use correct parameter name
    updated = await order_service.mark_paid(db, order_id, stripe_payment_id=payment_intent_id)
    return OrderResponse.model_validate(updated)
```

### 2. Corrected mark_processing Endpoint

**Before**:
```python
updated = await order_service.mark_processing(db, order)
```

**After**:
```python
updated = await order_service.mark_processing(db, order_id)
```

### 3. Corrected mark_shipped Endpoint

**Before**:
```python
updated = await order_service.mark_shipped(db, order, tracking_number=tracking)
```

**After**:
```python
updated = await order_service.mark_shipped(db, order_id, tracking_number=tracking)
```

### 4. Corrected All 7 Endpoints

Full list of corrections:

| Endpoint | Wrong Call | Correct Call |
|----------|-----------|--------------|
| `mark_paid` | `mark_paid(db, order, payment_id=...)` | `mark_paid(db, order_id, stripe_payment_id=...)` |
| `mark_processing` | `mark_processing(db, order)` | `mark_processing(db, order_id)` |
| `mark_shipped` | `mark_shipped(db, order, tracking_number=...)` | `mark_shipped(db, order_id, tracking_number=...)` |
| `mark_delivered` | `mark_delivered(db, order)` | `mark_delivered(db, order_id)` |
| `cancel` | `cancel_order(db, order, reason=...)` | `cancel_order(db, order_id, reason=...)` |
| `refund` | `refund_order(db, order, amount=...)` | `refund_order(db, order_id, amount=...)` |
| `list` | Wrong filter logic | Corrected SQLAlchemy query |

### 5. Files Changed

- `backend/app/api/admin_orders.py` (corrected all 7 endpoint method calls)

## Regression Test

**Test File**: `backend/tests/test_admin_orders.py`

```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

@pytest.mark.asyncio
async def test_admin_mark_paid(client: AsyncClient, db_session: AsyncSession, admin_token: str):
    """Test admin can mark order as paid with correct service method signature."""
    # Create pending order
    order = await create_test_order(db_session, status="pending")

    # Call admin endpoint
    response = await client.post(
        f"/api/admin/orders/{order.id}/mark-paid",
        json={"payment_intent_id": "pi_test123"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    # Should succeed (would fail with buggy method signature)
    assert response.status_code == 200
    assert response.json()["status"] == "paid"

@pytest.mark.asyncio
async def test_admin_mark_processing(client: AsyncClient, db_session: AsyncSession, admin_token: str):
    """Test admin can mark order as processing."""
    order = await create_test_order(db_session, status="paid")

    response = await client.post(
        f"/api/admin/orders/{order.id}/mark-processing",
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 200
    assert response.json()["status"] == "processing"

# ... 5 more tests for shipped, delivered, cancel, refund, list
```

These tests would **fail** with the buggy method calls (TypeError) and **pass** with correct signatures.

## Prevention

### Guidelines to Prevent Similar Bugs

1. **Always verify service method signatures** before calling them in API routes
2. **Use type hints** - let IDE/mypy catch signature mismatches
3. **Write integration tests early** - test API → Service → DB flow
4. **Don't copy-paste old code** without verifying it still works
5. **Review service layer changes** - update all callers if signatures change

### API Development Checklist

When adding new admin endpoints:

- [ ] Check service method signature (params, return type)
- [ ] Use correct parameter names (not just positional args)
- [ ] Write integration test that calls API → Service → DB
- [ ] Run `mypy` to catch type errors
- [ ] Test with real database (not just mocks)

### Code Review Checklist

- [ ] Do API method calls match service signatures?
- [ ] Are all required parameters provided?
- [ ] Are parameter names correct (not just order)?
- [ ] Is there a test covering this endpoint?

## Related Issues

This bug is in the **Order State Machine** fragile area.

From `CLAUDE.md`:
> **3. Order State Machine** — Strict `pending → paid → processing → shipped → delivered` flow with `cancelled` and `refunded` branches. The `request_refund` agent tool enforces a 14-day window. Changing status logic risks payment/refund inconsistencies.

## Lessons Learned

1. **Type hints help but aren't enough** - need runtime tests to catch signature mismatches
2. **Service layer is source of truth** - API should adapt to service, not vice versa
3. **Integration tests > unit tests** for catching interface issues
4. **Don't trust old code** - always verify before copying
5. **Mypy could have caught this** - need to enforce static type checking in CI

## Technical Notes

### Why Methods Take order_id Instead of Order?

The OrderService methods take `order_id: int` for several reasons:

1. **Transaction safety**: Method can fetch order inside transaction
2. **Isolation**: Ensures fresh data from DB (no stale order objects)
3. **Simpler API**: Caller doesn't need to fetch order first
4. **Consistency**: All service methods follow same pattern

### Order State Machine

Valid transitions:
```
pending → paid → processing → shipped → delivered
   ↓                ↓            ↓
cancelled      cancelled    cancelled
   ↓                ↓
refunded       refunded
```

**Rules**:
- Can only mark `paid` if order is `pending`
- Can only mark `processing` if order is `paid`
- Can only mark `shipped` if order is `processing`
- Can only mark `delivered` if order is `shipped`
- Can cancel at any time before `delivered`
- Can refund `paid`, `processing`, or `shipped` orders (within 14 days)

See [Order State Transitions Runbook](../runbooks/order-state-transitions.md) for full details.

### Admin vs User Permissions

- **Users** can only view their own orders (`GET /api/orders`)
- **Admins** can:
  - View all orders (`GET /api/admin/orders`)
  - Manually transition order states (all 7 endpoints)
  - Issue refunds without time limit
  - Cancel orders at any time

Admin check via `require_admin` dependency in FastAPI routes.
