# GERBONI Task List

Track current work items and progress. Update status as work progresses.

## Status Legend
- [ ] Pending
- [x] Completed
- [~] In Progress

---

## Current Sprint

### Quick Wins — High Value, Low Effort
- [x] Product search & filtering (full-text search endpoint + color/size/price/stock filters on frontend)
- [x] SEO: Add `robots.txt` and `sitemap.xml` generator
- [x] SEO: Add JSON-LD structured data (Product, Organization schemas) + Product page SSR
- [x] Email sending (order confirmations, shipping updates, password reset via Resend)

### Medium Priority — Features & Hardening
- [x] Redis caching layer (products, cart, sessions)
- [x] Discount codes / coupons (models, endpoints, UI)
- [x] Sentry integration (replace in-house error tracker)
- [x] Admin CSV exports (orders, products, customers)
- [x] SEO: Hreflang + canonical tags (important for en/lv bilingual site)

### Production Readiness
- [x] Multi-stage Docker builds (remove build tools from final images)
- [x] Database backup strategy + automated dumps
- [x] 2FA authentication option (TOTP)
- [x] Load testing scripts (Locust)

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
- [x] Shared guest auth dependency (extract `X-Guest-Session` handling into reusable FastAPI dependency instead of repeating in each endpoint) — **DONE** Added `AuthResult`, `get_auth()`, `require_auth()` to deps.py; refactored 12 endpoints across 5 files
- [x] Flush/commit documentation (add inline comments or runbook documenting the service `flush()` / API `commit()` pattern) — **DONE** Created `docs/runbooks/flush-commit-pattern.md`

---

## Completed (Recent)

### 2026-02-08 (Full Test & Code Audit)
- [x] Run full test suite: 470 backend + 382 frontend + build clean
- [x] ESLint audit: 9 warnings → 0 (5 missing useEffect deps, 3 unused vars, 1 img element)
- [x] Backend code audit: 18 findings reviewed, 3 bugs filed (BUG-009, BUG-010, BUG-011)
- [x] Frontend code audit: 35 findings reviewed, 1 bug filed (BUG-011)
- [x] Fix BUG-009: Debug print leaking password reset tokens → replaced with structured logging
- [x] Fix BUG-010: Silent exception swallowing (3 bare `except: pass` blocks) → added logging
- [x] Fix BUG-011: Hardcoded English default in ProductGrid `emptyMessage` → removed default
- [x] Updated docs/testing/README.md with accurate test counts (24 backend modules, 470 tests)
- [x] Updated tasks/bugs.md with BUG-009 through BUG-011 and current test counts

### 2026-02-08 (Production Readiness — All 4 Items)
- [x] Multi-stage Docker builds
  - Backend: 2-stage build (builder with gcc/libpq-dev → runtime with libpq5/curl only), non-root `appuser`
  - Frontend: 3-stage build (deps → builder → runner with Next.js standalone output), non-root `nextjs` user
  - Added `output: "standalone"` to `next.config.ts`
  - Created `docker-compose.prod.yml` (no volume mounts, no --reload, restart: always, env validation)
- [x] Database backup strategy
  - `scripts/backup-db.sh` — pg_dump with custom format, 30-day rotation, optional S3 upload
  - `scripts/restore-db.sh` — pg_restore with safety confirmation + post-restore verification
  - `db-backup` service in docker-compose.prod.yml (postgres:16-alpine, daily cron at 2:00 AM)
- [x] 2FA authentication (TOTP)
  - Backend: 3 new User model fields + alembic migration 002
  - AuthService: 10 new methods (TOTP generate/verify, backup codes, QR code, temp tokens)
  - 5 new schemas (TwoFactorSetupResponse, TwoFactorVerifyRequest, etc.)
  - 4 new API endpoints (setup, enable, disable, verify) + modified login flow
  - 25 new backend tests (all passing)
  - Frontend: login + register pages with 2FA verification step
  - Account page security tab with full 2FA lifecycle (setup → QR → backup codes → disable)
  - 31 new i18n keys across auth + account namespaces (en + lv)
- [x] Load testing scripts (Locust)
  - `load-tests/locustfile.py` — 4 weighted user scenarios (browse, cart, auth, checkout)
  - Locust service in docker-compose.prod.yml (profile: loadtest, web UI on :8089)
- Backend: 470 tests passing (was 445, +25 new 2FA tests)
- Frontend: build clean

### 2026-02-08 (Medium Priority — All 5 Items)
- [x] SEO: Hreflang + canonical tags
  - Added `alternates` (canonical + hreflang en/lv/x-default) to locale layout `generateMetadata()`
  - Cascades to all child pages; product pages override with product-specific alternates
  - Admin layout: added noindex/nofollow meta via useEffect (client component)
- [x] Redis caching layer
  - `backend/app/services/cache_service.py` — CacheService with graceful degradation (all ops no-op when Redis unavailable)
  - Products list cached 5min, detail 10min; pattern-based invalidation on admin variant update
  - Custom JSON encoder for Decimal/datetime serialization
  - Added Redis service to docker-compose.yml (redis:7-alpine with healthcheck)
  - 26 new tests (JSONEncoder, no-Redis no-ops, mocked Redis get/set/delete/invalidate)
