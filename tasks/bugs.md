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

**Description:**
FAQ page displays only English content regardless of selected locale. The 27 FAQ questions are hard-coded in the component instead of using the translation system.

**Root Cause:**
`frontend/src/app/[locale]/faq/page.tsx` originally contained hard-coded English strings.

**Fix:**
- Component refactored to use `useTranslations("faq")` hook
- All 26 FAQ entries added to `frontend/src/messages/en.json`
- Complete Latvian translations added to `frontend/src/messages/lv.json`
- FAQ organized into 6 categories: Orders & Shipping (5), Returns & Refunds (5), Products & Sizing (5), Payment & Security (4), Account & Support (4), Bulk & Custom (3)

**Related Files:**
- `frontend/src/app/[locale]/faq/page.tsx`
- `frontend/src/messages/en.json`
- `frontend/src/messages/lv.json`

---

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

**Commit:** 2d1a283

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

**Commit:** bc02768

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
| Feb 2026 | 3 | 3 | 0 |
