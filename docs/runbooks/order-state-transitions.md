# Runbook: Order State Transitions

**Purpose**: Manage order lifecycle state transitions correctly
**Risk Level**: Critical
**Related Bugs**: [BUG-004](../bug-fixes/BUG-004-admin-order-service.md) - Admin orders API using wrong service methods

## Overview

GERBONI orders follow a strict state machine with defined transitions. Incorrect state changes can cause payment/refund inconsistencies and break the AI agent's order tracking.

## Order State Machine

```
        ┌─────────┐
        │ pending │ (order created, awaiting payment)
        └────┬────┘
             │ Stripe payment succeeds
             ↓
        ┌─────────┐
        │  paid   │ (payment confirmed, ready to process)
        └────┬────┘
             │ Admin marks as processing
             ↓
     ┌──────────────┐
     │  processing  │ (order being prepared/packed)
     └──────┬───────┘
            │ Admin marks as shipped
            ↓
       ┌─────────┐
       │ shipped │ (package en route to customer)
       └────┬────┘
            │ Tracking shows delivery
            ↓
      ┌───────────┐
      │ delivered │ (customer received package)
      └───────────┘

# Alternative branches:

From any state → cancelled (admin or customer action)
From paid/processing/shipped → refunded (within 14 days)
```

## Valid State Transitions

| Current State | Valid Next States | Triggered By |
|--------------|------------------|--------------|
| `pending` | `paid`, `cancelled` | Stripe webhook, manual cancel |
| `paid` | `processing`, `cancelled`, `refunded` | Admin action |
| `processing` | `shipped`, `cancelled`, `refunded` | Admin action |
| `shipped` | `delivered`, `cancelled`, `refunded` | Admin action, tracking update |
| `delivered` | N/A (terminal) | N/A |
| `cancelled` | N/A (terminal) | N/A |
| `refunded` | N/A (terminal) | N/A |

## OrderService Methods

All state transitions go through `backend/app/services/order_service.py`:

### mark_paid()

**Signature**:
```python
async def mark_paid(
    db: AsyncSession,
    order_id: int,
    stripe_payment_id: str
) -> Order
```

**Purpose**: Mark order as paid after Stripe payment succeeds

**Valid from**: `pending`

**Usage**:
```python
# Called by Stripe webhook handler
from app.services import order_service

order = await order_service.mark_paid(
    db=db,
    order_id=order_id,
    stripe_payment_id=payment_intent.id
)
```

**Validation**:
- Order must exist
- Order must be in `pending` state
- `stripe_payment_id` must be provided

**Side effects**:
- Updates order status to `paid`
- Records Stripe payment intent ID
- Sends confirmation email to customer

---

### mark_processing()

**Signature**:
```python
async def mark_processing(
    db: AsyncSession,
    order_id: int
) -> Order
```

**Purpose**: Mark order as being processed (admin action)

**Valid from**: `paid`

**Usage**:
```python
# Called by admin API
order = await order_service.mark_processing(db, order_id)
```

**Validation**:
- Order must exist
- Order must be in `paid` state

**Side effects**:
- Updates order status to `processing`
- Sends "order being processed" email to customer

---

### mark_shipped()

**Signature**:
```python
async def mark_shipped(
    db: AsyncSession,
    order_id: int,
    tracking_number: str
) -> Order
```

**Purpose**: Mark order as shipped with tracking number (admin action)

**Valid from**: `processing`

**Usage**:
```python
# Called by admin API
order = await order_service.mark_shipped(
    db=db,
    order_id=order_id,
    tracking_number="LV1234567890"
)
```

**Validation**:
- Order must exist
- Order must be in `processing` state
- `tracking_number` must be provided

**Side effects**:
- Updates order status to `shipped`
- Records tracking number
- Sends shipping confirmation email with tracking link

---

### mark_delivered()

**Signature**:
```python
async def mark_delivered(
    db: AsyncSession,
    order_id: int
) -> Order
```

