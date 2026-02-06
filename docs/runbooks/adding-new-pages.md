# Runbook: Adding New Pages

**Purpose**: Add new pages to GERBONI with proper i18n and routing
**Risk Level**: Medium
**Related Bugs**: [BUG-001](../bug-fixes/BUG-001-faq-i18n.md) (i18n), [BUG-003](../bug-fixes/BUG-003-root-path-layout.md) (routing)

## Overview

GERBONI uses Next.js App Router with locale-based routing (`/en/*`, `/lv/*`). All pages must use the i18n system and be placed in the correct directory structure. Hard-coded strings or missing layouts cause bugs.

## Prerequisites

- Familiarity with Next.js App Router and file-based routing
- Understanding of `next-intl` for internationalization
- Local dev environment running (`npm run dev`)

## Locale Routing Architecture

```
frontend/src/app/
├── layout.tsx           # Root layout (minimal, redirects / to /en)
├── page.tsx             # Root page (redirects to /en)
└── [locale]/            # Locale-prefixed routes
    ├── layout.tsx       # Locale layout (providers, i18n, navigation)
    ├── page.tsx         # Homepage (/en or /lv)
    ├── products/
    │   └── page.tsx     # /en/products or /lv/products
    ├── faq/
    │   └── page.tsx     # /en/faq or /lv/faq
    └── [your-page]/
        └── page.tsx     # /en/[your-page] or /lv/[your-page]
```

## Step-by-Step Instructions

### 1. Create Page Component

Create file at `frontend/src/app/[locale]/[your-page]/page.tsx`:

```tsx
import { useTranslations } from 'next-intl';

export default function YourPage() {
  const t = useTranslations('yourPage'); // Namespace for this page

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="mt-4">{t('description')}</p>

      {/* NEVER hard-code strings like this: */}
      {/* <p>This is hard-coded text</p>  ❌ WRONG */}

      {/* ALWAYS use translation keys: */}
      <p>{t('content')}</p> {/* ✅ CORRECT */}
    </div>
  );
}
```

### 2. Add Translation Keys to BOTH Locales

**English** (`frontend/messages/en.json`):

```json
{
  "yourPage": {
    "title": "Your Page Title",
    "description": "A description of your page",
    "content": "Main content goes here"
  }
}
```

**Latvian** (`frontend/messages/lv.json`):

```json
{
  "yourPage": {
    "title": "Jūsu Lapas Nosaukums",
    "description": "Apraksts jūsu lapai",
    "content": "Galvenais saturs šeit"
  }
}
```

**CRITICAL**: Both files must have identical keys. Only values differ.

### 3. Verify Translation Keys Match

Run this check to ensure parity:

```bash
cd frontend

# Extract keys from both files
jq -r 'keys' messages/en.json > /tmp/en-keys.txt
jq -r 'keys' messages/lv.json > /tmp/lv-keys.txt

# Compare
diff /tmp/en-keys.txt /tmp/lv-keys.txt

# Should output nothing (files identical)
```

### 4. Add Navigation Link (Optional)

If page should appear in navigation, edit `frontend/src/components/navigation.tsx`:

```tsx
import { useTranslations } from 'next-intl';

export function Navigation() {
  const t = useTranslations('navigation');

  return (
    <nav>
      {/* Existing links */}
      <Link href="/products">{t('products')}</Link>
      <Link href="/faq">{t('faq')}</Link>

      {/* New link */}
      <Link href="/your-page">{t('yourPage')}</Link>
    </nav>
  );
}
```

Add to translation files:

```json
// en.json
{
  "navigation": {
    "yourPage": "Your Page"
  }
}

// lv.json
{
  "navigation": {
    "yourPage": "Jūsu Lapa"
  }
}
```

### 5. Test Both Locales Manually

Start dev server and test both locale versions:

```bash
npm run dev
```

**Test English**:
1. Visit `http://localhost:3000/en/your-page`
2. Verify all text is in English
3. Check browser console for missing translation warnings

**Test Latvian**:
1. Visit `http://localhost:3000/lv/your-page`
2. Verify all text is in Latvian
3. Switch locale via locale switcher (if implemented)

### 6. Add Metadata (SEO)

Add metadata for proper SEO:

```tsx
import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';

export async function generateMetadata(): Promise<Metadata> {
  const t = useTranslations('yourPage');

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function YourPage() {
  // ... component code
}
```

### 7. Write Unit Test

Create `frontend/src/__tests__/pages/your-page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import YourPage from '@/app/[locale]/your-page/page';

describe('Your Page', () => {
  it('renders in English', () => {
    const messages = {
      yourPage: {
        title: 'Your Page Title',
        description: 'A description of your page',
      }
    };

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <YourPage />
      </NextIntlClientProvider>
    );

    expect(screen.getByText('Your Page Title')).toBeInTheDocument();
    expect(screen.getByText('A description of your page')).toBeInTheDocument();
  });

  it('renders in Latvian', () => {
    const messages = {
      yourPage: {
        title: 'Jūsu Lapas Nosaukums',
        description: 'Apraksts jūsu lapai',
      }
    };

    render(
      <NextIntlClientProvider locale="lv" messages={messages}>
        <YourPage />
      </NextIntlClientProvider>
    );

    expect(screen.getByText('Jūsu Lapas Nosaukums')).toBeInTheDocument();
    expect(screen.getByText('Apraksts jūsu lapai')).toBeInTheDocument();
  });
});
```

