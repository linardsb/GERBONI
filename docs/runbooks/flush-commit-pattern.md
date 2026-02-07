# Service flush() / API commit() Pattern

**Purpose**: Document the transaction boundary pattern used across GERBONI's backend to prevent data integrity bugs
**Risk Level**: High — incorrect usage causes silent data loss or partial writes
**Related Bugs**: BUG-004 (wrong service signatures), BUG-005 (agent bypassed service layer)

## The Pattern

GERBONI uses a two-layer transaction pattern:

```
┌────────────────────────────────────┐
│  API Layer (routes)                │
│  • Calls service methods           │
│  • Calls await db.commit()         │  ← commits the transaction
│  • Calls await db.refresh(obj)     │  ← reloads server-generated fields
├────────────────────────────────────┤
│  Service Layer                     │
│  • Performs business logic          │
│  • Calls await db.flush()          │  ← writes to DB without committing
│  • NEVER calls db.commit()         │
└────────────────────────────────────┘
```

## Why flush() in Services?

`flush()` writes changes to the database within the current transaction but does **not** commit. This gives us:

1. **Auto-generated IDs** — After `flush()`, the ORM model has its `id` field populated (needed for foreign keys in the same transaction)
2. **Rollback safety** — If a later step fails, the entire transaction rolls back automatically
3. **Caller control** — The API layer decides when to commit, allowing multiple service calls in one transaction

## Correct Usage

### Service Layer (flush only)

```python
class OrderService:
    @staticmethod
    async def create_from_cart(db: AsyncSession, owner: OrderOwner, ...) -> Order:
        order = Order(user_id=owner.user_id, total=total, ...)
        db.add(order)
        await db.flush()  # ← order.id is now available

        for cart_item in cart_items:
            order_item = OrderItem(order_id=order.id, ...)  # uses order.id
            db.add(order_item)

        await db.flush()  # ← writes order items
        return order       # ← does NOT commit
```

### API Layer (commit after service call)

```python
@router.post("", response_model=OrderRead)
async def create_order(order_data: OrderCreate, ...):
    try:
        order = await OrderService.create_from_cart(db, owner, cart_items, shipping)
        await db.commit()          # ← commits everything (order + items)
        return _format_order(order)
    except DomainException as e:
        raise domain_to_http(e)    # ← automatic rollback on error
```

### Multiple Service Calls in One Transaction

```python
@router.post("/move-to-cart/{product_id}")
async def move_to_cart(...):
    await CartService.add_item(db, cart_owner, variant_id, quantity)  # flush inside
    await WishlistService.remove_item(db, wishlist_owner, product_id)  # flush inside
    await db.commit()  # ← commits both operations atomically
```

## Common Mistakes

### 1. Committing in a Service (breaks atomicity)

```python
# WRONG — service should not commit
class CartService:
    @staticmethod
    async def add_item(db, ...):
        db.add(item)
        await db.commit()  # ← BAD: caller loses rollback control
```

### 2. Forgetting to commit in the API layer (silent data loss)

```python
# WRONG — changes are flushed but never committed
@router.post("")
async def create_order(...):
    order = await OrderService.create_from_cart(db, ...)
    return _format_order(order)  # ← MISSING db.commit()!
    # Changes are lost when the session closes
```

### 3. Forgetting to refresh after commit (stale data)

```python
# After commit, server-generated fields (timestamps, etc.) may be stale
await db.commit()
await db.refresh(order)  # ← reloads updated_at, etc.
```

### 4. Accessing relationships without eager loading (MissingGreenlet)

```python
# WRONG in async SQLAlchemy — lazy loading triggers MissingGreenlet
order = await db.get(Order, order_id)
items = order.items  # ← CRASHES in async context

# CORRECT — use selectinload for eager loading
stmt = select(Order).options(selectinload(Order.items))
```

## When to Use refresh()

Call `await db.refresh(obj)` after commit when you need:
- Server-generated timestamps (`created_at`, `updated_at`)
- Auto-increment IDs after the final commit
- Relationship data that may have changed

```python
review = await ReviewService.create_review(db, ...)
await db.commit()
await db.refresh(review)          # reload scalar fields
await db.refresh(review, ["user"])  # reload specific relationship
```

## Verification

After making changes to service/API layers:

```bash
# Run full test suite — tests use in-memory SQLite with same pattern
cd backend && pytest --tb=short -q

# Check for commit in services (should find zero matches)
grep -rn "db.commit()" app/services/

# Check for missing commit in routes (review manually)
grep -rn "await db.flush()" app/api/
```

## Quick Reference

| Layer | Uses | Why |
|-------|------|-----|
| Service | `await db.flush()` | Writes without committing; gets auto-generated IDs |
| API route | `await db.commit()` | Finalizes the transaction |
| API route | `await db.refresh(obj)` | Reloads server-generated fields after commit |
| Test | `await db.commit()` | Tests commit in fixtures; conftest handles cleanup |

## Related Documentation

- [Backend Skill](./.claude/skills/gerboni-backend/SKILL.md) — Service layer pattern section
- [Order State Transitions](./order-state-transitions.md) — Uses this pattern for status changes
- [Known Fragile Areas](../../CLAUDE.md#known-fragile-areas) — Order state machine entry
