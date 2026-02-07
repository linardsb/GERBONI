# GERBONI Task List

Track current work items and progress. Update status as work progresses.

## Status Legend
- [ ] Pending
- [x] Completed
- [~] In Progress

---

## Current Sprint

### Frontend
- [ ] (No active tasks)

### Backend
- [ ] (No active tasks)

### DevOps
- [ ] (No active tasks)

---

## Backlog

### Frontend
- [ ] (No items)

### Backend
- [ ] (No items)

### Documentation
- [ ] (No items)

---

## Completed (Recent)

### 2026-02-07
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