Run test:

```bash
npm run test -- your-page.test.tsx
```

### 8. Add E2E Test (Optional)

Create `frontend/e2e/your-page.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Your Page', () => {
  test('renders in English', async ({ page }) => {
    await page.goto('/en/your-page');
    await expect(page.locator('h1')).toHaveText('Your Page Title');
  });

  test('renders in Latvian', async ({ page }) => {
    await page.goto('/lv/your-page');
    await expect(page.locator('h1')).toHaveText('Jūsu Lapas Nosaukums');
  });

  test('locale switcher changes language', async ({ page }) => {
    await page.goto('/en/your-page');
    await page.click('[data-testid="locale-switcher"]');
    await page.click('text=Latviešu');
    await expect(page).toHaveURL('/lv/your-page');
    await expect(page.locator('h1')).toHaveText('Jūsu Lapas Nosaukums');
  });
});
```

Run test:

```bash
npm run e2e:chromium -- your-page.spec.ts
```

### 9. Verify Root Path Still Works

After adding any new page, always verify the root path:

```bash
curl -I http://localhost:3000/

# Should return:
# HTTP/1.1 307 Temporary Redirect
# Location: /en
```

If root path returns 404, see [BUG-003 Writeup](../bug-fixes/BUG-003-root-path-layout.md).

## Verification Checklist

After completing all steps, verify:

- [ ] Page file created at `app/[locale]/[your-page]/page.tsx`
- [ ] Component uses `useTranslations('yourPage')` hook
- [ ] No hard-coded strings in JSX
- [ ] Translation keys added to **both** `en.json` and `lv.json`
- [ ] Keys match between locales (same structure)
- [ ] Page loads at `/en/your-page` (English)
- [ ] Page loads at `/lv/your-page` (Latvian)
- [ ] No console warnings about missing translations
- [ ] Unit test passes for both locales
- [ ] E2E test passes (if added)
- [ ] Locale switcher changes page language
- [ ] Root path (`/`) still redirects to `/en`

## Troubleshooting

### Issue: Page shows English in `/lv/` route

**Cause**: Missing translation keys in `lv.json`

**Solution**:
1. Check browser console for warning: `Translation key 'yourPage.title' not found`
2. Add missing key to `lv.json` with Latvian translation
3. Reload page

### Issue: "Translation key not found" warning

**Cause**: Typo in translation key or missing key in JSON

**Solution**:
1. Check exact key used in component: `t('yourPage.title')`
2. Verify key exists in both `en.json` and `lv.json`
3. Check for typos (case-sensitive!)

### Issue: Page returns 404

**Cause**: File not in correct directory or dev server needs restart

**Solution**:
1. Verify file is at `app/[locale]/[your-page]/page.tsx`
2. Restart dev server: `npm run dev`
3. Clear Next.js cache: `rm -rf .next && npm run dev`

### Issue: Root path (`/`) returns 404 after adding page

**Cause**: Next.js routing issue or missing root layout

**Solution**:
1. Verify `app/layout.tsx` exists (root layout)
2. Verify `app/page.tsx` exists (redirects to `/en`)
3. See [BUG-003 Writeup](../bug-fixes/BUG-003-root-path-layout.md) for full fix

### Issue: Hard-coded strings slip through review

**Cause**: No automated check for hard-coded strings

**Solution**:
1. Add ESLint rule to ban hard-coded strings in JSX (TODO)
2. Add to PR checklist: "All strings use `t()` function"
3. Review with both locales open in browser

## Common Mistakes

1. **Forgetting to add keys to `lv.json`** - Only adding to `en.json`
2. **Hard-coding strings** - Using `<p>Hello</p>` instead of `<p>{t('hello')}</p>`
3. **Wrong namespace** - Using `useTranslations('wrongName')` when keys are under `yourPage`
4. **Not testing both locales** - Only testing `/en/` route
5. **Skipping unit tests** - No regression test for i18n

## Best Practices

1. **Use semantic namespaces**: `useTranslations('yourPage')`, not `useTranslations('page1')`
2. **Group related keys**: `yourPage.form.submit`, `yourPage.form.cancel`
3. **Keep translations short**: Break long text into multiple keys
4. **Use placeholders for dynamic content**: `t('welcome', { name: user.name })`
5. **Test locale switching**: Don't just test direct URLs, test switcher too

## Related Documentation

- [BUG-001 Writeup](../bug-fixes/BUG-001-faq-i18n.md) - i18n bug details
- [BUG-003 Writeup](../bug-fixes/BUG-003-root-path-layout.md) - Routing bug details
- [next-intl Docs](https://next-intl-docs.vercel.app/)
- [Next.js App Router](https://nextjs.org/docs/app)
