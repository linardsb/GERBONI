# CLAUDE.md

GERBONI is a full-stack e-commerce platform selling t-shirts featuring Latvian city coats of arms, with an AI-powered customer support agent.

## 1. Core Principles

- **Services are HTTP-agnostic**: Never raise `HTTPException` in services. Raise domain exceptions, translate at the route boundary via `domain_to_http(e)`.
- **Services flush, API commits**: Services call `await db.flush()`. Route handlers call `await db.commit()` after success. See `docs/runbooks/flush-commit-pattern.md`.
- **Dual auth on every endpoint**: Endpoints touching user data must support JWT (`Authorization: Bearer`) AND guest sessions (`X-Guest-Session`). Use `require_auth()` or `get_auth()` from `deps.py`.
- **i18n parity**: New UI text goes in both `frontend/src/messages/en.json` AND `lv.json`. Use `useTranslations()` hooks, never inline ternaries.
- **Design system tokens**: No inline styles, no arbitrary Tailwind values (`gap-[24px]`), no hardcoded colors. Use semantic tokens (`gap-section`, `bg-primary`, `text-foreground`).
- **Type everything**: Full type hints on all Python functions. TypeScript strict mode on frontend. Use `Decimal` for money, never `float`.
- **Test before done**: Write regression tests for bug fixes. Backend >=60% coverage, frontend >=80%.

## 2. Tech Stack

### Backend
| Component | Version | Purpose |
|-----------|---------|---------|
| Python | 3.11+ | Runtime |
| FastAPI | >=0.115.0 | Web framework |
| SQLAlchemy | 2.0 (async) | ORM with `AsyncSession` |
| PostgreSQL | 16 | Production database |
| Pydantic | v2 | Validation & schemas |
| Pydantic AI | 0.0.53 | AI agent (`result_type`, not `output_type`) |
| Stripe | >=11.0.0 | Payments (checkout sessions, webhooks) |
| slowapi | Latest | Rate limiting |
| pytest + pytest-asyncio | Latest | Testing (in-memory SQLite) |
| Resend | Latest | Transactional email |
| Redis | Optional | Caching (graceful degradation) |

### Frontend
| Component | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16 | React framework (App Router) |
| React | 19 | UI library |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Styling (OKLCH color tokens) |
| Zustand | 5.0.11 | State management (with persist) |
| next-intl | Latest | i18n (en + lv locales) |
| Radix UI | Latest | Accessible primitives |
| CVA | Latest | Component variant management |
| Vitest | Latest | Unit testing (80% threshold) |
| Playwright | 1.58.1 | E2E testing |
| Tabler Icons | Latest | Icon library |

## 3. Architecture

### Backend (Three-Layer)
```
backend/app/
├── api/               # Thin route handlers — parse, delegate, respond
│   ├── deps.py        # Auth dependencies: require_auth(), get_auth() → AuthResult
│   ├── admin/         # Admin-only endpoints (products, orders, users, campaigns)
│   └── *.py           # Resource routes (products, cart, orders, auth, payments)
├── services/          # Business logic — HTTP-agnostic, domain exceptions
│   └── *.py           # Static methods, first param db: AsyncSession, uses flush()
├── models/            # SQLAlchemy ORM — Mapped[] columns, relationships
├── schemas/           # Pydantic v2 — request/response validation
├── middleware/         # Security headers, rate limiting, request ID, timing
├── agent/             # Pydantic AI support agent with 5 tools
└── utils/             # Error tracking, response helpers
```

### Frontend (Atomic Design + App Router)
```
frontend/src/
├── app/
│   ├── [locale]/      # 18 locale-prefixed routes (en + lv)
│   │   ├── layout.tsx # Locale layout with Organization JSON-LD
│   │   ├── page.tsx   # Homepage
│   │   └── */         # Products, cart, checkout, orders, admin, auth pages
│   ├── globals.css    # Design tokens (500+ lines: OKLCH colors, spacing, animations)
│   └── layout.tsx     # Root layout with fonts
├── components/
│   ├── elements/      # Atoms: Button, Text, Input, Stack, Row, Grid, Card
│   ├── components/    # Molecules: chat-widget, size-selector, color-selector
│   ├── compositions/  # Organisms: product-card, cart-summary, checkout-form
│   └── layouts/       # Page layouts: header, footer, container
├── lib/
│   ├── api.ts         # Typed API client (850+ lines, 100+ types, dual-auth)
│   ├── store.ts       # Zustand stores (auth, cart, chat, wishlist, recently-viewed)
│   ├── websocket.ts   # Singleton ChatWebSocket with auto-reconnect
│   ├── design-tokens.ts # TS constants mirroring CSS tokens
│   └── utils.ts       # cn() class merger
├── messages/          # en.json + lv.json (13+ namespaces)
└── i18n/              # next-intl routing config
```

