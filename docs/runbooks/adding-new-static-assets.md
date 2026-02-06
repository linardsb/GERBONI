# Runbook: Adding New Static Assets

**Purpose**: Add fonts, images, icons, or other static files without breaking middleware
**Risk Level**: Medium
**Related Bugs**: [BUG-002](../bug-fixes/BUG-002-middleware-assets.md) - Middleware blocking static assets

## Overview

Static assets in GERBONI are served from `/public/` and must be excluded from Next.js middleware that handles locale routing. Failing to exclude new asset directories causes 404 errors.

## Prerequisites

- Familiarity with Next.js App Router and public directory structure
- Access to `frontend/src/middleware.ts`
- Local dev environment running (`npm run dev`)

## Current Asset Structure

```
frontend/public/
├── coats/                # Product images (coat of arms)
├── fonts/                # Custom fonts (Woff2)
├── bg_images/            # Background images
├── favicon.ico           # Site favicon
└── (other assets)
```

## Step-by-Step Instructions

### 1. Add Asset Files to Public Directory

Place files in appropriate subdirectory:

```bash
# Example: Adding new icons
mkdir -p frontend/public/icons
cp ~/Downloads/icon-*.svg frontend/public/icons/

# Example: Adding new fonts
cp ~/Downloads/MyFont.woff2 frontend/public/fonts/
```

**File naming best practices**:
- Use lowercase with hyphens: `hero-bg.jpg`, `product-icon.svg`
- No spaces (breaks URLs)
- Use semantic names: `checkout-success-icon.svg` > `img-123.svg`

### 2. Test Asset Loading (Before Middleware Update)

Start dev server and test the asset URL:

```bash
cd frontend
npm run dev
```

Open browser console and try to load the asset:

```javascript
// In browser DevTools console
fetch('/icons/my-new-icon.svg')
  .then(r => console.log('Status:', r.status))
  .catch(e => console.error(e));
```

**Expected behavior at this point**:
- New asset returns **404** (middleware intercepts it)
- Existing excluded assets return **200** (middleware skips them)

### 3. Update Middleware Matcher Pattern

Edit `frontend/src/middleware.ts`:

```typescript
export const config = {
  // BEFORE: Excludes _next, api, favicon.ico, coats, fonts, bg_images
  matcher: '/((?!_next|api|favicon.ico|coats|fonts|bg_images).*)',

  // AFTER: Add your new directory to exclusion list
  matcher: '/((?!_next|api|favicon.ico|coats|fonts|bg_images|icons).*)',
  //                                                           ^^^^^^ New addition
};
```

**Pattern syntax**:
- `(?!...)` - Negative lookahead (exclude these patterns)
- `|` - OR operator (separate multiple exclusions)
- `.*` - Match any characters after the prefix

**Always add directory name without leading/trailing slashes**: `icons`, not `/icons/`

### 4. Verify Middleware Change

Restart dev server to pick up middleware changes:

```bash
# Ctrl+C to stop
npm run dev
```

Test the asset again in browser console:

```javascript
fetch('/icons/my-new-icon.svg')
  .then(r => console.log('Status:', r.status)) // Should be 200
  .catch(e => console.error(e));
```

**Expected behavior after fix**:
- New asset returns **200 OK**
- Existing assets still return **200**
- Locale routes still work (`/en`, `/lv`)

### 5. Test in Production Build

Always test in production mode (middleware behavior can differ):

```bash
cd frontend
npm run build
npm start
```

Visit asset URLs directly:
- `http://localhost:3000/icons/my-new-icon.svg` (should load)
- `http://localhost:3000/fonts/Forum-COPY.woff2` (should still load)

### 6. Add E2E Test (Optional but Recommended)

For critical assets (fonts, brand images), add an E2E test:

```typescript
// frontend/e2e/assets.spec.ts
import { test, expect } from '@playwright/test';

test('custom icons load successfully', async ({ page }) => {
  const response = await page.goto('/icons/my-new-icon.svg');
  expect(response?.status()).toBe(200);
});
```

Run the test:

```bash
npm run e2e:chromium -- assets.spec.ts
```

### 7. Use Asset in Code

**In React component**:
```tsx
import Image from 'next/image';

export function MyComponent() {
  return (
    <Image
      src="/icons/my-new-icon.svg"
      alt="Icon description"
      width={24}
      height={24}
    />
  );
}
```

**In CSS**:
```css
.my-class {
  background-image: url('/bg_images/hero-bg.jpg');
}
```

**In font face**:
```css
@font-face {
  font-family: 'MyFont';
  src: url('/fonts/MyFont.woff2') format('woff2');
}
```

## Verification Checklist

After completing all steps, verify:

- [ ] Asset files exist in `/public/subdirectory/`
- [ ] Middleware matcher excludes new subdirectory
- [ ] Dev server serves asset with 200 OK
- [ ] Production build serves asset with 200 OK
- [ ] Browser DevTools Network tab shows asset loading
- [ ] No console errors about 404s
- [ ] Locale routing still works (`/en`, `/lv`)
- [ ] E2E test passes (if added)

## Troubleshooting

### Issue: Asset still returns 404 after middleware update

**Cause**: Middleware caching or dev server not restarted

**Solution**:
1. Stop dev server (Ctrl+C)
2. Clear Next.js cache: `rm -rf frontend/.next`
3. Restart: `npm run dev`

### Issue: Asset works in dev but 404 in production

**Cause**: Production build didn't include asset

**Solution**:
1. Verify file exists in `frontend/public/`
2. Rebuild: `npm run build`
3. Check `frontend/.next/static/` for copied files
4. Ensure no `.gitignore` rules blocking the file

### Issue: Middleware is now too permissive

**Cause**: Typo in matcher pattern (e.g., extra `.*` or wrong syntax)

**Solution**:
1. Test matcher with regex tool: https://regex101.com/
2. Use this reference pattern: `/((?!_next|api|favicon.ico|coats|fonts|bg_images|icons).*)`
3. Add inline comment documenting excluded paths

### Issue: Asset works but locale routing broken

**Cause**: Matcher is now excluding locale paths

**Solution**:
1. Verify matcher doesn't exclude `en` or `lv`
2. Correct pattern: `(?!_next|api|...)` (only excludes those specific prefixes)
3. Test locale routes: `/en`, `/lv`, `/en/products`

## Common Mistakes

1. **Forgetting to restart dev server** - Middleware changes require restart
2. **Adding trailing slash** - Use `icons`, not `icons/`
3. **Not testing production build** - Middleware can behave differently
4. **Excluding too much** - Don't add `(?!.*)` (excludes everything!)

## Related Documentation

- [BUG-002 Writeup](../bug-fixes/BUG-002-middleware-assets.md) - Original bug details
- [Middleware Test](../../frontend/src/__tests__/middleware.test.ts) - Regression test
- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Known Fragile Areas](../../CLAUDE.md#known-fragile-areas) - Middleware section

## Prevention Tips

1. **Update matcher BEFORE adding assets** (avoid 404s during dev)
2. **Document asset directories** in middleware comments
3. **Test both dev and production** before committing
4. **Add E2E test** for critical assets (fonts, logos)
5. **Review middleware changes carefully** in PRs
