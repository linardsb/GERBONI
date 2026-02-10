# Testing Strategy

This document outlines the comprehensive testing strategy for the GERBONI e-commerce platform. Testing is enforced at multiple levels with coverage thresholds.

## Quick Start (Makefile)

Run from the project root:

| Command | What it does |
|---|---|
| `make test` | Run **all** backend + frontend tests |
| `make test-backend` | Backend only (pytest, 503 tests) |
| `make test-frontend` | Frontend only (vitest, 406 tests) |
| `make test-file FILE=backend/tests/test_auth.py` | Single backend test file |
| `make test-file FILE=frontend/src/__tests__/components/button.test.tsx` | Single frontend test file |
| `make test-lint` | Frontend ESLint check |
| `make test-e2e` | Playwright E2E tests |

## Testing Pyramid

```
        /\
       /E2E\         6 Playwright specs (cross-browser)
      /------\
     / Unit  \       18 Vitest specs (components, pages, utilities)
    /----------\
   /   API     \     26 pytest modules (endpoints, services, admin)
  /--------------\
```

## Test Suites Overview

| Suite | Framework | Files | Tests | Coverage Threshold | Runtime |
|-------|-----------|-------|-------|-------------------|---------|
| Backend API | pytest | 26 modules | 503 tests | ≥60% | ~105s |
| Frontend Unit | Vitest | 18 files | 406 tests | ≥80% | ~5s |
| Frontend E2E | Playwright | 6 specs | ~40 scenarios | N/A | ~2m |

## Backend Testing (pytest)

### Test Structure

```
backend/tests/
├── conftest.py                # Fixtures: db_session, client, auth_client, admin_client
├── test_2fa.py                # Two-factor authentication (TOTP)
├── test_addresses.py          # User address management
├── test_admin_dashboard.py    # Admin dashboard stats
├── test_admin_export.py       # Admin CSV exports (orders, products, users)
├── test_admin_orders.py       # Admin order management, status transitions
├── test_admin_products.py     # Admin product/variant management
├── test_admin_users.py        # Admin user roles, activate/deactivate
├── test_agent.py              # AI agent tools, WebSocket
├── test_auth.py               # Registration, login, guest sessions
├── test_cache.py              # Redis caching layer
├── test_campaigns.py          # Newsletter campaigns (admin CRUD, send, state rules)
├── test_cart.py               # Cart CRUD, item management
├── test_discounts.py          # Discount codes and coupons
├── test_email.py              # Email service (Resend)
├── test_error_tracking.py     # Error tracking API (admin-only)
├── test_newsletter.py         # Newsletter subscriptions
├── test_order_state_machine.py # Order state transitions (valid + invalid)
├── test_orders.py             # Order creation, listing
├── test_password_reset.py     # Forgot/reset/change password
├── test_payments.py           # Stripe checkout, webhooks
├── test_products.py           # Product catalog, variants, filtering
├── test_profile.py            # Customer profile (get/update/validation)
├── test_recommendations.py    # Product recommendations
├── test_reviews.py            # Product reviews, helpfulness
├── test_websocket_agent.py    # WebSocket chat integration (30 tests)
└── test_wishlist.py           # Wishlist CRUD, auth enforcement, move-to-cart (29 tests)
```

### Running Backend Tests

```bash
cd backend

# Full suite with coverage
pytest --cov=app --cov-report=term-missing -v

# Single module
pytest tests/test_auth.py -v

# Single test function
pytest tests/test_auth.py::test_register_user -v

# Pattern matching
pytest -k "test_login" -v

# Stop on first failure
pytest -x

# Parallel execution (requires pytest-xdist)
pytest -n auto
```

### Coverage Requirements

- **Minimum**: 60% overall coverage (enforced in CI)
- **Target**: 80% for business logic (services, models)
- **Exclusions**: Config files, migrations, `__init__.py`

### Test Fixtures

**Database**:
```python
@pytest.fixture
async def db_session():
    """In-memory SQLite database for isolated tests."""
    # Uses StaticPool to prevent "database is locked" errors
```

