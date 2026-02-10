# Bug Fixes Index

This directory contains detailed writeups of all bugs discovered and fixed in the GERBONI project. Each bug has a unique ID and a dedicated markdown file documenting the issue, root cause, fix, and prevention strategies.

## Active Bug Reports

| Bug ID | Title | Severity | Status | Fixed Date | Regression Test |
|--------|-------|----------|--------|------------|-----------------|
| [BUG-001](./BUG-001-faq-i18n.md) | FAQ page not translated | Medium | Fixed | 2026-02-06 | `frontend/src/__tests__/pages/faq-page.test.tsx` |
| [BUG-002](./BUG-002-middleware-assets.md) | Middleware blocking static assets | High | Fixed | 2026-02-06 | `frontend/src/__tests__/middleware.test.ts` |
| [BUG-003](./BUG-003-root-path-layout.md) | Root path missing layout | High | Fixed | 2026-02-06 | `frontend/src/__tests__/pages/root-page.test.tsx` |
| [BUG-004](./BUG-004-admin-order-service.md) | Admin orders API calling wrong service methods | Critical | Fixed | 2026-02-06 | `backend/tests/test_admin_orders.py` |
| [BUG-009](./BUG-009-debug-print-token-leak.md) | Debug print leaking password reset tokens | High | Fixed | 2026-02-08 | Code review |
| [BUG-010](./BUG-010-silent-exception-swallowing.md) | Silent exception swallowing in error handlers | Medium | Fixed | 2026-02-08 | Code review |
| [BUG-011](./BUG-011-hardcoded-i18n-default.md) | Hardcoded English default in ProductGrid | Low | Fixed | 2026-02-08 | Code review |
| [BUG-014](./BUG-014-admin-low-stock-route-shadowed.md) | Admin low-stock route shadowed by `/{product_id}` | Medium | Fixed | 2026-02-10 | `backend/tests/test_admin_products.py` → `TestLowStock` |

## Bug Categories

### i18n Issues
- **BUG-001**: FAQ page had hard-coded English strings instead of using translation hooks
- **BUG-011**: Hardcoded English default in ProductGrid `emptyMessage` prop

### Infrastructure Issues
- **BUG-002**: Next.js middleware matcher was intercepting static asset paths
- **BUG-003**: Root route missing required layout components
- **BUG-010**: Three bare `except Exception: pass` blocks hiding infrastructure failures

### API Issues
- **BUG-004**: Admin API calling OrderService with incorrect method signatures
- **BUG-014**: Admin `/low-stock` route shadowed by `/{product_id}` parameter route ordering

### Security Issues
- **BUG-009**: Debug `print()` leaking password reset tokens to stdout

## How to Use This Directory

1. **When fixing a bug**: Create a new `BUG-XXX-short-name.md` file using the template below
2. **Write regression test**: Ensure the test would fail on the buggy code and pass on the fix
3. **Update this README**: Add the bug to the table above
4. **Run `/bug-fix-retrospective`**: Captures learnings and creates GitHub Issue
5. **Update CLAUDE.md**: If a new fragile area is discovered, document it

## Bug Report Template

```markdown
# BUG-XXX: Short Title

**Status**: Fixed | Open | Won't Fix
**Severity**: Critical | High | Medium | Low
**Date Discovered**: YYYY-MM-DD
**Date Fixed**: YYYY-MM-DD
**Fixed By**: @username
**GitHub Issue**: #XXX (if exists)

## Summary
Brief description of the bug and its user-facing impact.

## Root Cause
Technical explanation of what went wrong.

## Symptoms
- How the bug manifested
- Error messages or incorrect behavior
- Affected users/features

## Fix Applied
Detailed explanation of the solution:
- Files changed
- Logic changes
- Configuration updates

## Regression Test
Reference to the test file and specific test cases that prevent recurrence.

## Prevention
Guidelines to prevent similar bugs in the future.

## Related Issues
Links to related bugs or fragile areas.
```

## Statistics

- **Total Bugs Fixed**: 8
- **Critical**: 1
- **High**: 3
- **Medium**: 2
- **Low**: 1

## Related Documentation

- [Testing Strategy](../testing/README.md)
- [Regression Tests Index](../testing/regression-tests.md)
- [Developer Runbooks](../runbooks/README.md)
- [Known Fragile Areas](../../CLAUDE.md#known-fragile-areas)
