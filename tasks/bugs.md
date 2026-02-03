# GERBONI Bug Tracker

Track bugs, issues, and their resolutions. Reference these IDs in commits and todo.md.

## Status Legend
- `OPEN` - Bug identified, not yet fixed
- `IN_PROGRESS` - Currently being worked on
- `FIXED` - Fix implemented, needs verification
- `CLOSED` - Verified fixed and deployed

---

## Open Bugs

### BUG-001: FAQ Page Not Translated
**Status:** OPEN
**Severity:** Medium
**Reported:** 2026-02-03
**Component:** Frontend / i18n

**Description:**
FAQ page displays only English content regardless of selected locale. The 27 FAQ questions are hard-coded in the component instead of using the translation system.

**Root Cause:**
`frontend/src/app/[locale]/faq/page.tsx` contains hard-coded English strings instead of using `useTranslations` hook. The translation files (en.json, lv.json) only have 9 of 27 FAQ entries.

**Fix Required:**
1. Add all 27 FAQ entries to `frontend/src/messages/en.json`
2. Add Latvian translations to `frontend/src/messages/lv.json`
3. Refactor FAQ component to use `useTranslations` hook

**Related Files:**
- `frontend/src/app/[locale]/faq/page.tsx`
- `frontend/src/messages/en.json`
- `frontend/src/messages/lv.json`

---

## Recently Fixed

### BUG-002: Middleware Blocking Static Assets
**Status:** CLOSED
**Severity:** High
**Reported:** 2026-02-03
**Fixed:** 2026-02-03
**Component:** Frontend / Middleware

**Description:**
Next.js middleware was intercepting requests to /fonts/ and /bg_images/ directories, causing 404 errors for static assets.

**Root Cause:**
Middleware matcher pattern was too broad and didn't exclude static asset paths.

**Fix:**
Updated `frontend/middleware.ts` matcher config to exclude `/fonts/:path*` and `/bg_images/:path*` patterns.

**Commit:** (pending)

---

### BUG-003: Root Path Missing Layout
**Status:** CLOSED
**Severity:** High
**Reported:** 2026-02-03
**Fixed:** 2026-02-03
**Component:** Frontend / Routing

**Description:**
Visiting `/` caused errors due to missing root layout and page components.

**Root Cause:**
App router required root-level `layout.tsx` and `page.tsx` alongside the locale-based routing.

**Fix:**
Created `frontend/src/app/layout.tsx` and `frontend/src/app/page.tsx` with redirect to default locale.

**Commit:** (pending)

---

## Bug Template

```markdown
### BUG-XXX: [Short Description]
**Status:** OPEN
**Severity:** Low | Medium | High | Critical
**Reported:** YYYY-MM-DD
**Component:** [Area of codebase]

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

**Related Files:**
- [file paths]
```

---

## Statistics

| Month | Opened | Closed | Net |
|-------|--------|--------|-----|
| Feb 2026 | 3 | 2 | +1 |
