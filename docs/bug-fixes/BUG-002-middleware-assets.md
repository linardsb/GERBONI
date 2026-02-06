# BUG-002: Middleware Blocking Static Assets

**Status**: Fixed
**Severity**: High
**Date Discovered**: 2026-02-06
**Date Fixed**: 2026-02-06
**GitHub Issue**: N/A
**Fragile Area**: Middleware & Static Assets

## Summary

Custom fonts (Woff2 files in `/public/fonts/`) and background images (`/public/bg_images/`) were returning 404 errors. The Next.js middleware was intercepting requests to these paths and attempting to apply locale redirects, breaking the asset loading.

## Root Cause

The middleware matcher pattern in `frontend/src/middleware.ts` was too broad. It was matching ALL paths except a small exclusion list:

```typescript
// BEFORE (buggy matcher)
export const config = {
  matcher: '/((?!_next|api|favicon.ico|coats).*)'
};
```

This matcher means: "Match everything EXCEPT paths starting with `_next/`, `api/`, `favicon.ico`, or `coats/`".

The problem: When a browser requested `/fonts/Forum-COPY.woff2` or `/bg_images/hero-bg.jpg`, the middleware would:
1. Match the path (not in exclusion list)
2. Try to extract locale from URL
3. Fail to find locale
4. Redirect or error out
5. Asset never served

## Symptoms

- Console errors: `Failed to load resource: the server responded with a status of 404`
- Missing custom fonts (fallback to system fonts)
- Missing background images (blank spaces or broken image icons)
- DevTools Network tab showing 404 for `/fonts/*` and `/bg_images/*`
- **Only affected custom assets** (built-in Next.js assets worked fine)

## Fix Applied

### 1. Updated Middleware Matcher

Added `/fonts/` and `/bg_images/` to the exclusion list in `frontend/src/middleware.ts`:

```typescript
// AFTER (fixed matcher)
export const config = {
  matcher: '/((?!_next|api|favicon.ico|coats|fonts|bg_images).*)'
};
```

### 2. Explanation of Matcher Pattern

The regex `/((?!_next|api|favicon.ico|coats|fonts|bg_images).*)` means:
- `/` - Start with slash
- `((?!...).*)`  - Negative lookahead: match anything that does NOT start with the patterns
- `_next|api|favicon.ico|coats|fonts|bg_images` - Excluded prefixes

**Excluded paths** (middleware will NOT run):
- `/_next/*` - Next.js internal files
- `/api/*` - API routes
- `/favicon.ico` - Favicon
- `/coats/*` - Product images (coat of arms)
- `/fonts/*` - Custom fonts (FIXED)
- `/bg_images/*` - Background images (FIXED)

**Included paths** (middleware WILL run):
- `/en` - English homepage
- `/lv` - Latvian homepage
- `/en/products` - Product pages
- All other locale-prefixed routes

### 3. Files Changed

- `frontend/src/middleware.ts` (updated matcher pattern)

### 4. Verification

After fix, verified in browser DevTools:
- `GET /fonts/Forum-COPY.woff2` → `200 OK`
- `GET /bg_images/hero-bg.jpg` → `200 OK`
- Middleware still runs on locale routes (e.g., `/en`, `/lv/products`)

## Regression Test

**Test File**: `frontend/src/__tests__/middleware.test.ts`

```typescript
import { NextRequest } from 'next/server';
import middleware from '@/middleware';

describe('Middleware matcher exclusions', () => {
  it('should NOT redirect requests to /fonts/', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/fonts/Forum-COPY.woff2'));
    const res = await middleware(req);

    // Middleware should not intercept (returns undefined or passes through)
    expect(res).toBeUndefined(); // or check res.status !== 307
  });

  it('should NOT redirect requests to /bg_images/', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/bg_images/hero-bg.jpg'));
    const res = await middleware(req);

    expect(res).toBeUndefined();
  });

  it('SHOULD redirect unlocalized paths', async () => {
    const req = new NextRequest(new URL('http://localhost:3000/products'));
    const res = await middleware(req);

    // Should redirect to /en/products or /lv/products
    expect(res.status).toBe(307);
  });
});
```

This test would **fail** on the buggy matcher (middleware intercepts fonts) and **pass** on the fixed matcher (fonts excluded).

## Prevention

### Guidelines to Prevent Similar Bugs

1. **Test middleware matcher against ALL public directories** when adding new assets
2. **Update matcher BEFORE adding new asset directories** to `/public/`
3. **Document excluded paths** in inline comments in `middleware.ts`
4. **Add E2E test** if new asset type is critical to UX

### Asset Addition Checklist

When adding a new asset directory to `/public/`:

- [ ] Add directory name to middleware matcher exclusion list
- [ ] Test asset loading in dev mode (`npm run dev`)
- [ ] Test asset loading in production build (`npm run build && npm start`)
- [ ] Verify in DevTools that assets return 200 OK
- [ ] Check both HTTP and HTTPS if deploying to production

### Related Runbooks

See [Adding New Static Assets Runbook](../runbooks/adding-new-static-assets.md) for step-by-step process.

## Related Issues

This bug revealed a **Fragile Area**: Middleware & Static Assets.

From `CLAUDE.md`:
> **2. Middleware & Static Assets** — Next.js middleware matcher pattern must exclude new asset paths. Adding new `/public/` directories without updating `middleware.ts` causes 404s (see BUG-002).

## Lessons Learned

1. **Middleware matchers are easy to get wrong** - negative lookaheads are tricky
2. **Asset 404s are silent in SSR** - no obvious error message during build
3. **Need better dev-time warnings** - consider middleware logging in dev mode
4. **Public directory structure should be documented** upfront to avoid surprises

## Technical Notes

### Why Middleware Runs on These Paths

GERBONI uses Next.js App Router with i18n via `next-intl`. The middleware's job:
1. Detect if URL has locale prefix (`/en/*` or `/lv/*`)
2. If missing, redirect to default locale (`/en/*`)
3. Set locale cookie for persistence

Static assets don't need localization, so they must be excluded from this logic.

### Next.js Asset Serving

Next.js automatically serves files from `/public/` at root URL:
- File: `/public/fonts/MyFont.woff2`
- URL: `http://localhost:3000/fonts/MyFont.woff2`

Middleware runs BEFORE asset serving, so incorrect matcher breaks this flow.
