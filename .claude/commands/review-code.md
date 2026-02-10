## Context (INPUT)

You are reviewing code for the GERBONI e-commerce platform:

**Backend**: Python 3.11+, FastAPI, SQLAlchemy 2.0 async, Pydantic v2, Stripe, Pydantic AI 0.0.53
**Frontend**: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Zustand 5, next-intl, CVA, Radix UI
**Testing**: pytest + pytest-asyncio (backend), Vitest (frontend unit), Playwright (frontend E2E)

Before reviewing, read:
- `CLAUDE.md` (root) for architecture rules and known fragile areas
- `.claude/skills/gerboni-backend/SKILL.md` for backend patterns
- `.claude/skills/gerboni-frontend-design/SKILL.md` for frontend patterns

## Process (PROCESS)

Review the code across ALL of the following categories. Skip categories that don't apply to the files being reviewed.

### 1. Security & Authentication
- [ ] Endpoints touching user data use `require_auth()` or `get_auth()` from `deps.py` — NEVER raw `get_current_user` with `User | None` (BUG-008 vulnerability: `owner=None` fetches ANY record)
- [ ] `require_auth()` used for mutations (POST/PUT/DELETE/PATCH), `get_auth()` only for permissive reads
- [ ] AuthResult fields (`.user_id`, `.guest_email`, `.session_id`) correctly mapped to service Owner dataclasses
- [ ] No SQL injection via raw string interpolation in queries
- [ ] No secrets/credentials hardcoded (check `.env` references, API keys)
- [ ] Stripe webhook signature verification present
- [ ] Rate limiting applied to sensitive endpoints (auth, payments)
- [ ] Guest session token validated (not just trusted from header)
- [ ] CORS origins properly restricted (not wildcard in production)
- [ ] 2FA temp tokens checked for `type: "2fa_pending"` claim

### 2. Architecture — Three-Layer Separation
- [ ] **Services are HTTP-agnostic**: No `HTTPException`, `status`, or `Request` imports in `services/` files
- [ ] **Services raise domain exceptions**: `EntityNotFoundError`, `InsufficientStockError`, `InvalidStateTransitionError`, `EmptyCartError`, `AuthorizationError`, `ValidationError`
- [ ] **Routes translate exceptions**: `except DomainException as e: raise domain_to_http(e)`
- [ ] **Routes are thin**: Only parse request, call service, format response — no business logic
- [ ] **Services flush, routes commit**: Services call `await db.flush()`, route handlers call `await db.commit()` after success
- [ ] **No commit() in services**: This breaks transaction control for callers
- [ ] **No skip of commit() in routes**: Missing `await db.commit()` after mutating service call causes silent data loss

### 3. Database & SQLAlchemy
- [ ] Relationships eagerly loaded via `selectinload()` — lazy access triggers `MissingGreenlet` in async SQLite
- [ ] `Decimal` used for money columns (`Numeric(10, 2)`), never `float`
- [ ] New models exported from `backend/app/models/__init__.py` (conftest.py `import app.models` needs them)
- [ ] ForeignKey columns use `_id` suffix, timestamps use `_at` suffix, Latvian fields use `_lv` suffix
- [ ] Indexes on frequently queried columns (user_id, status, session_id)
- [ ] Pagination uses `.offset(skip).limit(limit)`, not unbounded queries
- [ ] HAVING clause used for filtering on aggregated values (min_price, total_stock) — not WHERE
- [ ] SQLite datetime compat: `_make_aware()` helper for timezone-naive comparisons

### 4. Type Safety
- [ ] Full type hints on all Python function signatures (params and return)
- [ ] `| None` union syntax used (not `Optional[]`)
- [ ] Pydantic schemas have `ConfigDict(from_attributes=True)` for ORM conversion
- [ ] `Field()` constraints on Pydantic models (min_length, max_length, ge, le)
- [ ] TypeScript strict mode — no `any` types, no `@ts-ignore`
- [ ] API response types match between backend schemas and frontend TypeScript interfaces

### 5. Order State Machine
- [ ] Valid transitions enforced: `pending->paid->processing->shipped->delivered` with `cancelled`/`refunded` branches
- [ ] Terminal states (`cancelled`, `refunded`) have no outgoing transitions
- [ ] Refund window: 14-day limit from delivery date (`updated_at` proxies `delivered_at`)
- [ ] Non-DELIVERED orders have no time-based refund restriction
- [ ] Stock restored on refund/cancellation

### 6. i18n — Translation Parity
- [ ] New user-facing strings added to BOTH `frontend/src/messages/en.json` AND `lv.json`
- [ ] `useTranslations("namespace")` hook used, never hardcoded text or inline ternaries
- [ ] ICU message format for interpolation: `t("key", { amount: value })` with `"{amount}"` in JSON
- [ ] Dynamic API data (city names, descriptions, date locales) may use `locale === "lv"` ternaries — that's intentional
- [ ] Test mocks for `useTranslations` include ALL keys the component uses

### 7. Frontend Design System
- [ ] Every component has `data-slot="name"` on root element
- [ ] All `className` merged via `cn()` from `@/lib/utils` — no template literals
- [ ] CVA used for component variants with `defaultVariants`
- [ ] No inline styles (`style={{}}`) — use Tailwind classes
- [ ] No arbitrary Tailwind values (`gap-[24px]`, `p-[16px]`) — use semantic tokens (`gap-section`, `gap-group`, `gap-element`)
- [ ] No hardcoded colors (`#ffffff`, `rgb(...)`) — use semantic tokens (`bg-primary`, `text-foreground`)
- [ ] No arbitrary z-index (`z-[999]`) — use scale: z-10 through z-80
- [ ] Spacing follows hierarchy: `gap-page` > `gap-section` > `gap-group` > `gap-element`
- [ ] Layout uses semantic components: Section > Container > Stack/Row > Grid > Card — no raw div with manual flex/grid
- [ ] Icons use Tabler Icons (`@tabler/icons-react`) with standard size classes (`size-3` to `size-12`)

