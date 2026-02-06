# Regression Tests Index

This document maps each bug fix to its corresponding regression test. Every bug MUST have a test that would fail on the buggy code and pass on the fixed code.

## What is a Regression Test?

A regression test ensures that a bug, once fixed, never happens again. It should:
1. **Reproduce the bug** if run against the buggy code
2. **Pass** when run against the fixed code
3. **Be automated** (part of CI pipeline)
4. **Cover the root cause**, not just symptoms

## Bug to Test Mapping

| Bug ID | Bug Description | Test File | Test Type | CI Job |
|--------|----------------|-----------|-----------|--------|
| [BUG-001](../bug-fixes/BUG-001-faq-i18n.md) | FAQ page not translated | `frontend/src/__tests__/pages/faq-page.test.tsx` | Unit | frontend-tests |
| [BUG-002](../bug-fixes/BUG-002-middleware-assets.md) | Middleware blocking static assets | `frontend/src/__tests__/middleware.test.ts` | Unit | frontend-tests |
| [BUG-003](../bug-fixes/BUG-003-root-path-layout.md) | Root path missing layout | `frontend/src/__tests__/pages/root-page.test.tsx` + `frontend/e2e/navigation.spec.ts` | Unit + E2E | frontend-tests + e2e-tests |
| [BUG-004](../bug-fixes/BUG-004-admin-order-service.md) | Admin orders API wrong service methods | `backend/tests/test_admin_orders.py` | Integration | backend-tests |

## Detailed Test Coverage

### BUG-001: FAQ Page Not Translated

**Test File**: `frontend/src/__tests__/pages/faq-page.test.tsx`

**What It Tests**:
- FAQ page renders in English when locale is `en`
- FAQ page renders in Latvian when locale is `lv`
- All 26 FAQ entries use translation keys (no hard-coded strings)

**How It Catches the Bug**:
```typescript
// This would FAIL on buggy code (hard-coded "Frequently Asked Questions")
it('renders FAQ in Latvian', () => {
  const messages = { faq: { title: 'Bieži Uzdotie Jautājumi' } };
  render(
    <NextIntlClientProvider locale="lv" messages={messages}>
      <FaqPage />
    </NextIntlClientProvider>
  );
  // This assertion fails if title is hard-coded in English
  expect(screen.getByText('Bieži Uzdotie Jautājumi')).toBeInTheDocument();
});
```

**CI Coverage**: Runs in `frontend-tests` job (Vitest)

---

### BUG-002: Middleware Blocking Static Assets

**Test File**: `frontend/src/__tests__/middleware.test.ts`

**What It Tests**:
- Middleware does NOT intercept `/fonts/*` requests
- Middleware does NOT intercept `/bg_images/*` requests
- Middleware DOES intercept unlocalized paths (e.g., `/products`)

**How It Catches the Bug**:
```typescript
// This would FAIL on buggy matcher (middleware intercepts fonts)
it('should NOT redirect requests to /fonts/', async () => {
  const req = new NextRequest(new URL('http://localhost:3000/fonts/Forum-COPY.woff2'));
  const res = await middleware(req);

  // Buggy code would return redirect response (307)
  // Fixed code returns undefined (lets Next.js serve static file)
  expect(res).toBeUndefined();
});
```

**CI Coverage**: Runs in `frontend-tests` job (Vitest)

---

### BUG-003: Root Path Missing Layout

**Unit Test**: `frontend/src/__tests__/pages/root-page.test.tsx`

**What It Tests**:
- Root page component calls `redirect('/en')`
- Root layout exists and renders children

**How It Catches the Bug**:
```typescript
// This would FAIL without root page (module not found error)
it('should redirect to /en by default', () => {
  RootPage();
  expect(redirect).toHaveBeenCalledWith('/en');
});
```

**E2E Test**: `frontend/e2e/navigation.spec.ts`

**What It Tests**:
- Visiting `/` redirects to `/en`
- No Next.js error page shown

**How It Catches the Bug**:
```typescript
// This would FAIL without root layout (Next.js error page)
test('root path redirects to /en', async ({ page }) => {
  await page.goto('/');

  // Buggy code would show "Missing required layout" error
  // Fixed code redirects to /en
  await expect(page).toHaveURL('/en');
});
```