**Purpose**: Mark order as delivered (admin action or tracking webhook)

**Valid from**: `shipped`

**Usage**:
```python
# Called by admin API or delivery tracking webhook
order = await order_service.mark_delivered(db, order_id)
```

**Validation**:
- Order must exist
- Order must be in `shipped` state

**Side effects**:
- Updates order status to `delivered`
- Sends delivery confirmation email
- Triggers refund deadline (14 days from delivery)

---

### cancel_order()

**Signature**:
```python
async def cancel_order(
    db: AsyncSession,
    order_id: int,
    reason: str | None = None
) -> Order
```

**Purpose**: Cancel order (before delivery)

**Valid from**: Any state except `delivered`, `cancelled`, `refunded`

**Usage**:
```python
# Called by admin API or customer request
order = await order_service.cancel_order(
    db=db,
    order_id=order_id,
    reason="Customer requested cancellation"
)
```

**Validation**:
- Order must exist
- Order must not be `delivered`, `cancelled`, or `refunded`

**Side effects**:
- Updates order status to `cancelled`
- Records cancellation reason
- Refunds payment if already paid
- Sends cancellation confirmation email

---

### refund_order()

**Signature**:
```python
async def refund_order(
    db: AsyncSession,
    order_id: int,
    amount: int | None = None,  # in cents, None = full refund
    reason: str | None = None
) -> Order
```

**Purpose**: Refund order (within 14 days of delivery)

**Valid from**: `paid`, `processing`, `shipped`, `delivered` (within 14 days)

**Usage**:
```python
# Called by admin API or AI agent
from app.services import order_service

order = await order_service.refund_order(
    db=db,
    order_id=order_id,
    amount=None,  # Full refund
    reason="Product defect reported"
)
```

**Validation**:
- Order must exist
- Order must be `paid`, `processing`, `shipped`, or `delivered`
- If `delivered`, must be within 14 days of delivery date
- Stripe payment must be refundable

**Side effects**:
- Updates order status to `refunded`
- Processes Stripe refund
- Records refund amount and reason
- Sends refund confirmation email

## Admin API Endpoints

All endpoints require admin authentication (`X-Admin-Token` header).

### POST /api/admin/orders/{order_id}/mark-paid

**Request**:
```json
{
  "payment_intent_id": "pi_1234567890abcdef"
}
```

**Response**:
```json
{
  "id": 123,
  "status": "paid",
  "stripe_payment_id": "pi_1234567890abcdef",
  ...
}
```

---

### POST /api/admin/orders/{order_id}/mark-processing

**Request**: Empty body

**Response**: Updated order JSON

---

### POST /api/admin/orders/{order_id}/mark-shipped

**Request**:
```json
{
  "tracking_number": "LV1234567890"
}
```

**Response**: Updated order JSON

---

### POST /api/admin/orders/{order_id}/mark-delivered

**Request**: Empty body

**Response**: Updated order JSON

---

### POST /api/admin/orders/{order_id}/cancel

**Request**:
```json
{
  "reason": "Customer requested cancellation"
}
```

**Response**: Updated order JSON

---

### POST /api/admin/orders/{order_id}/refund

**Request**:
```json
{
  "amount": null,  // null = full refund, or specific amount in cents
  "reason": "Product defect"
}
```

**Response**: Updated order JSON

## Common Mistakes

### 1. Passing Order Object Instead of order_id

**WRONG**:
```python
order = await order_service.get_order_by_id(db, order_id)
updated = await order_service.mark_paid(db, order, payment_id=payment_intent_id)
```

**CORRECT**:
```python
updated = await order_service.mark_paid(db, order_id, stripe_payment_id=payment_intent_id)
```

### 2. Wrong Parameter Names

**WRONG**:
```python
await order_service.mark_paid(db, order_id, payment_id=pi_id)
```