### 8. Accessibility
- [ ] Icon-only buttons have `aria-label`
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Form inputs have `id`, `aria-invalid`, `aria-describedby` for errors
- [ ] Dialogs have `aria-modal`, `aria-labelledby`, `aria-describedby`
- [ ] Navigation has `aria-label` and `aria-current` for active page
- [ ] Loading states use `aria-busy="true"`
- [ ] Focus management: auto-focus in modals, return focus on close
- [ ] Keyboard navigation: Escape closes dialogs, arrow keys for lists

### 9. Frontend Patterns
- [ ] `useSearchParams()` wrapped in `<Suspense>` boundary (Next.js App Router requirement — build fails without it)
- [ ] Client components marked with `"use client"` directive
- [ ] Server components used for data fetching + metadata + JSON-LD
- [ ] Zustand stores use `persist` middleware where appropriate
- [ ] API calls use `token` and `guestSession?.session_token` from `useAuthStore`
- [ ] Error handling: `ApiError` class with `status`, `message`, `requestId`
- [ ] Toast notifications use `sonner` — success/error/promise patterns
- [ ] `locale` prop removed from migrated components — use `useTranslations()` instead

### 10. Testing
- [ ] Regression test written for bug fixes (fails on bug, passes on fix)
- [ ] Backend coverage >= 60%, frontend coverage >= 80%
- [ ] `conftest.py` imports `app.models` before `Base.metadata.create_all`
- [ ] Async tests marked with `@pytest.mark.asyncio`
- [ ] Rate limiting disabled in tests via `limiter.enabled = False`
- [ ] WebSocket tests include `host: localhost` header for TrustedHostMiddleware
- [ ] Test fixtures with relationships use `selectinload()` for eager loading
- [ ] Frontend test mocks include ALL translation keys the component uses
- [ ] Parametrized tests for state machine transitions
- [ ] Edge cases: empty cart checkout, invalid guest sessions, stock exhaustion, concurrent modifications

### 11. AI Agent (Pydantic AI)
- [ ] Agent uses `result_type` (not `output_type`) — Pydantic AI 0.0.53 API
- [ ] Tool functions accessed via `agent._function_tools[name].function`
- [ ] Tools delegate to service layer — never set model state directly (BUG-005 lesson)
- [ ] Tools check authorization before sensitive operations
- [ ] WebSocket auth flow: `auth` message -> `auth_success` -> `message`. Invalid guest token returns `guest_error`/`INVALID_SESSION`
- [ ] Agent dependencies use `RunContext[AgentDependencies]`

### 12. API Contracts & Error Handling
- [ ] `response_model` set on all route handlers
- [ ] Route registration order: `/export` before `/{id}` to avoid path conflicts
- [ ] Email service methods return `bool` and log errors — never let email failures break API responses
- [ ] Stripe errors caught separately from domain exceptions (502 for Stripe, domain_to_http for business rules)
- [ ] Newsletter API returns 200 even for already-subscribed (prevents email enumeration)
- [ ] CSV exports use `StreamingResponse(text/csv)` with proper headers

### 13. Performance & Caching
- [ ] Redis CacheService used for product list (5min TTL) and detail (10min TTL)
- [ ] Cache invalidation via `SCAN gerboni:products:*` on product mutations
- [ ] CacheService gracefully degrades when Redis unavailable (`_redis is None` -> no-op)
- [ ] Custom `_JSONEncoder` handles `Decimal` -> `str` and `datetime` -> `isoformat`
- [ ] Server-side fetch with `revalidate: 300` for ISR on product pages
- [ ] No N+1 queries — use `selectinload()` for relationship access

### 14. Docker & Production
- [ ] Next.js `output: "standalone"` set for Docker builds
- [ ] No volume mounts in production compose
- [ ] Sentry conditionally initialized (only when `sentry_dsn` configured)
- [ ] Database backup scripts use `pg_dump -Fc` format
- [ ] Environment variables not hardcoded in Dockerfiles

## Output Format (OUTPUT)

For each issue found:

- **File:Line** — Specific location
- **Category** — Which review category (1-14) it falls under
- **Issue** — What's wrong and why it matters
- **Suggestion** — Concrete fix with code example
- **Priority** — Critical / High / Medium / Low

Priority definitions:
- **Critical**: Security vulnerability, data loss risk, or production crash (auth bypass, missing commit, SQL injection)
- **High**: Architecture violation, silent bug, or fragile area regression (HTTPException in service, missing i18n, broken state machine)
- **Medium**: Code quality, missing tests, or design system drift (missing data-slot, arbitrary Tailwind values, no type hints)
- **Low**: Style, naming, documentation (inconsistent naming, missing docstring)

### Summary Section

After all issues, provide:

1. **Risk Assessment**: Overall risk level (Safe / Low / Medium / High / Critical)
2. **Fragile Areas Touched**: List any of the 6 known fragile areas affected (Dual Auth, Middleware, Order State Machine, AI Agent WebSocket, i18n, Test Infrastructure)
3. **Test Coverage**: Are there adequate tests for the changes? What's missing?
4. **Architecture Compliance**: Does the code follow the three-layer pattern?
