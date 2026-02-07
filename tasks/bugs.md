# GERBONI Bug Tracker

Track bugs, issues, and their resolutions. Reference these IDs in commits and todo.md.

## Status Legend
- `OPEN` - Bug identified, not yet fixed
- `IN_PROGRESS` - Currently being worked on
- `FIXED` - Fix implemented, needs verification
- `CLOSED` - Verified fixed and deployed

---

## Open Bugs

(No open bugs)

---

## Recently Fixed

### BUG-001: FAQ Page Not Translated
**Status:** CLOSED
**Severity:** Medium
**Reported:** 2026-02-03
**Fixed:** 2026-02-03
**Component:** Frontend / i18n
**GitHub Issue:** https://github.com/linardsb/GERBONI/issues/1

**Description:**
FAQ page displays only English content regardless of selected locale. The 27 FAQ questions are hard-coded in the component instead of using the translation system.

**Steps to Reproduce:**
1. Navigate to `/lv/faq`
2. Observe that all FAQ content displays in English
3. Switch locale to Latvian — no change

**Expected Behavior:**
FAQ page renders in the currently selected locale (English or Latvian).

**Actual Behavior:**
FAQ page always renders in English regardless of locale selection.

**Root Cause:**
`frontend/src/app/[locale]/faq/page.tsx` contained hard-coded English strings instead of using `useTranslations()`.

**Fix:**
- Component refactored to use `useTranslations("faq")` hook
- All 26 FAQ entries added to `frontend/src/messages/en.json`
- Complete Latvian translations added to `frontend/src/messages/lv.json`
- FAQ organized into 6 categories: Orders & Shipping (5), Returns & Refunds (5), Products & Sizing (5), Payment & Security (4), Account & Support (4), Bulk & Custom (3)

**Related Files:**
- `frontend/src/app/[locale]/faq/page.tsx`
- `frontend/src/messages/en.json`
- `frontend/src/messages/lv.json`

**Regression Test:** `frontend/src/__tests__/pages/faq-page.test.tsx` → `renders FAQ using translation keys, not hard-coded English`

