# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GERBONI is a full-stack e-commerce platform selling t-shirts featuring Latvian city coats of arms, with an AI-powered customer support agent using Pydantic AI and Claude.

## Development Skills

**BEFORE making code changes, READ the relevant skill file:**

| Change Type | Read First |
|-------------|------------|
| Frontend (`.tsx`, components, CSS) | `.claude/skills/gerboni-frontend-design/SKILL.md` |
| Backend (`backend/app/`) | `.claude/skills/gerboni-backend/SKILL.md` |
| After any bug fix | Run `/bug-fix-retrospective` |

**Do NOT skip reading the skill file even if the fix seems obvious.**

## Development Commands

### Docker (Recommended)
```bash
docker compose up -d                    # Start all services
docker compose --profile seed up seed   # Seed database with products
docker compose down                     # Stop services
docker compose logs -f backend          # Follow backend logs
```

### Backend
```bash
cd backend
source venv/bin/activate                # Activate virtualenv
uvicorn app.main:app --reload           # Run with hot reload on :8000
python -m app.seed                      # Seed database locally
```

### Frontend
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

### Key Patterns

**Dual Authentication**: JWT for registered users (`Authorization: Bearer`) + session tokens for guests (`X-Guest-Session`). Use `require_auth()` (strict) or `get_auth()` (permissive) from `backend/app/api/deps.py` — both return `AuthResult` with `.user_id`, `.guest_email`, `.session_id`.

**Service Layer**: Services use `flush()` not `commit()`. API layer **MUST** call `await db.commit()` then `db.refresh()`. See `docs/runbooks/flush-commit-pattern.md`.

**Order State Machine**: `pending → paid → processing → shipped → delivered` with `cancelled`/`refunded` branches. 14-day refund window from delivery date.

**i18n**: All 18 routes locale-prefixed. New UI text **MUST** go in both `frontend/src/messages/en.json` AND `frontend/src/messages/lv.json`. Use `useTranslations()` hooks, not inline ternaries.

### Environment

Backend env: `backend/.env` | Frontend env: `frontend/.env.local` | API docs: `http://localhost:8000/docs`

## Testing

```bash
# Backend (pytest — in-memory SQLite via conftest.py)
cd backend && pytest --cov=app --cov-report=term-missing -v
pytest tests/test_auth.py -v              # Single module
pytest -k "test_login" -v                 # Single test

# Frontend unit (Vitest — 80% coverage threshold)
cd frontend && npm run test:coverage

# Frontend E2E (Playwright)
cd frontend && npm run e2e:chromium       # Fastest
cd frontend && npm run e2e:headed         # With browser UI
```

- Backend fixtures: `db_session`, `client`, `auth_client` (in-memory SQLite + StaticPool)
- Frontend: `@testing-library/react` + MSW for API mocking
- CI: 5 parallel jobs in `.github/workflows/ci.yml` (backend, frontend, build, e2e, security)

## Key File Locations

| Purpose | Path |
|---------|------|
| Backend skill | `.claude/skills/gerboni-backend/SKILL.md` |
| Frontend skill | `.claude/skills/gerboni-frontend-design/SKILL.md` |
| AI agent + tools | `backend/app/agent/support_agent.py` |
| Shared auth deps | `backend/app/api/deps.py` |
| Frontend API client | `frontend/src/lib/api.ts` |
| Design tokens (CSS) | `frontend/src/app/globals.css` |
| Design tokens (TS) | `frontend/src/lib/design-tokens.ts` |
| Task tracking | `tasks/CLAUDE.md`, `tasks/todo.md`, `tasks/bugs.md` |

## Known Fragile Areas

Areas that have broken before or are high-risk. Pay extra attention when modifying:

1. **Dual Auth System** — Endpoints must support both JWT and guest session. Use `require_auth()` (strict — 401 if neither) or `get_auth()` (permissive — allows anonymous) from `deps.py`. Missing one path causes silent auth failures.

2. **Middleware & Static Assets** — Next.js middleware matcher must exclude `/public/` subdirectories. New assets without matcher update cause 404s. Audit test in `middleware.test.ts` verifies coverage.

3. **Order State Machine** — Strict status transitions with `cancelled`/`refunded` branches. The `request_refund` agent tool enforces a 14-day window from delivery (`updated_at` proxies `delivered_at`). Changing status logic risks payment inconsistencies.

4. **AI Agent WebSocket** — Auth flow: `auth` → `auth_success` → `message`. Invalid guest `session_token` returns `guest_error`/`INVALID_SESSION`. Guest auth does NOT fall back to email — client must retry.

5. **i18n Translations** — Hard-coded strings cause locale-dependent rendering bugs. Use `useTranslations()` hooks. Both `en.json` and `lv.json` must be updated together.

6. **Test Infrastructure** — `conftest.py` **MUST** `import app.models` before `Base.metadata.create_all` (empty metadata otherwise). Pydantic AI pre-1.0: uses `result_type` not `output_type`, `_function_tools` not `_function_toolset`. Pin dependency versions.

---

## Post-Fix Verification

**Mandatory after ANY bug fix:**

1. **Regression Test** — Write a test that fails on the buggy code and passes on the fix
2. **Run `/bug-fix-retrospective`** — Captures root cause, creates GitHub Issue, suggests prevention
3. **Update Fragile Areas** — If a new pattern is discovered, add it to "Known Fragile Areas" above
4. **Verify CI Passes** — Push and confirm all 5 CI jobs are green