### Key Architectural Patterns

**Auth Flow**: `require_auth()` returns `AuthResult` with `.user_id`, `.guest_email`, `.session_id`. Used in cart, orders, wishlist, payments. `get_auth()` is permissive (allows anonymous).

**Order State Machine**: `pending → paid → processing → shipped → delivered` with `cancelled`/`refunded` branches. 14-day refund window from delivery date (`updated_at` proxies `delivered_at`).

**WebSocket Chat**: Auth message → `auth_success` → conversation. Invalid guest token returns `guest_error`/`INVALID_SESSION`. No fallback — client must retry.

## 4. Code Style

### Backend (Python)
```python
# snake_case for files, functions, variables
# PascalCase for classes and enums
# UPPER_SNAKE_CASE for constants

class OrderService:
    """Order business logic. HTTP-agnostic, raises domain exceptions."""

    VALID_TRANSITIONS = {
        OrderStatus.PENDING: {OrderStatus.PAID, OrderStatus.CANCELLED},
        # ...
    }

    @staticmethod
    async def get_order(
        db: AsyncSession,
        order_id: int,
        owner: OrderOwner | None = None,
    ) -> Order:
        """Fetch order with ownership verification.

        Args:
            db: Database session
            order_id: Order primary key
            owner: Optional owner filter for authorization

        Raises:
            EntityNotFoundError: Order not found or not owned by user
        """
        stmt = (
            select(Order)
            .options(selectinload(Order.items).selectinload(OrderItem.variant))
            .where(Order.id == order_id)
        )
        if owner and owner.user_id:
            stmt = stmt.where(Order.user_id == owner.user_id)

        result = await db.execute(stmt)
        order = result.scalar_one_or_none()
        if not order:
            raise EntityNotFoundError(f"Order {order_id} not found")
        return order
```

**Conventions**: Static methods on service classes. First param `db: AsyncSession`. Dataclasses for value objects (`OrderOwner`, `ShippingInfo`). `Decimal` for money. `| None` union syntax (not `Optional`). Eagerly load relationships via `selectinload()`.

### Frontend (TypeScript/React)
```tsx
// PascalCase for components and files
// camelCase for hooks (useAuthStore), functions, variables
// UPPER_SNAKE_CASE for constants (API_URL, MAX_RECENTLY_VIEWED)

import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva("base-classes", {
  variants: {
    variant: { default: "bg-primary", outline: "border" },
    size: { sm: "h-8", md: "h-9", lg: "h-10" },
  },
  defaultVariants: { variant: "default", size: "md" },
})

function Button({
  className, variant, size, ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
```

**Conventions**: Every component has `data-slot="name"`. All `className` merged via `cn()`. CVA for variants. Radix UI for accessible primitives. `useTranslations("namespace")` for all user-facing text.

### Schema Naming
| Pattern | Example |
|---------|---------|
| Create request | `OrderCreate`, `ShippingInfo` |
| Read response | `OrderRead`, `ProductListRead` |
| DB enum | `OrderStatus(str, Enum)` with lowercase values |
| Column suffix | `_id` for FKs, `_at` for timestamps, `_lv` for Latvian |
| Route format | `/api/resource/{id}` (REST) |

## 5. Logging

```python
import logging
logger = logging.getLogger(__name__)

# Standard usage — context auto-injected via contextvars middleware
logger.info("Order created", extra={"order_id": order.id, "user_id": user.id})
logger.warning("Stock low", extra={"variant_id": v.id, "stock": v.stock})
logger.error("Payment failed", extra={"order_id": order.id}, exc_info=True)
```

- **Development**: Human-readable format with request context (`StandardFormatter`)
- **Production**: Structured JSON for log aggregation (`JSONFormatter`)
- **Request context**: Automatically injected via `contextvars` (request_id, path, method, client_ip)
- **Noise reduction**: `uvicorn.access` and `sqlalchemy.engine` set to WARNING

Frontend logging uses `console.error` with `[API]` prefix in the API client for failed requests.

## 6. Testing

### Backend (pytest)
```bash
cd backend
pytest --cov=app --cov-report=term-missing -v    # Full suite (~498 tests)
pytest tests/test_orders.py -v                    # Single module
pytest -k "test_cancel_shipped" -v                # Single test
```

**Infrastructure**: In-memory SQLite with `StaticPool`. Fixtures in `conftest.py`: `db_session`, `client`, `auth_client`, `admin_client`. Rate limiting disabled via `limiter.enabled = False`.

**Critical**: `conftest.py` MUST `import app.models` before `Base.metadata.create_all` — without it, metadata is empty and no tables are created.