**CI Coverage**: Unit test runs in `frontend-tests`, E2E runs in `e2e-tests`

---

### BUG-004: Admin Orders API Wrong Service Methods

**Test File**: `backend/tests/test_admin_orders.py`

**What It Tests**:
- Admin can mark order as paid (correct method signature)
- Admin can mark order as processing (correct method signature)
- Admin can mark order as shipped (correct method signature)
- Admin can mark order as delivered (correct method signature)
- Admin can cancel order (correct method signature)
- Admin can refund order (correct method signature)
- Admin can list orders with filters (correct query logic)

**How It Catches the Bug**:
```python
# This would FAIL on buggy code (TypeError: unexpected keyword argument)
async def test_admin_mark_paid(client, db_session, admin_token):
    order = await create_test_order(db_session, status="pending")

    # Buggy code calls mark_paid(db, order, payment_id=...)
    # Correct code calls mark_paid(db, order_id, stripe_payment_id=...)
    response = await client.post(
        f"/api/admin/orders/{order.id}/mark-paid",
        json={"payment_intent_id": "pi_test123"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    # Buggy code raises TypeError (500 error)
    # Fixed code returns 200 with updated order
    assert response.status_code == 200
    assert response.json()["status"] == "paid"
```

**CI Coverage**: Runs in `backend-tests` job (pytest with PostgreSQL)

---

## Running Regression Tests

### All Regression Tests
```bash
# Backend
cd backend
pytest tests/test_admin_orders.py -v

# Frontend unit
cd frontend
npm run test -- faq-page.test.tsx middleware.test.ts root-page.test.tsx

# Frontend E2E
npm run e2e -- navigation.spec.ts
```

### Individual Bug Tests

**BUG-001**:
```bash
cd frontend
npm run test -- faq-page.test.tsx
```

**BUG-002**:
```bash
cd frontend
npm run test -- middleware.test.ts
```

**BUG-003**:
```bash
cd frontend
npm run test -- root-page.test.tsx
npm run e2e -- navigation.spec.ts
```

**BUG-004**:
```bash
cd backend
pytest tests/test_admin_orders.py -v
```

## Regression Test Quality Criteria

A good regression test:

1. **Fails on buggy code**: Must reproduce the bug
2. **Passes on fixed code**: Must validate the fix
3. **Tests root cause**: Not just symptoms
4. **Is deterministic**: No flaky failures
5. **Is fast**: Runs in < 5 seconds
6. **Is maintainable**: Clear assertion messages
7. **Is isolated**: Doesn't depend on other tests

## Bad vs Good Regression Tests

### Bad Example (BUG-001)
```typescript
// BAD: Only tests English, doesn't catch i18n bug
it('FAQ page renders', () => {
  render(<FaqPage />);
  expect(screen.getByText('FAQ')).toBeInTheDocument();
});
```

### Good Example (BUG-001)
```typescript
// GOOD: Tests both locales, catches hard-coded strings
it('renders FAQ in Latvian', () => {
  const messages = { faq: { title: 'Bieži Uzdotie Jautājumi' } };
  render(
    <NextIntlClientProvider locale="lv" messages={messages}>
      <FaqPage />
    </NextIntlClientProvider>
  );
  expect(screen.getByText('Bieži Uzdotie Jautājumi')).toBeInTheDocument();
});
```

## Adding New Regression Tests

When fixing a bug:

1. **Write test first** (TDD approach)
2. **Verify it fails** on buggy code
3. **Fix the bug**
4. **Verify test passes** on fixed code
5. **Add to this index** with clear mapping
6. **Update bug writeup** with test reference

## Test Maintenance

Regression tests should:
- **Never be deleted** (unless bug is intentionally reverted)
- **Be updated** if underlying code architecture changes
- **Be reviewed** during code review (verify they actually test the bug)
- **Be run locally** before pushing fixes

## Related Documentation

- [Bug Fixes Index](../bug-fixes/README.md)
- [Testing Strategy](./README.md)
- [CI Pipeline](.github/workflows/ci.yml)