**HTTP Client**:
```python
@pytest.fixture
def client(db_session):
    """HTTPX AsyncClient for API testing."""
```

**Authenticated Client**:
```python
@pytest.fixture
def auth_client(client, db_session):
    """Client with JWT token for authenticated endpoints."""
```

**Mocked External Services**:
```python
@pytest.fixture
def mock_stripe_service():
    """Mock Stripe API calls (no real charges)."""

@pytest.fixture
def mock_anthropic_agent():
    """Mock Claude AI agent (no real API calls)."""
```

## Frontend Unit Testing (Vitest)

### Test Structure

```
frontend/src/__tests__/
├── components/
│   ├── badge.test.tsx              # Badge component variants
│   ├── button.test.tsx             # Button component variants
│   ├── card.test.tsx               # Card component
│   ├── grid.test.tsx               # Grid layout component
│   ├── input.test.tsx              # Input component
│   ├── product-card.test.tsx       # Product display + locale
│   ├── row.test.tsx                # Row layout component
│   ├── stack.test.tsx              # Stack layout component
│   └── text.test.tsx               # Text component variants
├── lib/
│   ├── api.test.ts                 # API client
│   ├── store.test.ts               # Zustand stores
│   └── websocket.test.ts           # WebSocket manager
├── pages/
│   ├── faq-page.test.tsx           # FAQ i18n (BUG-001)
│   └── root-page.test.tsx          # Root redirect (BUG-003)
├── themes/
│   ├── theme-provider.test.tsx     # Theme provider + switching
│   └── theme-utils.test.ts         # Theme utility functions
├── utils/
│   └── design-validation.test.ts   # Design system token validation
└── middleware.test.ts              # Next.js middleware (BUG-002)
```

### Running Frontend Unit Tests

```bash
cd frontend

# Watch mode (runs affected tests on file change)
npm run test

# Single run with coverage
npm run test:coverage

# Run specific file
npm run test -- chat-widget.test.tsx

# Update snapshots
npm run test -- -u
```

### Coverage Requirements

- **Minimum**: 80% branches, functions, lines, statements (enforced in CI)
- **Target**: 90% for critical paths (checkout, payments, auth)
- **Exclusions**: `*.config.ts`, `layout.tsx`, `middleware.ts`

### Test Utilities

**Rendering with i18n**:
```typescript
import { render } from '@/test-utils';

// Automatically wraps with NextIntlClientProvider
render(<MyComponent />);
```

**API Mocking**:
```typescript
import { server, rest } from '@/mocks/server';

// Mock specific endpoint
server.use(
  rest.get('/api/products', (req, res, ctx) => {
    return res(ctx.json({ products: [] }));
  })
);
```

**Store Testing**:
```typescript
import { useAuthStore } from '@/lib/store';

// Reset store before each test
beforeEach(() => {
  useAuthStore.getState().reset();
});
```

## Frontend E2E Testing (Playwright)

### Test Structure

```
frontend/e2e/
├── home.spec.ts                # Homepage, navigation
├── auth.spec.ts                # Login, register, logout
├── products.spec.ts            # Product browsing, filtering
├── navigation.spec.ts          # Locale switching, routing (BUG-003)
├── chat.spec.ts                # AI chat widget (NEW)
└── checkout-flow.spec.ts       # Full purchase flow (NEW)
```

### Running E2E Tests

```bash
cd frontend

# All browsers
npm run e2e

# Chromium only (fastest)
npm run e2e:chromium

# With browser UI
npm run e2e:headed

# Step-through debugger
npm run e2e:debug

# Update snapshots
npm run e2e -- --update-snapshots
```

### Browser Coverage

Tests run on 5 browser configurations:
1. **Chromium** (Desktop)
2. **Firefox** (Desktop)
3. **WebKit** (Desktop, Safari-like)
4. **Mobile Chrome** (Pixel 5)
5. **Mobile Safari** (iPhone 12)

### Test Patterns

**Page Navigation**:
```typescript
test('user can browse products', async ({ page }) => {
  await page.goto('/en/products');
  await expect(page).toHaveURL('/en/products');
  await expect(page.locator('h1')).toHaveText('Products');
});
```