- [x] Sentry integration
  - Backend: conditional init when `sentry_dsn` set, error middleware captures to Sentry, errors API returns "use Sentry" message
  - Frontend: @sentry/nextjs with client/server/edge configs, conditional withSentryConfig in next.config.ts
  - In-memory error tracker kept as dev-mode fallback (zero impact when Sentry not configured)
- [x] Admin CSV exports
  - `backend/app/utils/csv_export.py` — StreamingResponse helper with csv.DictWriter
  - `/export` endpoints on admin orders (with date/status filters), products (one row per variant), users (excludes guests)
  - Route ordering: `/export` registered BEFORE `/{id}` to avoid path conflicts
  - Frontend: `downloadCsv()` helper with blob URL + auth header, Export CSV buttons on all 3 admin pages
  - 8 new tests (CSV content type, headers, row counts, auth required)
- [x] Discount codes / coupons
  - `DiscountCode` model (percentage/fixed, min_order, max_uses, date range, active flag)
  - `DiscountService` (validate_code, calculate_discount, increment_usage, CRUD)
  - Public `POST /api/discounts/validate` + Admin CRUD `/api/admin/discounts`
  - Order model extended with subtotal, discount_code, discount_amount fields
  - Stripe: on-the-fly Coupon creation for discounted checkout sessions
  - Frontend: cart-summary promo code input wired to validate API, discount line display with remove
  - 18 new tests (validation rules, calculations, API endpoints, admin CRUD)
  - Timezone-aware datetime comparison helper for SQLite/PostgreSQL compatibility
- Backend: 445 tests passing (was 393, +52 new: 26 cache + 18 discounts + 8 CSV exports)
- Frontend: build clean, 376/382 tests passing (6 pre-existing store.test.ts failures unrelated to changes)

### 2026-02-08 (Quick Wins — All 4 Items)
- [x] Product search & filtering (full-text search endpoint + color/size/price/stock filters on frontend)
  - Backend: 7 new query params (`q`, `color`, `size`, `min_price`, `max_price`, `in_stock`, `sort`) on `GET /api/products`
  - ILIKE search on city_name, city_name_lv, description, description_lv
  - Color/size filter via EXISTS subquery, price/stock filter via HAVING on aggregates
  - Sort options: price_asc, price_desc, name_asc, newest
  - 33 new backend tests (TestProductSearch, TestProductColorFilter, etc.)
  - Frontend: search input with 300ms debounce, color/size chips, sort dropdown
  - URL params for shareable filter state, active filters summary with clear button
  - Added 16 translation keys to en.json + lv.json (product namespace)
  - Fix: wrapped `useSearchParams()` in Suspense boundary (Next.js requirement)
- [x] SEO: `robots.txt` and `sitemap.xml` generator
  - `frontend/src/app/robots.ts` — allow /, disallow /api/ and /admin/
  - `frontend/src/app/sitemap.ts` — dynamic sitemap from products API, both en/lv locales
  - ISR revalidation: 3600s for sitemap
- [x] SEO: JSON-LD structured data (Product, Organization schemas) + Product page SSR
  - `frontend/src/components/compositions/json-ld.tsx` — reusable JSON-LD component
  - Organization schema in locale layout (name, url, logo, contactPoint)
  - Product schema on detail pages (name, description, image, AggregateOffer, brand, sku)
  - Product page split: server component (`page.tsx`) + client component (`product-client.tsx`)
  - `generateMetadata()` for dynamic title, description, OpenGraph, alternates per product
  - Server-side data fetching with `revalidate: 300`
- [x] Email sending (order confirmations, shipping updates, password reset via Resend)
  - `backend/app/services/email_service.py` — 4 async methods, all return bool, never raise
  - `send_password_reset`, `send_order_confirmation`, `send_shipping_notification`, `send_newsletter_welcome`
  - Wired into: auth.py (forgot password), payments.py (webhook), admin/orders.py (ship), newsletter.py (subscribe)
  - Config: `resend_api_key`, `from_email`, `site_url` in config.py
  - 12 new backend tests (mock Resend API, config, success/failure for all 4 types)
  - Backend: 393 tests passing (was 358, +35 new), 72% coverage
  - Frontend: 382 tests passing, build clean

### 2026-02-07 (P3 Code Quality)
- [x] Extract shared guest auth dependency — `AuthResult`, `get_auth()`, `require_auth()` in `deps.py`
  - Refactored 12 endpoints across 5 files (orders, cart, payments, wishlist, reviews)
  - Removed ~90 lines of duplicated 3-way auth boilerplate
  - `require_auth()` distinguishes "invalid guest session" vs "no auth" for proper client error handling
  - Backend: 358 tests still passing (zero behavior change)
- [x] Create flush/commit runbook — `docs/runbooks/flush-commit-pattern.md`
  - Documents service `flush()` / API `commit()` transaction boundary pattern
  - Includes common mistakes, verification commands, and quick reference table

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
