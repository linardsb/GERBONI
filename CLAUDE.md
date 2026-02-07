# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## MANDATORY: Session Initialization

**IMPORTANT: You MUST read the following architecture files at the start of EVERY new session BEFORE doing any other work. This is a non-negotiable requirement.**

Execute these reads immediately when a session starts:

### 1. Backend Core (MUST READ)
```
backend/app/main.py
backend/app/config.py
backend/app/database.py
backend/app/exceptions.py
```

### 2. Database Models (MUST READ)
```
backend/app/models/__init__.py
backend/app/models/user.py
backend/app/models/product.py
backend/app/models/order.py
backend/app/models/cart.py
```

### 3. API Layer (MUST READ)
```
backend/app/api/__init__.py
backend/app/api/deps.py
backend/app/agent/support_agent.py
```

### 4. Frontend System (MUST READ)
```
frontend/src/lib/api.ts
frontend/src/lib/store.ts
frontend/src/lib/websocket.ts
frontend/src/app/layout.tsx
```

**DO NOT proceed with any user request until you have read ALL files listed above. Read them in parallel to be efficient.**

### 5. Project Status (MUST READ)
```
tasks/CLAUDE.md
```

This file contains current sprint status, open bugs, and test coverage. Check it to understand project state before starting work.

---

## MANDATORY: Development Skills

**BEFORE making ANY changes to frontend or backend code, you MUST:**
1. **READ** the relevant skill file in full using the Read tool
2. **THEN** proceed with implementation following the skill's patterns

**This is non-negotiable. Do NOT skip reading the skill file even if the fix seems obvious.**

### Frontend Changes → READ FIRST:
`.claude/skills/gerboni-frontend-design/SKILL.md`

**Applies to ANY:**
- File in `frontend/src/components/`
- `.tsx` file modification
- CSS/styling changes
- New React component creation

### Backend Changes → READ FIRST:
`.claude/skills/gerboni-backend/SKILL.md`

**Applies to ANY:**
- File in `backend/app/`
- API endpoint changes
- Database model or schema changes
- Service layer logic
- Middleware or error handling
- AI support agent modifications
- Stripe payment code

---

## Project Overview

GERBONI is a full-stack e-commerce platform selling t-shirts featuring Latvian city coats of arms, with an AI-powered customer support agent using Pydantic AI and Claude.

## Development Commands

### Docker (Recommended)
```bash
docker compose up -d                    # Start all services
docker compose --profile seed up seed   # Seed database with products
docker compose down                     # Stop services
docker compose logs -f backend          # Follow backend logs
```

### Backend Development
```bash
cd backend
source venv/bin/activate                # Activate virtualenv
uvicorn app.main:app --reload           # Run with hot reload on :8000
python -m app.seed                      # Seed database locally
```

### Frontend Development
```bash
cd frontend
npm run dev      # Dev server on :3000
npm run build    # Production build
npm run lint     # ESLint check
```

## Architecture

### Stack
- **Backend**: FastAPI + SQLAlchemy 2.0 (async) + PostgreSQL 16
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS 4 + Zustand
- **AI Agent**: Pydantic AI with Claude Sonnet 4 via WebSocket
- **Payments**: Stripe (checkout sessions, webhooks)

### Key Architectural Patterns

**Dual Authentication System**:
- JWT-based for registered users (`Authorization: Bearer <token>`)
- Session tokens for guest checkout (`X-Guest-Session: <token>`)
- Both supported in cart, orders, and AI chat

**AI Agent Tool Pattern** (`backend/app/agent/support_agent.py`):
Tools receive `RunContext[AgentDependencies]` with `user_id` or `guest_email` for data scoping. The agent has 5 tools: `get_order_details`, `get_user_orders`, `search_products`, `get_product_details`, `request_refund`.

**Frontend State** (`frontend/src/lib/store.ts`):
Zustand stores for auth (token/user persistence), cart loading state, and chat widget state. API client in `frontend/src/lib/api.ts` auto-attaches auth headers.

**WebSocket Chat** (`frontend/src/lib/websocket.ts`):
Singleton `ChatWebSocket` with auth message flow, auto-reconnect, and message handler registration.

### Database Schema (5 main tables)
- `users` / `guest_sessions`: Dual auth support
- `products` / `tshirt_variants`: 10 cities × 6 colors × 6 sizes = 360 SKUs
- `orders` / `order_items`: Status: pending → paid → processing → shipped → delivered
- `cart_items`: Links to user_id OR session_id

## API Structure

All routes prefixed with `/api`:
- `/products`, `/products/{id}`, `/products/{id}/variants` - Catalog
- `/cart` - CRUD for cart items
- `/orders`, `/orders/{id}` - Order management
- `/auth/register`, `/auth/login`, `/auth/guest-session`, `/auth/convert-guest`
- `/payments/create-checkout`, `/payments/webhooks/stripe`
- `/agent/chat` (WebSocket) - AI support chat

Interactive API docs at `http://localhost:8000/docs`.

## Environment Variables

**Backend** (`backend/.env`):
```
DATABASE_URL=postgresql+asyncpg://gerboni:gerboni@localhost:5432/gerboni
SECRET_KEY=...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
ANTHROPIC_API_KEY=sk-ant-...
```

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

