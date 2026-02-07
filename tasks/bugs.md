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
| Feb 2026 | 4 | 4 | 0 |

---

## Test Coverage Progress

Tracking coverage improvements to prevent future bugs:

| Date | Component | Before | After | Tests Added |
|------|-----------|--------|-------|-------------|
| 2026-02-07 | `app/api/agent.py` (WebSocket) | 0% | 91% | 30 |
| 2026-02-06 | E2E Tests | 19 failing | 0 failing | Fixed selectors |
| 2026-02-06 | BUG-004 Admin Orders API | N/A | N/A | 10 (TestUpdateOrderStatus) |

**Current Backend Test Count:** 339 tests (21 test files)
**Current Frontend Unit Test Count:** 380 tests (16 test files)
**Current Frontend E2E Test Count:** 6 spec files (40 tests)