```python
# Test pattern — class-based groups, async, fixture injection
class TestOrderService:
    @pytest.mark.asyncio
    async def test_cancel_shipped_order_fails(self, client, auth_headers, shipped_order):
        """Cannot cancel already shipped order."""
        response = await client.delete(f"/api/orders/{shipped_order.id}", headers=auth_headers)
        assert response.status_code == 400

    @pytest.mark.parametrize("current,target,expected", [
        (OrderStatus.PENDING, OrderStatus.PAID, True),
        (OrderStatus.CANCELLED, OrderStatus.PAID, False),
    ])
    def test_state_transitions(self, current, target, expected):
        assert OrderService.can_transition(current, target) is expected
```

### Frontend Unit (Vitest)
```bash
cd frontend
npm run test              # Watch mode
npm run test:coverage     # 80% threshold enforcement
```

```tsx
// Pattern: describe/it, @testing-library/react, MSW for API mocking
describe("Button", () => {
  it("renders with data-slot attribute", () => {
    render(<Button>Click</Button>)
    expect(screen.getByRole("button")).toHaveAttribute("data-slot", "button")
  })
})
```

### Frontend E2E (Playwright)
```bash
cd frontend
npm run e2e:chromium      # Fast single-browser
npm run e2e:headed        # Visual debugging
```

6 spec files covering auth, home, products, navigation, chat, checkout-flow.

## 7. API Contracts

### Backend → Frontend Type Mapping
```python
# Backend schema (Pydantic)          # Frontend type (TypeScript)
class OrderRead(BaseModel):           # interface Order {
    id: int                           #   id: number
    status: str                       #   status: string
    total: Decimal                    #   total: number
    items: list[OrderItemRead]        #   items: OrderItem[]
    created_at: datetime              #   created_at: string
                                      # }
    class Config:
        from_attributes = True
```

### Error Contract
```python
# Backend: domain exceptions → HTTP via domain_to_http()
except DomainException as e:
    raise domain_to_http(e)  # EntityNotFoundError→404, InsufficientStockError→409
```

```typescript
// Frontend: ApiError class with status, message, requestId
try {
  await createOrder(data)
} catch (e) {
  if (e instanceof ApiError && e.status === 409) {
    toast.error("Item out of stock")
  }
}
```

### Auth Header Contract
| Auth Type | Header | Backend Dependency |
|-----------|--------|--------------------|
| JWT user | `Authorization: Bearer <token>` | `require_auth()` → `AuthResult` |
| Guest | `X-Guest-Session: <token>` | `require_auth()` → `AuthResult` |
| Anonymous | (none) | `get_auth()` → `AuthResult` with None fields |

## 8. Common Patterns

### Backend: Service + Route Pattern
```python
# Service (HTTP-agnostic, raises domain exceptions)
class CartService:
    @staticmethod
    async def add_item(db: AsyncSession, owner: CartOwner, variant_id: int, qty: int) -> CartItem:
        variant = await db.get(TShirtVariant, variant_id)
        if not variant or variant.stock < qty:
            raise InsufficientStockError("Not enough stock")
        item = CartItem(user_id=owner.user_id, session_id=owner.session_id,
                        variant_id=variant_id, quantity=qty)
        db.add(item)
        await db.flush()
        return item

# Route (thin: parse → delegate → respond)
@router.post("", response_model=CartRead)
async def add_to_cart(
    data: CartItemCreate,
    auth: AuthResult = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    try:
        item = await CartService.add_item(db, CartOwner(auth.user_id, auth.session_id),
                                           data.variant_id, data.quantity)
        await db.commit()
        return await CartService.get_cart(db, CartOwner(auth.user_id, auth.session_id))
    except DomainException as e:
        raise domain_to_http(e)
```

### Frontend: Zustand Store + API Fetch Pattern
```tsx
"use client"
import { useEffect, useState } from "react"
import { useAuthStore } from "@/lib/store"
import { getOrders, type Order } from "@/lib/api"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

export function OrderList() {
  const t = useTranslations("order")
  const { token, guestSession } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    getOrders(token, guestSession?.session_token)
      .then(setOrders)
      .catch(() => toast.error(t("loadError")))
  }, [token, guestSession])

  return (
    <Stack gap="group" data-slot="order-list">
      {orders.map(order => (
        <Card key={order.id}>
          <Text variant="heading-sm">{t("orderNumber", { id: order.id })}</Text>
          <Text variant="muted">{order.status}</Text>
        </Card>
      ))}
    </Stack>
  )
}
```

## 9. Development Commands

### Docker (Recommended)
```bash
docker compose up -d                           # Start all services
docker compose --profile seed up seed          # Seed database with 360 SKUs
docker compose down                            # Stop services
docker compose logs -f backend                 # Follow backend logs
docker compose --profile loadtest up locust    # Load testing
```

### Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload                  # Dev server on :8000
python -m app.seed                             # Seed locally
pytest --cov=app --cov-report=term-missing -v  # Tests with coverage
pytest -k "test_name" -v                       # Single test
```

### Frontend
```bash
cd frontend
npm run dev                                    # Dev server on :3000
npm run build                                  # Production build
npm run lint                                   # ESLint
npm run test:coverage                          # Unit tests (80% threshold)
npm run e2e:chromium                           # E2E tests
```

### Production
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
./scripts/backup-db.sh                         # Database backup (pg_dump)
./scripts/restore-db.sh backup.dump            # Database restore
```

**API docs**: http://localhost:8000/docs | **Backend env**: `backend/.env` | **Frontend env**: `frontend/.env.local`

## 10. AI Coding Assistant Instructions

1. **Read skill files first**: Before any backend change, read `.claude/skills/gerboni-backend/SKILL.md`. Before any frontend change, read `.claude/skills/gerboni-frontend-design/SKILL.md`. No exceptions.
2. **Dual auth everywhere**: Every endpoint touching user data must use `require_auth()` or `get_auth()` from `deps.py`. Never use raw `get_current_user` with `User | None` — that's a security bug (BUG-008).
3. **Services flush, routes commit**: Never call `db.commit()` inside a service. Never skip `db.commit()` in a route after a mutating service call.
4. **i18n both files**: Any new user-facing string goes in both `en.json` and `lv.json`. Use `useTranslations("namespace")`, never hardcode text.
5. **Design tokens only**: No `style={{}}`, no `gap-[24px]`, no `#ffffff`. Use `gap-section`, `bg-primary`, `text-foreground`. Every component needs `data-slot`.
6. **Test after every fix**: Write a regression test that fails on the bug and passes on the fix. Run the full backend suite (`pytest`) and frontend suite (`npm run test:coverage`) before declaring done.
7. **Check conftest.py carefully**: If adding a new model, ensure `backend/app/models/__init__.py` exports it. The `import app.models` in conftest.py must capture all models or tests break silently.
8. **Pydantic AI is unstable**: Uses `result_type` (not `output_type`), `agent._function_tools` (not `_function_toolset`). Pin versions. Wrap internal API access in helper functions.
9. **Domain exceptions, not HTTP**: Services raise `EntityNotFoundError`, `InsufficientStockError`, etc. Route handlers catch `DomainException` and call `domain_to_http(e)`.
10. **Run `/bug-fix-retrospective` after fixes**: Captures root cause, creates GitHub Issue, suggests prevention. Update "Known Fragile Areas" below if a new pattern emerges.

---

## Known Fragile Areas

Areas that have broken before. Pay extra attention when modifying:

1. **Dual Auth System** — Use `require_auth()` (strict) or `get_auth()` (permissive) from `deps.py`. Missing guest session handling causes silent auth failures.
2. **Middleware & Static Assets** — Next.js middleware matcher must exclude `/public/` subdirectories. Audit test in `middleware.test.ts` verifies coverage.
3. **Order State Machine** — Strict transitions with `cancelled`/`refunded` branches. Refund tool enforces 14-day window from delivery.
4. **AI Agent WebSocket** — Auth flow: `auth` → `auth_success` → `message`. Invalid guest token returns `guest_error`/`INVALID_SESSION`.
5. **i18n Translations** — Both `en.json` and `lv.json` must be updated together. Hard-coded strings cause locale-dependent bugs.
6. **Test Infrastructure** — `conftest.py` must `import app.models` before `create_all`. Pydantic AI pre-1.0 API is unstable.

## Key File Locations

| Purpose | Path |
|---------|------|
| Backend skill | `.claude/skills/gerboni-backend/SKILL.md` |
| Frontend skill | `.claude/skills/gerboni-frontend-design/SKILL.md` |
| Backend architecture guide | `reference/backend_architecture_guide.md` |
| Frontend architecture guide | `reference/frontend_architecture_guide.md` |
| Frontend layout guide | `reference/frontend_layout_guide.md` |
| AI agent + tools | `backend/app/agent/support_agent.py` |
| Shared auth deps | `backend/app/api/deps.py` |
| Domain exceptions | `backend/app/exceptions.py` |
| Frontend API client | `frontend/src/lib/api.ts` |
| Zustand stores | `frontend/src/lib/store.ts` |
| Design tokens (CSS) | `frontend/src/app/globals.css` |
| Design tokens (TS) | `frontend/src/lib/design-tokens.ts` |
| Theming & layout docs | `docs/theming.md` |
| Task tracking | `tasks/CLAUDE.md`, `tasks/todo.md`, `tasks/bugs.md` |
