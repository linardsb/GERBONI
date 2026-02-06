# BUG-001: FAQ Page Not Translated

**Status**: Fixed
**Severity**: Medium
**Date Discovered**: 2026-02-06
**Date Fixed**: 2026-02-06
**GitHub Issue**: N/A
**Fragile Area**: i18n Translations

## Summary

The FAQ page (`/[locale]/faq`) was displaying only English content regardless of the selected locale. When users switched to Latvian (`/lv/faq`), all FAQ questions and answers remained in English instead of translating to Latvian.

## Root Cause

The FAQ page component (`frontend/src/app/[locale]/faq/page.tsx`) was using hard-coded English strings instead of the internationalization (i18n) system. The component did not import or use the `useTranslations` hook from `next-intl`.

```tsx
// BEFORE (buggy code)
export default function FaqPage() {
  return (
    <div>
      <h1>Frequently Asked Questions</h1>
      <p>How do I track my order?</p>
      {/* ... hard-coded English strings ... */}
    </div>
  );
}
```

The GERBONI project uses `next-intl` for all user-facing text, with translation files at:
- `frontend/messages/en.json` (English)
- `frontend/messages/lv.json` (Latvian)

## Symptoms

- Users selecting `/lv/faq` saw English content
- No runtime errors (silent UI bug)
- All other pages correctly translated
- Affected all 26 FAQ entries

## Fix Applied

### 1. Refactored Component to Use i18n

Updated `frontend/src/app/[locale]/faq/page.tsx`:

```tsx
// AFTER (fixed code)
import { useTranslations } from 'next-intl';

export default function FaqPage() {
  const t = useTranslations('faq');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('questions.tracking.question')}</p>
      <p>{t('questions.tracking.answer')}</p>
      {/* ... using t() for all strings ... */}
    </div>
  );
}
```

### 2. Added Translation Keys

Added all 26 FAQ entries to **both** translation files:

**`frontend/messages/en.json`**:
```json
{
  "faq": {
    "title": "Frequently Asked Questions",
    "questions": {
      "tracking": {
        "question": "How do I track my order?",
        "answer": "After your order ships, you'll receive a tracking number via email..."
      }
      // ... 25 more entries
    }
  }
}
```

**`frontend/messages/lv.json`**:
```json
{
  "faq": {
    "title": "Bieži Uzdotie Jautājumi",
    "questions": {
      "tracking": {
        "question": "Kā es varu izsekot savu pasūtījumu?",
        "answer": "Pēc tam, kad jūsu pasūtījums tiks nosūtīts..."
      }
      // ... 25 more entries
    }
  }
}
```

### 3. Files Changed

- `frontend/src/app/[locale]/faq/page.tsx` (refactored to use i18n)
- `frontend/messages/en.json` (added faq section)
- `frontend/messages/lv.json` (added faq section with Latvian translations)

## Regression Test

**Test File**: `frontend/src/__tests__/pages/faq-page.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import FaqPage from '@/app/[locale]/faq/page';

describe('FAQ Page i18n', () => {
  it('renders FAQ in English', () => {
    const messages = { faq: { title: 'Frequently Asked Questions' } };
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <FaqPage />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
  });

  it('renders FAQ in Latvian', () => {
    const messages = { faq: { title: 'Bieži Uzdotie Jautājumi' } };
    render(
      <NextIntlClientProvider locale="lv" messages={messages}>
        <FaqPage />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Bieži Uzdotie Jautājumi')).toBeInTheDocument();
  });
});
```

This test would **fail** on the buggy code (hard-coded strings) and **pass** on the fixed code (using i18n).

## Prevention

### Guidelines to Prevent Similar Bugs

1. **NEVER hard-code user-facing strings** in any React component
2. **ALWAYS use `useTranslations()` hook** for all text content
3. **Add translations to BOTH `en.json` AND `lv.json`** simultaneously
4. **Use ESLint rule** to catch hard-coded strings (TODO: add custom rule)
5. **Test both locales** manually before marking feature complete

### Code Review Checklist

When reviewing new pages or components:

- [ ] Does component import `useTranslations`?
- [ ] Are all user-facing strings using `t()` function?
- [ ] Do both `en.json` and `lv.json` have the same keys?
- [ ] Can you switch locales and see translated content?

### Related Runbooks

See [Adding New Pages Runbook](../runbooks/adding-new-pages.md) for step-by-step process.

## Related Issues

This bug revealed a **Fragile Area**: i18n Translations.

From `CLAUDE.md`:
> **5. i18n Translations** — New UI text MUST go in both `en.json` AND `lv.json`. Hard-coded strings cause locale-dependent rendering bugs (see BUG-001). All 18 routes are locale-prefixed.

## Lessons Learned

1. Silent UI bugs (no runtime errors) can slip through without visual testing of all locales
2. Need automated checks for missing translation keys
3. Consider adding `typescript-eslint` rule to ban hard-coded strings in JSX
4. E2E tests should verify locale switching on every page