**Form Submission**:
```typescript
test('user can register', async ({ page }) => {
  await page.goto('/en/register');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/en');
});
```

**Locale Switching**:
```typescript
test('user can switch locale', async ({ page }) => {
  await page.goto('/en');
  await page.click('[data-testid="locale-switcher"]');
  await page.click('text=Latviešu');
  await expect(page).toHaveURL('/lv');
});
```

## CI Pipeline (GitHub Actions)

### Workflow Overview

`.github/workflows/ci.yml` runs 5 parallel jobs:

```yaml
jobs:
  backend-tests:       # pytest with PostgreSQL
  frontend-tests:      # Vitest + ESLint
  frontend-build:      # Production build check
  e2e-tests:          # Playwright (depends on above 3)
  security-scan:       # Bandit, safety, npm audit (non-blocking)
```

### Job Details

**1. backend-tests**
- Starts PostgreSQL 16 service container
- Installs Python 3.12 + dependencies
- Runs `pytest --cov=app --cov-report=xml`
- Uploads coverage to Codecov (non-blocking)
- **Fails if**: Coverage < 60% or any test fails

**2. frontend-tests**
- Installs Node.js 22 + dependencies
- Runs `npm run lint` (ESLint)
- Runs `npm run test:coverage` (Vitest)
- **Fails if**: Coverage < 80% (branches, functions, lines, statements)

**3. frontend-build**
- Installs Node.js 22 + dependencies
- Runs `npm run build` (Next.js production build)
- **Fails if**: Build errors or warnings

**4. e2e-tests** (depends on jobs 1-3)
- Starts backend + frontend services
- Installs Playwright browsers
- Runs `npm run e2e:chromium` (Chromium only in CI)
- Uploads video/screenshot artifacts on failure
- **Fails if**: Any scenario fails

**5. security-scan** (non-blocking)
- Runs Bandit (Python security linter)
- Runs `safety check` (Python dependency vulnerabilities)
- Runs `npm audit` (Node.js dependency vulnerabilities)
- **Never fails CI** (continue-on-error: true)

### Coverage Enforcement

Coverage thresholds are enforced in:
1. **Vitest** (`frontend/vitest.config.ts`):
   ```typescript
   coverage: {
     branches: 80,
     functions: 80,
     lines: 80,
     statements: 80,
   }
   ```

2. **pytest** (CI script):
   ```yaml
   pytest --cov=app --cov-fail-under=60
   ```

## Manual Testing Checklist

Before deploying to production:

### Authentication
- [ ] Register new user
- [ ] Login with email/password
- [ ] Guest checkout flow
- [ ] Convert guest to user
- [ ] Logout and re-login

### Products
- [ ] Browse product catalog
- [ ] Filter by city
- [ ] View product details
- [ ] View all color/size variants

### Cart
- [ ] Add item to cart
- [ ] Update quantity
- [ ] Remove item
- [ ] Cart persists on refresh

### Checkout
- [ ] Complete guest checkout (Stripe test mode)
- [ ] Complete user checkout
- [ ] Receive order confirmation email
- [ ] View order in "My Orders"

### AI Agent
- [ ] Open chat widget
- [ ] Ask about order status
- [ ] Search for products
- [ ] Request refund
- [ ] Check response accuracy

### Localization
- [ ] Switch from /en to /lv
- [ ] Verify all text translates
- [ ] Check FAQ page in both locales (BUG-001)
- [ ] Verify fonts load (BUG-002)

## Test Stripe Accounts

**Test Mode Keys**:
```
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

**Test Cards**:
- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

**Webhook Testing**:
```bash
stripe listen --forward-to localhost:8000/api/payments/webhooks/stripe
```

## Regression Tests

Each bug fix MUST have a regression test. See [Regression Tests Index](./regression-tests.md) for full mapping.

## Related Documentation

- [Bug Fixes Index](../bug-fixes/README.md)
- [Regression Tests Index](./regression-tests.md)
- [Developer Runbooks](../runbooks/README.md)