## Key File Locations

| Purpose | Path |
|---------|------|
| FastAPI app entry | `backend/app/main.py` |
| AI agent + tools | `backend/app/agent/support_agent.py` |
| API routes | `backend/app/api/*.py` |
| SQLAlchemy models | `backend/app/models/*.py` |
| Pydantic schemas | `backend/app/schemas/*.py` |
| Frontend API client | `frontend/src/lib/api.ts` |
| Zustand stores | `frontend/src/lib/store.ts` |
| WebSocket manager | `frontend/src/lib/websocket.ts` |
| Chat widget | `frontend/src/components/components/chat-widget.tsx` |
| **Backend Skill** | `.claude/skills/gerboni-backend/SKILL.md` |
| **Frontend Skill** | `.claude/skills/gerboni-frontend-design/SKILL.md` |
| Design tokens (CSS) | `frontend/src/app/globals.css` |
| Design tokens (TS) | `frontend/src/lib/design-tokens.ts` |
| **Task Tracking** | `tasks/CLAUDE.md` (summary), `tasks/todo.md`, `tasks/bugs.md` |

## Testing

### Backend (pytest)
```bash
cd backend
pytest --cov=app --cov-report=term-missing -v    # Full suite with coverage
pytest tests/test_auth.py -v                      # Single module
pytest -k "test_login" -v                         # Single test by name
```
- **358 test cases** across 21 test files including auth, cart, orders, payments, products, agent, websocket
- Uses in-memory SQLite via `conftest.py` fixtures (`db_session`, `client`, `auth_client`)
- Stripe/Anthropic mocked via `mock_stripe_service`, `mock_anthropic_agent` fixtures
- WebSocket testing uses `WebSocketTestClient` wrapper with explicit host header for TrustedHostMiddleware

### Frontend Unit Tests (Vitest)
```bash
cd frontend
npm run test                  # Watch mode
npm run test:coverage         # Single run with coverage (80% threshold)
```
- **16 test files** with `@testing-library/react` + MSW for API mocking
- Coverage thresholds: 80% branches, functions, lines, statements
- Config: `frontend/vitest.config.ts`

### Frontend E2E Tests (Playwright)
```bash
cd frontend
npm run e2e                   # All browsers
npm run e2e:chromium          # Chromium only (fastest)
npm run e2e:headed            # With browser UI
npm run e2e:debug             # Step-through debugger
```
- **6 spec files**: home, auth, products, navigation, chat, checkout-flow
- Configured for: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- Config: `frontend/playwright.config.ts`

### CI Pipeline (GitHub Actions)
5 parallel jobs in `.github/workflows/ci.yml`:
1. `backend-tests` — pytest with PostgreSQL service container
2. `frontend-tests` — Vitest + ESLint
3. `frontend-build` — Production build check
4. `e2e-tests` — Playwright (depends on jobs 1-3)
5. `security-scan` — Bandit, safety, npm audit

### Manual Testing
- Stripe test mode with `sk_test_...` keys
- Anthropic sandbox with test API keys
- Guest checkout flow: no account needed

---

## Known Fragile Areas

Areas that have broken before or are high-risk. Pay extra attention when modifying:

1. **Dual Auth System** — Endpoints must support both JWT (`Authorization: Bearer`) and guest session (`X-Guest-Session`). Cart, orders, wishlist, and AI chat all need both paths. Missing one causes silent auth failures. **Use the shared dependencies in `deps.py`**: `require_auth()` (strict — 401 if neither), `get_auth()` (permissive — allows anonymous). Both return `AuthResult` with `.user_id`, `.guest_email`, `.session_id` properties.

2. **Middleware & Static Assets** — Next.js middleware matcher pattern must exclude new asset paths. Adding new `/public/` directories without updating `middleware.ts` causes 404s (see BUG-002). An automated audit test in `middleware.test.ts` verifies all known public directories are excluded.

3. **Order State Machine** — Strict `pending → paid → processing → shipped → delivered` flow with `cancelled` and `refunded` branches. The `request_refund` agent tool enforces a 14-day window. Changing status logic risks payment/refund inconsistencies.

4. **AI Agent WebSocket** — Now tested with 91% coverage (30 tests in `test_websocket_agent.py`). The `support_agent.py` has 5 tools with database access scoped by user identity. WebSocket auth flow (`auth` → `auth_success` → `message`) is now tested. Invalid `session_token` returns `guest_error`/`INVALID_SESSION` (no longer silent). Guest auth does NOT fall back to email — client must retry.

5. **i18n Translations** — New UI text MUST go in both `en.json` AND `lv.json`. Hard-coded strings cause locale-dependent rendering bugs (see BUG-001). All 18 routes are locale-prefixed.

---

## Post-Fix Verification Workflow

**Mandatory after ANY bug fix:**

1. **Regression Test** — Write a test that fails on the buggy code and passes on the fix
2. **Run `/bug-fix-retrospective`** — Captures root cause, creates GitHub Issue, suggests prevention
3. **Update Fragile Areas** — If a new pattern is discovered, add it to "Known Fragile Areas" above
4. **Verify CI Passes** — Push and confirm all 5 CI jobs are green

<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

*No recent activity*
</claude-mem-context>
