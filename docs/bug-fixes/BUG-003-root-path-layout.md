# BUG-003: Root Path Missing Layout

**Status**: Fixed
**Severity**: High
**Date Discovered**: 2026-02-06
**Date Fixed**: 2026-02-06
**GitHub Issue**: N/A
**Fragile Area**: Next.js App Router + i18n

## Summary

Accessing the root path `/` caused a Next.js error: "Missing required layout component". The app expected a layout file at `frontend/src/app/layout.tsx`, but only had layouts inside the `[locale]/` directory.

## Root Cause

The GERBONI project uses Next.js App Router with locale-based routing:
```
frontend/src/app/
├── [locale]/
│   ├── layout.tsx       ← Locale-specific layout (has providers, i18n)
│   ├── page.tsx         ← Homepage at /en or /lv
│   ├── products/
│   └── ...
└── (missing root layout and page)
```

Next.js requires **at minimum**:
1. Root `layout.tsx` at `app/layout.tsx` (mandatory for App Router)
2. Root `page.tsx` at `app/page.tsx` (if you want `/` to work)

Without these, visiting `/` caused:
```
Error: Missing required layout or page component
```

### Why This Happened

The project was built assuming **all traffic goes through locale routes** (`/en/*`, `/lv/*`). The middleware was supposed to redirect `/` → `/en`, but Next.js checks for layout files **before** middleware runs.

## Symptoms

- Visiting `http://localhost:3000/` caused Next.js error page
- Error message: "Missing required layout component"
- Dev server logs: `Error: ENOENT: no such file or directory, open '.../app/layout.tsx'`
- **Locale routes worked fine** (`/en`, `/lv`, `/en/products`, etc.)

## Fix Applied

### 1. Created Root Layout

Created `frontend/src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GERBONI - Latvian City T-Shirts',
  description: 'Premium t-shirts featuring Latvian city coats of arms',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

**Key points**:
- Minimal layout (no providers, no i18n)
- Only renders `<html>` and `<body>` wrappers
- All app logic lives in `[locale]/layout.tsx`

### 2. Created Root Page with Redirect

Created `frontend/src/app/page.tsx`:

```tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to default locale
  redirect('/en');
}
```

This ensures:
- Visiting `/` immediately redirects to `/en`
- No blank page or error shown to user
- Middleware has time to run on subsequent requests

### 3. Files Changed

- `frontend/src/app/layout.tsx` (created)
- `frontend/src/app/page.tsx` (created)

### 4. How It Works Now

**Request flow**:
1. User visits `/`
2. Next.js loads root layout (`app/layout.tsx`)
3. Root page (`app/page.tsx`) executes `redirect('/en')`
4. Browser redirects to `/en`
5. Middleware runs, loads locale layout (`app/[locale]/layout.tsx`)
6. Homepage renders with i18n, providers, etc.

## Regression Test

**Test File**: `frontend/src/__tests__/pages/root-page.test.tsx`

```tsx
import { redirect } from 'next/navigation';
import RootPage from '@/app/page';

// Mock Next.js redirect
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('Root Page', () => {
  it('should redirect to /en by default', () => {
    RootPage();
    expect(redirect).toHaveBeenCalledWith('/en');
  });
});
```

**E2E Test**: `frontend/e2e/navigation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('root path redirects to /en', async ({ page }) => {
  await page.goto('/');

  // Should redirect to /en
  await expect(page).toHaveURL('/en');
});
```

These tests would **fail** without root layout/page files and **pass** with them.

## Prevention

### Guidelines to Prevent Similar Bugs

1. **Always verify root route works** after locale changes
2. **Root layout is mandatory** in Next.js App Router (even if minimal)
3. **Test both `/` and `/en` in E2E suite**
4. **Document routing architecture** upfront for new devs

### Routing Architecture Checklist

When setting up locale-based routing:

- [ ] Create `app/layout.tsx` (minimal, no providers)
- [ ] Create `app/page.tsx` (redirect to default locale)
- [ ] Create `app/[locale]/layout.tsx` (full layout with providers)
- [ ] Create `app/[locale]/page.tsx` (actual homepage)
- [ ] Configure middleware to handle missing locales
- [ ] Test `/`, `/en`, `/lv` all work correctly

### Related Runbooks

See [Adding New Pages Runbook](../runbooks/adding-new-pages.md) for considerations when adding locale-based routes.

## Related Issues

This bug is related to **Middleware & Static Assets** fragile area, as both involve Next.js routing edge cases.

## Lessons Learned

1. **Next.js App Router has strict file requirements** - can't skip root layout
2. **Middleware runs AFTER layout resolution** - can't rely on middleware to fix missing files
3. **Locale-based routing needs careful planning** - document the file structure upfront
4. **E2E tests should cover entry points** - test `/`, `/en`, `/lv`, not just `/en/products`

## Technical Notes

### Next.js App Router File Hierarchy

```
app/
├── layout.tsx           ← REQUIRED: Root layout (wraps entire app)
├── page.tsx             ← Root page (optional, but needed for `/` route)
├── [locale]/
│   ├── layout.tsx       ← Locale layout (inherits from root layout)
│   ├── page.tsx         ← Locale homepage
│   └── products/
│       ├── layout.tsx   ← Products layout (inherits from locale layout)
│       └── page.tsx     ← Products page
```

Each `layout.tsx` **wraps** its children, creating a hierarchy:
```
RootLayout
└── LocaleLayout
    └── ProductsLayout
        └── ProductsPage
```

### Why Not Put Everything in Root Layout?

We keep root layout minimal because:
1. **i18n providers** need locale from URL params (only available in `[locale]/`)
2. **Zustand stores** need to be inside locale context
3. **Metadata** (title, description) needs to be localized
4. **Easier to reason about** - locale-specific logic in locale directory

### Alternative Approaches

Could have used:
1. **Pages Router** instead of App Router (different i18n setup)
2. **Subdomain-based locales** (`en.gerboni.com`, `lv.gerboni.com`)
3. **Cookie-based locale** (no URL prefix, just cookie)

We chose **URL prefix** (`/en/*`, `/lv/*`) for:
- SEO benefits (separate URLs per locale)
- Shareable links with embedded locale
- Clear user indication of current locale