**Learning Outcomes:**
- **Fragile Area?** Yes — i18n Translations (Known Fragile Area #5 in CLAUDE.md)
- **Pattern:** Hard-coded strings in localized components
- **Prevention Strategy:** Always use `useTranslations()` hook; never embed raw text in JSX. Runbook: `docs/runbooks/adding-new-pages.md`

**Related Bugs:** BUG-003 (also routing/page structure)

---

### BUG-002: Middleware Blocking Static Assets
**Status:** CLOSED
**Severity:** High
**Reported:** 2026-02-03
**Fixed:** 2026-02-03
**Component:** Frontend / Middleware
**GitHub Issue:** https://github.com/linardsb/GERBONI/issues/2

**Description:**
Next.js middleware was intercepting requests to /fonts/ and /bg_images/ directories, causing 404 errors for static assets.

**Steps to Reproduce:**
1. Add a new font or image to `/public/fonts/` or `/public/bg_images/`
2. Reference it in CSS or a component
3. Load the page — the asset returns 404

**Expected Behavior:**
Static assets in `/public/` served directly without middleware intervention.

**Actual Behavior:**
Middleware intercepts the request and redirects or blocks it, resulting in 404.

**Root Cause:**
Middleware matcher pattern was too broad and didn't exclude static asset paths. The regex `/((?!_next|api|favicon.ico).*)`  caught `/fonts/`, `/bg_images/`, and `/coats/`.

**Fix:**
Updated `frontend/middleware.ts` matcher config to exclude `/fonts/:path*`, `/bg_images/:path*`, and `/coats/:path*` patterns. New regex: `/((?!_next|api|favicon.ico|coats|bg_images|fonts).*)`

**Commit:** 2d1a283

**Related Files:**
- `frontend/middleware.ts`

**Regression Test:** `frontend/src/__tests__/middleware.test.ts` → `matcher regex excludes static asset directories`

**Learning Outcomes:**
- **Fragile Area?** Yes — Middleware & Static Assets (Known Fragile Area #2 in CLAUDE.md)
- **Pattern:** Middleware matcher patterns that are too broad block static assets
- **Prevention Strategy:** Test matcher regex against known asset paths before deploying. Runbook: `docs/runbooks/adding-new-static-assets.md`

**Related Bugs:** None

---

### BUG-003: Root Path Missing Layout
**Status:** CLOSED
**Severity:** High
**Reported:** 2026-02-03
**Fixed:** 2026-02-03
**Component:** Frontend / Routing
**GitHub Issue:** https://github.com/linardsb/GERBONI/issues/3

**Description:**
Visiting `/` caused errors due to missing root layout and page components.

**Steps to Reproduce:**
1. Navigate to `http://localhost:3000/`
2. Page crashes or returns error

**Expected Behavior:**
Root path (`/`) redirects to default locale (`/en`).

**Actual Behavior:**
Root path returns an error because no `layout.tsx` or `page.tsx` exists at the root level.

**Root Cause:**
App router required root-level `layout.tsx` and `page.tsx` alongside the locale-based routing at `app/[locale]/`. Without them, Next.js couldn't render the root path.

**Fix:**
Created `frontend/src/app/layout.tsx` (minimal HTML wrapper) and `frontend/src/app/page.tsx` (redirects to `/en`).

**Commit:** bc02768

**Related Files:**
- `frontend/src/app/layout.tsx`
- `frontend/src/app/page.tsx`

**Regression Test:** `frontend/src/__tests__/pages/root-page.test.tsx` → `root page redirects to /en`

**Learning Outcomes:**
- **Fragile Area?** Yes — relates to i18n routing (Known Fragile Area #5)
- **Pattern:** Locale-prefixed routing requires explicit root path handling
- **Prevention Strategy:** Always verify root path (`/`) after routing changes. Runbook: `docs/runbooks/adding-new-pages.md`

**Related Bugs:** BUG-001 (also page structure)

---

### BUG-004: Admin Orders API Calling Wrong Service Methods
**Status:** CLOSED
**Severity:** Critical
**Reported:** 2026-02-06
**Fixed:** 2026-02-06
**Component:** Backend / Admin API
**GitHub Issue:** N/A (found during audit)

**Description:**
Admin orders API (`backend/app/api/admin/orders.py`) called 7 OrderService methods that either don't exist or use wrong parameter signatures. Every status transition from the admin panel would fail with `AttributeError` or `TypeError`.

**Steps to Reproduce:**
1. Log in as admin
2. Navigate to admin orders
3. Try to change any order's status (paid, processing, shipped, delivered, cancelled, refunded)
4. All transitions fail

**Expected Behavior:**
Admin can transition orders through all valid states.

**Actual Behavior:**
All 7 status transition calls fail due to wrong method names or parameter signatures.

**Root Cause:**
The admin orders API was written against a different (possibly outdated or assumed) OrderService interface. The actual `OrderService` methods use `order_id: int` parameters (not `order: Order` objects) and have different method names than what the API called.

**Fix:**
Corrected all 7 method calls in `update_order_status` and `ship_order` endpoints:

| Line | Broken Call | Fixed Call |
|------|-------------|-----------|
| 148 | `mark_paid(db, order, payment_id=...)` | `mark_paid(db, order.id, stripe_payment_id=...)` |
| 150 | `mark_processing(db, order)` | `transition_status(db, order.id, OrderStatus.PROCESSING)` |
| 152 | `mark_shipped(db, order)` | `ship_order(db, order.id)` |
| 154 | `mark_delivered(db, order)` | `mark_delivered(db, order.id)` |
| 156 | `cancel_order(db, order, ...)` | `cancel(db, order.id, ...)` |
| 158 | `mark_refunded(db, order)` | `process_refund(db, order.id)` |
| 188 | `mark_shipped(db, order, tracking_number=...)` | `ship_order(db, order.id, tracking_number=...)` |

Also added `await db.commit()` before `await db.refresh(order)` since services use `flush()`, not `commit()`.

**Related Files:**
- `backend/app/api/admin/orders.py`
- `backend/app/services/order_service.py`

**Regression Test:** `backend/tests/test_admin_orders.py` → `TestUpdateOrderStatus` (10 tests covering all transitions)

**Learning Outcomes:**
- **Fragile Area?** Yes — Order State Machine (Known Fragile Area #3 in CLAUDE.md)
- **Pattern:** API layer calling service methods with wrong signatures due to no integration tests
- **Prevention Strategy:** Always write integration tests for admin endpoints. Never assume service method signatures — read the actual service code. Services use `flush()` not `commit()` — callers must commit.

**Related Bugs:** None (first admin API bug, but BUG-002/003 also relate to missing test coverage)

---

### BUG-005: Agent Refund Bypasses OrderService
**Status:** CLOSED
**Severity:** High
**Reported:** 2026-02-07
**Fixed:** 2026-02-07
**Component:** Backend / AI Agent
**GitHub Issue:** N/A (found during fragile area audit)

**Description:**
The `request_refund` agent tool in `support_agent.py` set `order.status = OrderStatus.REFUNDED.value` directly instead of calling `OrderService.process_refund()`. This bypassed both state machine validation and stock restoration.

**Steps to Reproduce:**
1. Create a paid order with items
2. Trigger a refund via the AI chat agent
3. Check variant stock levels — unchanged (should have increased)
4. Set an order to CANCELLED, then try refunding via agent — succeeds (should fail)

**Expected Behavior:**
Refunds go through OrderService, which validates the state transition and restores stock.

**Actual Behavior:**
Direct status manipulation skipped transition validation (could refund a CANCELLED order) and never restored stock to inventory.

**Root Cause:**
The `request_refund` tool was written before `OrderService.process_refund()` existed or was not updated when the service layer was introduced. It also had a manual `eligible_statuses` list that excluded PROCESSING (which IS refundable per `VALID_TRANSITIONS`).

**Fix:**
- Replaced `order.status = OrderStatus.REFUNDED.value; await db.commit()` with `OrderService.process_refund(db, order.id, reason=reason, restore_stock=True); await db.commit()`
- Removed manual `eligible_statuses` check — OrderService handles transition validation
- Added `InvalidStateTransitionError` catch for user-friendly error messages
- PROCESSING orders now correctly eligible for refund

**Related Files:**
- `backend/app/agent/support_agent.py`
- `backend/app/services/order_service.py`

**Regression Test:** `backend/tests/test_agent.py` → `test_refund_paid_order_updates_status`, `test_refund_restores_stock`, `test_refund_cancelled_order`, `test_refund_processing_order`

**Learning Outcomes:**
- **Fragile Area?** Yes — Order State Machine (#3) + AI Agent (#4)
- **Pattern:** Agent tools duplicating service layer logic instead of delegating
- **Prevention Strategy:** Agent tools should always call service methods, never manipulate model state directly. Single source of truth for state transitions is `VALID_TRANSITIONS` in `order_service.py`.

**Related Bugs:** BUG-004 (also Order State Machine, wrong service calls)

---

### BUG-006: Payments API Missing Guest Checkout / Security Hole
**Status:** CLOSED
**Severity:** Critical
**Reported:** 2026-02-07
**Fixed:** 2026-02-07
**Component:** Backend / Payments API
**GitHub Issue:** N/A (found during fragile area audit)

**Description:**
The `create_checkout` endpoint in `payments.py` had no `X-Guest-Session` header support. When `user` was None (no JWT), the order query had NO ownership filter — any unauthenticated request could create a checkout session for ANY order.

**Steps to Reproduce:**
1. Create an order as a guest user
2. Try to call `POST /api/payments/create-checkout?order_id=X` with the guest session header — fails (no support)
3. Call the same endpoint with NO auth at all — succeeds for ANY order (security hole)

**Expected Behavior:**
Guest users can checkout their own orders. Unauthenticated requests are rejected.

**Actual Behavior:**
Guest users can't checkout at all. Unauthenticated requests can checkout ANY order.

**Root Cause:**
The `create_checkout` endpoint only checked `if user:` to add an ownership filter. The `else` branch had no filter at all, meaning the query returned any order matching the ID regardless of ownership. The `X-Guest-Session` header was never implemented despite being present in `orders.py` `create_order`.

**Fix:**
- Added `x_guest_session: str | None = Header(default=None)` parameter
- Added `AuthService` import for guest session lookup
- Three-way auth: JWT user → guest session (validates via `AuthService.get_guest_session()`, filters by `Order.guest_email`) → reject with 401
- Follows same dual-auth pattern as `create_order` in `orders.py`

**Related Files:**
- `backend/app/api/payments.py`

**Regression Test:** `backend/tests/test_payments.py` → `test_create_checkout_guest_session`, `test_create_checkout_no_auth_rejected`, `test_create_checkout_invalid_guest_session`, `test_create_checkout_guest_wrong_order`

**Learning Outcomes:**
- **Fragile Area?** Yes — Dual Auth System (#1) + Payments
- **Pattern:** Missing guest session support in endpoints that support both auth methods
- **Prevention Strategy:** Every endpoint that accepts `get_current_user` (optional) MUST also handle `X-Guest-Session`. When `user` is None and no guest session, ALWAYS reject with 401 — never allow unfiltered queries.

**Related Bugs:** BUG-004 (also service layer integration issues)

---

### BUG-007: Refund Window Uses Order Date Instead of Delivery Date
**Status:** CLOSED
**Severity:** Medium
**Reported:** 2026-02-07
**Fixed:** 2026-02-07
**Component:** Backend / AI Agent
**GitHub Issue:** N/A (found during fragile area audit)

**Description:**
The `request_refund` agent tool measured the 14-day return window from `order.created_at` (order placement date) instead of the delivery date. The store policy states "14-day return window from delivery date."

**Steps to Reproduce:**
1. Place an order (created_at = day 0)
2. Order gets delivered on day 12
3. Customer requests refund on day 13 (1 day after delivery)
4. Agent rejects: "Order was placed 13 days ago" — only 1 day left in window
5. But policy says customer has 14 days from delivery = 13 days remaining

**Expected Behavior:**
14-day window starts from delivery date. Non-delivered orders (PAID, PROCESSING, SHIPPED) have no time restriction since the window hasn't started.

**Actual Behavior:**
14-day window started from order placement date, unfairly penalizing customers with longer shipping times.

**Root Cause:**
The refund window check used `order.created_at` instead of considering the order's delivery status. The Order model has no `delivered_at` field, but `updated_at` serves as a reliable proxy since it's set by SQLAlchemy's `onupdate=func.now()` when the status transitions to DELIVERED.

**Fix:**
- DELIVERED orders: 14-day window measured from `order.updated_at` (delivery date proxy)
- Non-DELIVERED orders (PAID, PROCESSING, SHIPPED): No time restriction — delivery hasn't happened, so the refund window hasn't started
- Updated agent tool docstring to reflect corrected policy

**Related Files:**
- `backend/app/agent/support_agent.py`

**Regression Test:** `backend/tests/test_agent.py` → `test_refund_delivered_within_window`, `test_refund_delivered_expired_window`, `test_refund_shipped_no_time_limit`

**Learning Outcomes:**
- **Fragile Area?** Yes — Order State Machine (#3) + AI Agent (#4)
- **Pattern:** Business policy logic in agent tools diverging from stated policy in system prompt
- **Prevention Strategy:** Agent business rules should reference the system prompt policy text. Time windows should use the semantically correct timestamp, not just `created_at`. Consider adding a `delivered_at` column for explicit tracking.

**Related Bugs:** BUG-005 (also agent tool logic issues)

---

### BUG-008: Orders API Missing Guest Session Support / Security Hole
**Status:** CLOSED
**Severity:** Critical
**Reported:** 2026-02-07
**Fixed:** 2026-02-07
**Component:** Backend / Orders API
**GitHub Issue:** N/A (found during fragile area audit)

**Description:**
The `get_orders` (list) endpoint required JWT auth — guest users who created orders couldn't see them. The `get_order` (detail) endpoint accepted optional auth (`User | None`) but had no `X-Guest-Session` handling. When `user` was None, it passed `owner=None` to `OrderService.get_order()`, which returned ANY order regardless of ownership.

**Steps to Reproduce:**
1. Create an order as a guest user with `X-Guest-Session` header
2. Try `GET /api/orders` with the same guest session → 401 (no guest support)
3. Try `GET /api/orders/{id}` with NO auth at all → returns the order (security hole)

**Expected Behavior:**
Guest users can list/view their own orders via session token. Unauthenticated requests are rejected.

**Actual Behavior:**
Guests couldn't list orders at all. Any unauthenticated user could view any order by ID.

**Root Cause:**
`get_orders` used `Depends(get_authenticated_user)` (JWT-only). `get_order` used `Depends(get_current_user)` (optional) but never handled the case where `user` is None — it just passed `owner=None` which `OrderService` treated as "no filter".

**Fix:**
- Both endpoints now use three-way auth: JWT → guest session (`X-Guest-Session` header + `AuthService.get_guest_session()`) → 401 reject
- `get_orders` filters by `guest_email` for guest sessions
- `get_order` passes `guest_email` as owner for guest sessions
- Consistent with `create_order` and `create_checkout` patterns

**Related Files:**
- `backend/app/api/orders.py`

**Regression Test:** `backend/tests/test_orders.py` → `test_list_orders_guest_session`, `test_list_orders_invalid_guest_session`, `test_list_orders_no_auth_rejected`, `test_get_order_guest_session`, `test_get_order_invalid_guest_session`, `test_get_order_no_auth_rejected`, `test_get_order_guest_cross_access`, `test_list_orders_guest_cross_access`

**Learning Outcomes:**
- **Fragile Area?** Yes — Dual Auth System (#1)
- **Pattern:** Endpoints with `User | None` dependency and no guest session fallback create security holes — `owner=None` means no ownership filter
- **Prevention Strategy:** All 3 order endpoints (list/get/create) now use consistent three-way auth. Any new endpoint accepting optional auth MUST handle guest sessions or reject.

**Related Bugs:** BUG-006 (same pattern in payments API)

---

## Bug Template

```markdown
### BUG-XXX: [Short Description]
**Status:** OPEN
**Severity:** Low | Medium | High | Critical
**Reported:** YYYY-MM-DD
**Component:** [Area of codebase]
**GitHub Issue:** [link to GitHub issue]

**Description:**
[What's happening]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Root Cause:**
[If known]

**Fix:**
[Description of what was changed]

**Related Files:**
- [file paths]

**Regression Test:** `[test file path]` → `[test function name]`

**Learning Outcomes:**
- **Fragile Area?** [Yes/No — if Yes, update "Known Fragile Areas" in CLAUDE.md]
- **Pattern?** [Describe the bug pattern for future prevention]
- **Prevention Strategy:** [What check/test/hook would have caught this?]

**Related Bugs:** [BUG-XXX, BUG-YYY — cross-reference similar issues]
```

---

## Statistics

| Month | Opened | Closed | Net |
|-------|--------|--------|-----|
| Feb 2026 | 8 | 8 | 0 |

---

## Test Coverage Progress

Tracking coverage improvements to prevent future bugs:

| Date | Component | Before | After | Tests Added |
|------|-----------|--------|-------|-------------|
| 2026-02-07 | BUG-008 Orders guest session + security | N/A | N/A | 8 (guest order access) |
| 2026-02-07 | BUG-007 Refund window policy | N/A | N/A | 3 (delivery date window) |
| 2026-02-07 | BUG-005 Agent refund bypass | N/A | N/A | 4 (refund via OrderService) |
| 2026-02-07 | BUG-006 Payments guest checkout | N/A | N/A | 4 (guest checkout security) |
| 2026-02-07 | `app/api/agent.py` (WebSocket) | 0% | 91% | 30 |
| 2026-02-06 | E2E Tests | 19 failing | 0 failing | Fixed selectors |
| 2026-02-06 | BUG-004 Admin Orders API | N/A | N/A | 10 (TestUpdateOrderStatus) |

**Current Backend Test Count:** 358 tests (21 test files)
**Current Frontend Unit Test Count:** 380 tests (16 test files)
**Current Frontend E2E Test Count:** 6 spec files (40 tests)
