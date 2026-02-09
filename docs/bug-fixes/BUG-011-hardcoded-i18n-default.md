# BUG-011: Hardcoded English Default in ProductGrid Component

**Status**: Fixed
**Severity**: Low
**Date Discovered**: 2026-02-08
**Date Fixed**: 2026-02-08
**GitHub Issue**: https://github.com/linardsb/GERBONI/issues/6

## Summary
The `ProductGrid` component had a hardcoded English default value for the `emptyMessage` prop: `"No products available."`. When a caller forgot to pass a translated message, English text would appear regardless of the user's selected locale.

## Root Cause
Leftover from the pre-i18n migration. When the codebase was migrated from hardcoded strings to `useTranslations()`, this default parameter value in the component's destructured props was missed:
```tsx
// Before (buggy)
export function ProductGrid({ products, loading, emptyMessage = "No products available." }: ProductGridProps) {
```

## Symptoms
- If `ProductGrid` was used without passing `emptyMessage`, English text appeared in Latvian locale
- Only the products listing page used this component, and it already passed a translated string, so the bug was latent

## Fix Applied
Removed the default value, making `emptyMessage` an optional prop with no default:
```tsx
// After (fixed)
export function ProductGrid({ products, loading, emptyMessage }: ProductGridProps) {
```
Verified the sole caller (`frontend/src/app/[locale]/products/page.tsx:282`) already passes `t("noProductsAvailable")`.

**File changed:** `frontend/src/components/compositions/product-grid.tsx`

## Regression Test
N/A — existing i18n tests in `faq-page.test.tsx` cover the pattern of verifying translation key usage. The sole caller was verified to already pass a translated string.

## Prevention
- During i18n audits, search for English string defaults in component props: `grep -r '= "' src/components/`
- Component props that display user-visible text should never have English defaults
- The i18n migration checklist should include "check default prop values" alongside "check JSX text content"
- Known Fragile Area #5 (i18n Translations) already covers this pattern

## Related Issues
- [BUG-001](./BUG-001-faq-i18n.md) — FAQ page hard-coded English strings (same i18n fragile area)
