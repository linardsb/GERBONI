# BUG-014: Admin Low-Stock Route Shadowed by Product ID Parameter

**Status:** Fixed
**Severity:** Medium
**Component:** Backend — Admin API
**Fixed:** 2026-02-10
**Regression Test:** `backend/tests/test_admin_products.py` → `TestLowStock::test_bug_014_low_stock_route_not_shadowed`

## What Broke

The admin dashboard's low-stock widget returned a 422 Unprocessable Entity error:

```
[API] 422 /admin/products/low-stock "(request_id: ...)"
{"detail":[{"type":"int_parsing","loc":["path","product_id"],"msg":"Input should be a valid integer, unable to parse string as an integer","input":"low-stock"}]}
```

The `/api/admin/products/low-stock` endpoint was completely unreachable.

## Root Cause

In `backend/app/api/admin/products.py`, route registration order:

```python
# Line 99 — registered FIRST, catches everything
@router.get("/{product_id}")
async def get_product(product_id: int, ...):

# Line 232 — registered SECOND, never reached for "low-stock"
@router.get("/low-stock")
async def list_low_stock(...):
```

FastAPI matches routes in registration order. `/{product_id}` matched first and tried to parse `"low-stock"` as `int`, producing the 422 error.

Note: The `/export` route (line 21) was already correctly placed before `/{product_id}`, but `/low-stock` was added later and placed at the bottom of the file.

## Fix

Moved the `/low-stock` route definition above `/{product_id}`:

```python
@router.get("/export")     # ← literal, first
async def export_products_csv(...):

@router.get("/low-stock")  # ← literal, moved here
async def list_low_stock(...):

@router.get("/{product_id}")  # ← parameterized, last
async def get_product(product_id: int, ...):
```

**Files changed:**
- `backend/app/api/admin/products.py` — moved `/low-stock` route before `/{product_id}`

## Prevention

- **Rule:** All literal path routes must be registered before any parameterized `/{id}` routes in the same router.
- **Already known:** This pattern was documented in MEMORY.md: "Route ordering: `/export` must register BEFORE `/{id}` to avoid path conflicts."
- **Suggestion:** Add a startup assertion or test that verifies no literal routes are registered after parameterized routes on the same prefix.

## Related

- MEMORY.md key learning: "Route ordering: `/export` must register BEFORE `/{id}` to avoid path conflicts"
- [Known Fragile Areas](../../CLAUDE.md#known-fragile-areas)