**CORRECT**:
```python
await order_service.mark_paid(db, order_id, stripe_payment_id=pi_id)
```

### 3. Skipping State Validation

**WRONG**:
```python
# Directly update database without validation
order.status = "shipped"
await db.commit()
```

**CORRECT**:
```python
# Use service method (validates state transition)
order = await order_service.mark_shipped(db, order_id, tracking_number="...")
```

### 4. Not Handling Refund Window

**WRONG**:
```python
# Refund any delivered order without checking date
await order_service.refund_order(db, order_id)
```

**CORRECT**:
```python
# Service method enforces 14-day window
try:
    await order_service.refund_order(db, order_id)
except ValueError as e:
    # "Order delivered more than 14 days ago, cannot refund"
    raise HTTPException(status_code=400, detail=str(e))
```

## AI Agent Integration

The AI support agent has a `request_refund` tool that uses `refund_order()`:

```python
# backend/app/agent/support_agent.py
@agent.tool
async def request_refund(
    ctx: RunContext[AgentDependencies],
    order_id: int,
    reason: str
) -> str:
    """Request refund for an order (within 14 days)."""
    try:
        order = await order_service.refund_order(
            ctx.deps.db,
            order_id=order_id,
            amount=None,  # Full refund
            reason=reason
        )
        return f"Refund processed for order #{order_id}. Amount: ${order.total_amount/100:.2f}"
    except ValueError as e:
        return f"Cannot process refund: {str(e)}"
```

## Testing State Transitions

### Unit Test

```python
# backend/tests/test_order_service.py
import pytest
from app.services import order_service

@pytest.mark.asyncio
async def test_order_state_machine(db_session):
    """Test full order lifecycle."""
    # Create pending order
    order = await create_test_order(db_session, status="pending")

    # Mark as paid
    order = await order_service.mark_paid(db_session, order.id, stripe_payment_id="pi_test")
    assert order.status == "paid"

    # Mark as processing
    order = await order_service.mark_processing(db_session, order.id)
    assert order.status == "processing"

    # Mark as shipped
    order = await order_service.mark_shipped(db_session, order.id, tracking_number="LV123")
    assert order.status == "shipped"

    # Mark as delivered
    order = await order_service.mark_delivered(db_session, order.id)
    assert order.status == "delivered"
```

### Integration Test

```python
# backend/tests/test_admin_orders.py
@pytest.mark.asyncio
async def test_admin_order_workflow(client, admin_token, db_session):
    """Test admin order management via API."""
    order = await create_test_order(db_session, status="pending")

    # Mark as paid
    response = await client.post(
        f"/api/admin/orders/{order.id}/mark-paid",
        json={"payment_intent_id": "pi_test"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "paid"

    # Continue through state machine...
```

## Troubleshooting

### Issue: "Invalid state transition" error

**Cause**: Trying to transition from wrong state

**Solution**:
1. Check current order status: `SELECT status FROM orders WHERE id = ?`
2. Verify transition is valid (see table above)
3. If stuck, manually fix in database (with caution!)

### Issue: Refund fails with "Order too old"

**Cause**: Delivered order is > 14 days old

**Solution**:
1. Check delivery date: `SELECT delivered_at FROM orders WHERE id = ?`
2. If legitimate refund, admin can manually process in Stripe
3. Update order status: `UPDATE orders SET status = 'refunded' WHERE id = ?`

### Issue: Order stuck in "processing"

**Cause**: Admin forgot to mark as shipped

**Solution**:
1. Mark as shipped via admin API or UI
2. Provide tracking number to customer
3. Set up reminder/automation for stale orders

## Related Documentation

- [BUG-004 Writeup](../bug-fixes/BUG-004-admin-order-service.md) - Original service method bug
- [OrderService Source](../../backend/app/services/order_service.py)
- [Admin Orders API](../../backend/app/api/admin_orders.py)
- [AI Agent Tools](../../backend/app/agent/support_agent.py)
