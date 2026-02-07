# GERBONI Task List

Track current work items and progress. Update status as work progresses.

## Status Legend
- [ ] Pending
- [x] Completed
- [~] In Progress

---

## Current Sprint

(No items in progress — all P1 items complete)

---

## Backlog (from Fragile Area Audit, 2026-02-07)

### P1 — Broken Guest UX / i18n
- [x] Orders list endpoint doesn't support guest sessions (`GET /api/orders` requires JWT, guests can't see their orders) — **BUG-008 FIXED**
- [x] 130+ hardcoded locale strings in frontend — **MIGRATED** to `useTranslations()` across 14 files, ~80 new keys in en.json + lv.json, 12 remaining ternaries are dynamic API data (city names, descriptions, date locales)

### P2 — Prevention / Partial UX
- [x] Middleware audit test (automated test that verifies new `/public/` dirs don't break middleware matcher) — **DONE** Added audit test to `middleware.test.ts`
- [x] Guest session token silent failure in WebSocket (invalid `session_token` doesn't return error — silently continues unauthenticated) — **FIXED** Returns `guest_error` with `INVALID_SESSION` code
- [x] Toast messages not translated (mix of hardcoded English, hardcoded Latvian, and proper translation keys) — **DONE** Translated 30+ toast strings across 11 files, added ~20 new keys to en.json + lv.json

### P3 — Code Quality / Developer Safety
- [ ] Shared guest auth dependency (extract `X-Guest-Session` handling into reusable FastAPI dependency instead of repeating in each endpoint)
- [ ] Flush/commit documentation (add inline comments or runbook documenting the service `flush()` / API `commit()` pattern)

---

## Completed (Recent)

### 2026-02-07 (P2 Fixes)
- [x] Fix WebSocket guest session silent failure — invalid `session_token` now returns `guest_error` / `INVALID_SESSION`
- [x] Add middleware audit test — verifies all `/public/` directories excluded from matcher
- [x] Translate 30+ hardcoded toast messages across 11 files (4 components, 4 admin pages, 2 auth pages, 1 popup)
  - Added ~20 new keys to en.json + lv.json (admin, reviews, wishlist, auth namespaces)
  - Frontend: 382 tests passing, build clean
  - Backend: 358 tests passing

### 2026-02-07
- [x] Migrate 130+ hardcoded locale ternaries to `useTranslations()` across 14 frontend files
  - Added ~80 translation keys to en.json + lv.json (7 namespaces: product, cart, checkout, footer, chat, order, home)
  - Removed `locale` prop from 6 components (cart-item, cart-summary, checkout-form, size-selector, color-selector, checkout-progress)
  - Fixed parent components still passing removed `locale` props (ColorSelector, SizeSelector in products/[id])
  - Updated test mocks for new translation keys (product-card.test.tsx)
  - 12 remaining ternaries are all dynamic API data (city names, descriptions, date locales)
  - Build passes, 380/380 frontend tests passing
- [x] Fix BUG-008: Orders list/get endpoints missing guest session support + get_order security hole (no ownership filter when unauthenticated)
- [x] Add 8 guest order access regression tests (list/get with valid session, invalid session, no auth, cross-guest prevention)
- [x] Backend test count: 350 → 358 tests (all passing)
- [x] Fix BUG-007: Refund window uses `created_at` not delivery date — now checks `updated_at` for DELIVERED orders only
- [x] Add 3 refund window regression tests (delivered within/expired window, shipped no time limit)
- [x] Fix BUG-005: Agent refund bypasses OrderService (skipped stock restoration + transition validation)
- [x] Fix BUG-006: Payments API missing guest checkout + security hole (no ownership filter when unauthenticated)
- [x] Add 4 agent refund regression tests (status update, stock restore, cancelled rejection, PROCESSING eligible)
- [x] Add 4 guest checkout regression tests (valid session, no-auth reject, invalid session, wrong order)
- [x] Backend test count: 339 → 350 tests (all passing)
- [x] Add WebSocket integration tests for AI Agent chat endpoint (30 tests)
- [x] Achieve 91% coverage on `app/api/agent.py` (was 0%)
- [x] Create `WebSocketTestClient` wrapper for TrustedHostMiddleware compatibility
- [x] Document guest auth fallback behavior (invalid session_token doesn't fall back to email)
- [x] Update CLAUDE.md and MEMORY.md with test coverage status
- [x] Backend test count: 309 → 339 tests (all passing)
- [x] Add guest session email context tests (session.email vs provided email)

### 2026-02-06
- [x] Fix 19 failing E2E tests (locale prefixes and component selectors)
- [x] Fix all ESLint warnings across frontend codebase
- [x] Update E2E test routes with `/en/` locale prefix
- [x] Fix product variant button selectors in E2E tests

### 2026-02-04
- [x] Fix locale preservation in navigation using i18n Link
- [x] Add permanent admin account to database seed
- [x] Update exit intent popup translations (clickToCopy, continueShopping, close)
- [x] Add admin management CLI tool (`backend/app/cli.py`)
- [x] Refresh task tracking and bug report files

### 2026-02-03
- [x] Enforce design system tokens across frontend codebase
- [x] Add 3D pushback hover effect to CTA buttons
- [x] Fix inline styles and hardcoded colors to follow design system
- [x] Add role field to user schema and frontend types
- [x] Fix cart page Latvian translations
- [x] Add register page and fix internationalization across app
- [x] Fix FAQ translations - migrate 27 hard-coded questions to en.json/lv.json
- [x] Integrated Latvian font (Liva) into design system
- [x] Applied background images to homepage CTA section
- [x] Fixed middleware matcher to exclude static assets (BUG-002)
- [x] Created root page redirect for locale routing (BUG-003)
- [x] Created frontend Dockerfile and .dockerignore
- [x] Full Docker Compose stack running (backend + frontend + db)

---

## Notes

- Always update this file when starting/completing tasks
- Reference bug IDs from `bugs.md` when fixing issues
- Use git status to identify uncommitted work
