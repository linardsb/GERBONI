# GERBONI Task List

Track current work items and progress. Update status as work progresses.

## Status Legend
- [ ] Pending
- [x] Completed
- [~] In Progress

---

## Current Sprint

### Frontend
- [ ] Commit exit intent popup translation updates (en.json/lv.json)

### Backend
- [ ] Commit new admin CLI tool (`backend/app/cli.py`)

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

### 2026-02-04
- [x] Fix locale preservation in navigation using i18n Link
- [x] Add permanent admin account to database seed
- [x] Update exit intent popup translations (clickToCopy, continueShopping, close)

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

## Uncommitted Changes

| File | Description |
|------|-------------|
| `frontend/src/messages/en.json` | Exit intent popup translation updates |
| `frontend/src/messages/lv.json` | Exit intent popup translation updates |
| `backend/app/cli.py` | New admin management CLI (untracked) |
| `backend/app/CLAUDE.md` | Minor updates |
| `frontend/src/app/[locale]/wishlist/CLAUDE.md` | Minor updates |

---

## Notes

- Always update this file when starting/completing tasks
- Reference bug IDs from `bugs.md` when fixing issues
- Use git status to identify uncommitted work
