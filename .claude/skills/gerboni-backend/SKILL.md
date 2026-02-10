aude---
name: gerboni-backend
description: |
  FastAPI backend development for Gerboni e-commerce with SQLAlchemy, Pydantic, and PostgreSQL.
  Use when: (1) Creating/modifying API endpoints in backend/app/api/,
  (2) Adding database models or schemas, (3) Implementing service layer logic,
  (4) Writing tests for backend code, (5) Adding middleware or error handling,
  (6) Extending the AI support agent, (7) Working with Stripe payments.
  Enforces: Service layer pattern, domain exceptions, async SQLAlchemy,
  type hints, PEP 8, pytest testing, structured logging.
author: Claude Code
version: 2.0.0
date: 2026-02-10
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
---

# Gerboni Backend Development Skill

You are an expert Python programmer building a production-ready FastAPI e-commerce backend. Follow the architecture patterns, coding standards, and testing practices defined in this skill.

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [File Structure](#file-structure)
3. [Architecture Patterns](#architecture-patterns)
4. [Service Layer Pattern](#service-layer-pattern)
5. [Domain Exceptions](#domain-exceptions)
6. [API Endpoint Patterns](#api-endpoint-patterns)
7. [Database Patterns](#database-patterns)
8. [Pydantic Schemas](#pydantic-schemas)
9. [AI Agent Tools](#ai-agent-tools)
10. [Testing Patterns](#testing-patterns)
11. [Error Handling](#error-handling)
12. [Logging](#logging)
13. [Code Quality](#code-quality)

---

## Technology Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| Python | 3.11+ | Runtime |
| FastAPI | >=0.115.0 | Web framework |
| SQLAlchemy | 2.0 (async) | ORM |
| PostgreSQL | 16 | Database |
| Pydantic | v2 | Validation & schemas |
| pydantic-settings | Latest | Configuration |
| Pydantic AI | 0.0.53 | AI agent framework (uses `result_type`, not `output_type`) |
| Stripe | >=11.0.0 | Payments |
| python-jose | Latest | JWT tokens |
| passlib | Latest | Password hashing |
| slowapi | Latest | Rate limiting |
| uvicorn | Latest | ASGI server |
| pytest | Latest | Testing |
| pytest-asyncio | Latest | Async test support |

---

## File Structure

```
backend/app/
├── main.py                 # FastAPI app entry, middleware registration
├── config.py               # Settings via pydantic-settings
├── database.py             # Async SQLAlchemy engine & session
├── exceptions.py           # Domain exceptions (HTTP-agnostic)
├── logging_config.py       # Structured logging setup
├── seed.py                 # Database seeding script
│
├── api/                    # Route handlers (thin controllers)
│   ├── __init__.py         # Router aggregation
│   ├── deps.py             # Dependency injection (get_db, get_current_user)
│   ├── products.py         # Product catalog endpoints
│   ├── cart.py             # Cart CRUD endpoints
│   ├── orders.py           # Order management endpoints
│   ├── auth.py             # Authentication endpoints
│   ├── payments.py         # Stripe checkout & webhooks
│   └── agent.py            # WebSocket AI chat endpoint
│
├── models/                 # SQLAlchemy ORM models
│   ├── user.py             # User, GuestSession
│   ├── product.py          # TShirt, TShirtVariant
│   ├── order.py            # Order, OrderItem, OrderStatus
│   └── cart.py             # CartItem
│
├── schemas/                # Pydantic request/response models
│   ├── user.py             # UserCreate, UserRead, TokenResponse
│   ├── product.py          # ProductRead, VariantRead
│   ├── order.py            # OrderCreate, OrderRead
│   └── cart.py             # CartItemCreate, CartRead
│
├── services/               # Business logic (HTTP-agnostic)
│   ├── __init__.py         # Service exports
│   ├── auth_service.py     # JWT, password hashing, sessions
│   ├── cart_service.py     # Cart operations, stock validation
│   ├── order_service.py    # Order lifecycle, state machine
│   ├── product_service.py  # Product queries, search
│   └── stripe_service.py   # Stripe API integration
│
├── middleware/             # FastAPI middleware
│   ├── security_headers.py # Security headers (CSP, HSTS)
│   ├── request_size.py     # Request body size limits
│   ├── audit_log.py        # Audit logging
│   ├── rate_limit.py       # Rate limiting with slowapi
│   ├── request_id.py       # Request ID injection
│   ├── timing.py           # Request timing
│   └── websocket_security.py # WebSocket auth
│
├── agent/                  # AI support agent
│   └── support_agent.py    # Pydantic AI agent with tools
│
└── utils/                  # Shared utilities
    ├── errors.py           # Error response helpers
    └── error_tracker.py    # Error tracking/reporting
```

---

## Architecture Patterns

### Three-Layer Architecture

```
┌─────────────────────────────────────────┐
│  API Layer (backend/app/api/)           │
│  - HTTP request/response handling       │
│  - Authentication checks                │
│  - Input validation via Pydantic        │
│  - Exception translation to HTTP        │
├─────────────────────────────────────────┤
│  Service Layer (backend/app/services/)  │
│  - Business logic                       │
│  - Domain validation                    │
│  - State machine enforcement            │
│  - HTTP-agnostic (no HTTPException)     │
├─────────────────────────────────────────┤
│  Data Layer (backend/app/models/)       │
│  - SQLAlchemy ORM models                │
│  - Database relationships               │
│  - Column definitions                   │
└─────────────────────────────────────────┘
```

### Key Principles

1. **Services are HTTP-agnostic**: Never raise `HTTPException` in services
2. **Routes are thin**: Only request parsing, service calls, response formatting
3. **Transaction control**: Services use `flush()`, callers `commit()`
4. **Dependency injection**: Use FastAPI's `Depends()` for db sessions, auth

---

## Service Layer Pattern

### Service Class Template

Services use **static methods** with `db: AsyncSession` as first parameter:

```python
from dataclasses import dataclass
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models import Order, OrderItem, OrderStatus
from ..exceptions import EntityNotFoundError, InvalidStateTransitionError


@dataclass
class OrderOwner:
    """Identifies who owns an order."""
    user_id: int | None
    guest_email: str | None


@dataclass
class ShippingInfo:
    """Shipping address details."""
    name: str
    address: str
    city: str
    postal_code: str
    country: str = "Latvia"


class OrderService:
    """Order business logic. HTTP-agnostic, raises domain exceptions."""

    # State machine: valid transitions
    VALID_TRANSITIONS = {
        OrderStatus.PENDING: {OrderStatus.PAID, OrderStatus.CANCELLED},
        OrderStatus.PAID: {OrderStatus.PROCESSING, OrderStatus.REFUNDED, OrderStatus.CANCELLED},
        OrderStatus.PROCESSING: {OrderStatus.SHIPPED, OrderStatus.REFUNDED, OrderStatus.CANCELLED},
        OrderStatus.SHIPPED: {OrderStatus.DELIVERED, OrderStatus.REFUNDED},
        OrderStatus.DELIVERED: {OrderStatus.REFUNDED},
        OrderStatus.CANCELLED: set(),  # Terminal
        OrderStatus.REFUNDED: set(),   # Terminal
    }

    @staticmethod
    async def get_order(
        db: AsyncSession,
        order_id: int,
        owner: OrderOwner | None = None,
    ) -> Order:
        """
        Fetch order by ID with ownership verification.

        Args:
            db: Database session
            order_id: Order primary key
            owner: Optional owner filter for authorization

        Returns:
            Order with items eagerly loaded

        Raises:
            EntityNotFoundError: Order not found or not owned by user
        """
        stmt = (
            select(Order)
            .options(
                selectinload(Order.items)
                .selectinload(OrderItem.variant)
            )
            .where(Order.id == order_id)
        )

        if owner:
            if owner.user_id:
                stmt = stmt.where(Order.user_id == owner.user_id)
            elif owner.guest_email:
                stmt = stmt.where(Order.guest_email == owner.guest_email)

        result = await db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            raise EntityNotFoundError(f"Order {order_id} not found")

        return order

    @staticmethod
    def can_transition(current: OrderStatus, target: OrderStatus) -> bool:
        """Check if status transition is valid."""
        return target in OrderService.VALID_TRANSITIONS.get(current, set())

    @staticmethod
    async def transition_status(
        db: AsyncSession,
        order_id: int,
        target: OrderStatus,
        metadata: dict | None = None,
    ) -> Order:
        """
        Transition order to new status with validation.

        Raises:
            EntityNotFoundError: Order not found
            InvalidStateTransitionError: Invalid transition
        """
        order = await OrderService.get_order(db, order_id)
        current = OrderStatus(order.status)

        if not OrderService.can_transition(current, target):
            raise InvalidStateTransitionError(
                f"Cannot transition from {current.value} to {target.value}"
            )

        order.status = target.value
        if metadata:
            # Update relevant fields based on metadata
            if "tracking_number" in metadata:
                order.tracking_number = metadata["tracking_number"]
            if "payment_id" in metadata:
                order.stripe_payment_id = metadata["payment_id"]

        await db.flush()
        return order
```

### Service Method Conventions

| Convention | Example |
|------------|---------|
| First param is `db: AsyncSession` | `async def get_order(db, order_id)` |
| Use dataclasses for complex params | `owner: OrderOwner` |
| Return domain models, not dicts | `-> Order` |
| Raise domain exceptions | `raise EntityNotFoundError(...)` |
| Use `flush()` not `commit()` | Caller controls transaction |
| Eagerly load relationships | `selectinload(Order.items)` |

---

## Domain Exceptions

Define HTTP-agnostic exceptions in `backend/app/exceptions.py`:

```python
from fastapi import HTTPException, status


class DomainException(Exception):
    """Base for all business rule violations."""

    def __init__(self, message: str, code: str | None = None):
        self.message = message
        self.code = code
        super().__init__(message)


class EntityNotFoundError(DomainException):
    """Resource not found."""
    pass


class InsufficientStockError(DomainException):
    """Requested quantity exceeds available stock."""
    pass


class InvalidStateTransitionError(DomainException):
    """Order cannot transition to requested status."""
    pass


class EmptyCartError(DomainException):
    """Cannot checkout with empty cart."""
    pass


class AuthorizationError(DomainException):
    """User/guest identity required but not provided."""
    pass


def domain_to_http(exc: DomainException) -> HTTPException:
    """
    Translate domain exception to HTTP response.
    Use in route handlers: `raise domain_to_http(e)`
    """
    if isinstance(exc, EntityNotFoundError):
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=exc.message,
        )
    if isinstance(exc, AuthorizationError):
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=exc.message,
        )
    if isinstance(exc, InsufficientStockError):
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=exc.message,
        )
    # Default: 400 Bad Request
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=exc.message,
    )
```

---

## API Endpoint Patterns

### Auth Dependencies (CRITICAL)

**NEVER use raw `get_current_user` with `User | None`** — passing `owner=None` to services fetches ANY record (BUG-008 security vulnerability).

Always use `require_auth()` or `get_auth()` from `deps.py`:

```python
from .deps import require_auth, get_auth, AuthResult

# require_auth → strict: returns AuthResult or 401
# get_auth → permissive: returns AuthResult (allows anonymous, e.g. GET /cart returns empty)
# AuthResult has: .user_id, .guest_email, .session_id, .is_authenticated
```

### Route Handler Template

Routes should be thin — parse, delegate, respond:

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..schemas.resource import ResourceCreate, ResourceRead
from ..services.resource_service import ResourceService, ResourceOwner
from ..exceptions import DomainException, domain_to_http
from .deps import require_auth, get_auth, AuthResult

router = APIRouter()

@router.get("", response_model=list[ResourceRead])  # Public — permissive auth
async def list_resources(skip: int = 0, limit: int = 20, db: AsyncSession = Depends(get_db)):
    return await ResourceService.list_all(db, skip, limit)

@router.get("/{resource_id}", response_model=ResourceRead)
async def get_resource(
    resource_id: int,
    auth: AuthResult = Depends(require_auth),  # ← strict auth
    db: AsyncSession = Depends(get_db),
):
    owner = ResourceOwner(user_id=auth.user_id, guest_email=auth.guest_email)
    try:
        return await ResourceService.get(db, resource_id, owner)
    except DomainException as e:
        raise domain_to_http(e)

@router.post("", response_model=ResourceRead, status_code=201)
async def create_resource(
    data: ResourceCreate,
    auth: AuthResult = Depends(require_auth),  # ← strict auth
    db: AsyncSession = Depends(get_db),
):
    owner = ResourceOwner(user_id=auth.user_id, guest_email=auth.guest_email)
    try:
        resource = await ResourceService.create(db, owner, data.name, data.name_lv, data.price)
        await db.commit()  # ← route commits after service succeeds
        return resource
    except DomainException as e:
        raise domain_to_http(e)
```

Register: `api_router.include_router(resources_router, prefix="/resources", tags=["resources"])` in `api/__init__.py`

### Endpoint Conventions

| Convention | Example |
|------------|---------|
| Auth via `require_auth` or `get_auth` | `auth: AuthResult = Depends(require_auth)` |
| Build Owner from AuthResult | `ResourceOwner(user_id=auth.user_id, guest_email=auth.guest_email)` |
| Wrap service calls in try/except | `except DomainException as e: raise domain_to_http(e)` |
| Commit after successful mutations | `await db.commit()` |
| Use response_model | `response_model=ResourceRead` |

---

## Database Patterns

### SQLAlchemy Model Template

```python
from datetime import datetime
from enum import Enum
from decimal import Decimal

from sqlalchemy import ForeignKey, String, Numeric, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class OrderStatus(str, Enum):
    """Order lifecycle states."""
    PENDING = "pending"
    PAID = "paid"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class Order(Base):
    """Customer order with items and shipping."""

    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
    )
    guest_email: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(
        String(20),
        default=OrderStatus.PENDING.value,
        index=True,
    )
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    # Shipping info
    shipping_name: Mapped[str] = mapped_column(String(255))
    shipping_address: Mapped[str] = mapped_column(String(500))
    shipping_city: Mapped[str] = mapped_column(String(100))
    shipping_postal_code: Mapped[str] = mapped_column(String(20))
    shipping_country: Mapped[str] = mapped_column(String(100), default="Latvia")

    # Payment
    stripe_session_id: Mapped[str | None] = mapped_column(String(255))
    stripe_payment_id: Mapped[str | None] = mapped_column(String(255))

    # Tracking
    tracking_number: Mapped[str | None] = mapped_column(String(100))

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
    )
```

### Query Patterns

```python
# Eager loading relationships
stmt = (
    select(Order)
    .options(
        selectinload(Order.items).selectinload(OrderItem.variant)
    )
    .where(Order.id == order_id)
)

# Pagination
stmt = (
    select(Order)
    .where(Order.user_id == user_id)
    .order_by(Order.created_at.desc())
    .offset(skip)
    .limit(limit)
)

# Filtering with optional parameters
stmt = select(Product)
if category:
    stmt = stmt.where(Product.category == category)
if min_price:
    stmt = stmt.where(Product.price >= min_price)
if max_price:
    stmt = stmt.where(Product.price <= max_price)

# Full-text search (PostgreSQL)
from sqlalchemy import func

stmt = (
    select(Product)
    .where(
        func.to_tsvector('english', Product.name).match(search_query)
    )
)
```

---

## Pydantic Schemas

### Schema Template

```python
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict


class OrderItemRead(BaseModel):
    """Order item response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    variant_id: int
    quantity: int = Field(ge=1)
    price: Decimal = Field(decimal_places=2)


class ShippingCreate(BaseModel):
    """Shipping address input."""

    name: str = Field(min_length=1, max_length=255)
    address: str = Field(min_length=1, max_length=500)
    city: str = Field(min_length=1, max_length=100)
    postal_code: str = Field(min_length=1, max_length=20)
    country: str = Field(default="Latvia", max_length=100)


class OrderCreate(BaseModel):
    """Order creation request."""

    shipping: ShippingCreate
    guest_email: str | None = Field(default=None, max_length=255)


class OrderRead(BaseModel):
    """Order response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    guest_email: str | None
    status: str
    total: Decimal
    shipping_name: str
    shipping_address: str
    shipping_city: str
    shipping_postal_code: str
    shipping_country: str
    tracking_number: str | None
    items: list[OrderItemRead]
    created_at: datetime
    updated_at: datetime
```

### Schema Conventions

| Convention | Example |
|------------|---------|
| Use `ConfigDict(from_attributes=True)` | For ORM model conversion |
| Add Field constraints | `Field(min_length=1, max_length=255)` |
| Use `Decimal` for money | `price: Decimal` |
| Suffix with Create/Read/Update | `OrderCreate`, `OrderRead` |

---

## AI Agent Tools

### Pydantic AI Tool Template

```python
from dataclasses import dataclass
from pydantic_ai import Agent, RunContext

from ..services import ProductService, OrderService
from ..database import get_db_session


@dataclass
class AgentDependencies:
    """Dependencies injected into agent tools."""
    user_id: int | None
    guest_email: str | None
    db_session_factory: callable


# Create agent
support_agent = Agent(
    "anthropic:claude-sonnet-4-20250514",
    deps_type=AgentDependencies,
    system_prompt="""
    You are a helpful customer support agent for Gerboni, an e-commerce store
    selling t-shirts featuring Latvian city coats of arms.

    You can help customers with:
    - Finding products
    - Checking order status
    - Processing refund requests

    Always be friendly and helpful. If you can't help with something,
    explain why and suggest alternatives.
    """,
)


@support_agent.tool
async def search_products(
    ctx: RunContext[AgentDependencies],
    query: str,
    category: str | None = None,
    max_price: float | None = None,
) -> str:
    """
    Search for products based on keywords.

    Args:
        query: Search keywords (e.g., "Riga blue")
        category: Optional category filter
        max_price: Optional maximum price filter

    Returns:
        Formatted list of matching products
    """
    async with ctx.deps.db_session_factory() as db:
        products = await ProductService.search(
            db,
            query=query,
            category=category,
            max_price=max_price,
            limit=5,
        )

        if not products:
            return "No products found matching your search."

        lines = ["Found the following products:\n"]
        for p in products:
            lines.append(f"- {p.name} (€{p.price}) - {p.description[:50]}...")

        return "\n".join(lines)


@support_agent.tool
async def get_order_details(
    ctx: RunContext[AgentDependencies],
    order_id: int,
) -> str:
    """
    Get details about a specific order.

    Args:
        order_id: The order ID to look up

    Returns:
        Order details or error message
    """
    if not ctx.deps.user_id and not ctx.deps.guest_email:
        return "I need you to be logged in to look up order details."

    async with ctx.deps.db_session_factory() as db:
        try:
            order = await OrderService.get_order(
                db,
                order_id,
                OrderOwner(
                    user_id=ctx.deps.user_id,
                    guest_email=ctx.deps.guest_email,
                ),
            )

            return f"""
Order #{order.id}
Status: {order.status}
Total: €{order.total}
Items: {len(order.items)} item(s)
Shipping to: {order.shipping_city}, {order.shipping_country}
"""
        except EntityNotFoundError:
            return f"I couldn't find order #{order_id}. Please check the order number."


@support_agent.tool
async def request_refund(
    ctx: RunContext[AgentDependencies],
    order_id: int,
    reason: str,
) -> str:
    """
    Request a refund for an order.

    Args:
        order_id: The order ID to refund
        reason: Reason for the refund request

    Returns:
        Confirmation or error message
    """
    if not ctx.deps.user_id:
        return "I need you to be logged in to process refund requests."

    async with ctx.deps.db_session_factory() as db:
        try:
            await OrderService.process_refund(
                db,
                order_id,
                reason=reason,
                restore_stock=True,
            )
            await db.commit()

            return f"Refund request for order #{order_id} has been submitted. You'll receive confirmation within 3-5 business days."
        except InvalidStateTransitionError as e:
            return f"Unable to process refund: {e.message}"
        except EntityNotFoundError:
            return f"I couldn't find order #{order_id}."
```

### Tool Conventions

| Convention | Example |
|------------|---------|
| Use `RunContext[AgentDependencies]` | Access user context |
| Return formatted strings | Human-readable responses |
| Handle exceptions gracefully | Return error messages, don't raise |
| Limit results | `limit=5` for search results |
| Check authorization | Verify user_id before sensitive operations |

---

## Testing Patterns

### Test File Template

```python
import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

from sqlalchemy.ext.asyncio import AsyncSession

from app.services import OrderService, OrderOwner
from app.models import Order, OrderStatus
from app.exceptions import EntityNotFoundError, InvalidStateTransitionError


@pytest.fixture
def mock_db():
    """Create mock async database session."""
    return AsyncMock(spec=AsyncSession)


@pytest.fixture
def sample_order():
    """Create sample order for testing."""
    order = MagicMock(spec=Order)
    order.id = 1
    order.user_id = 42
    order.status = OrderStatus.PENDING.value
    order.total = Decimal("29.99")
    order.items = []
    return order


class TestOrderService:
    """Tests for OrderService business logic."""

    # --- State Machine Tests ---

    def test_can_transition_pending_to_paid(self):
        """Pending orders can be marked as paid."""
        assert OrderService.can_transition(
            OrderStatus.PENDING,
            OrderStatus.PAID,
        ) is True

    def test_cannot_transition_cancelled_to_paid(self):
        """Cancelled orders cannot be reactivated."""
        assert OrderService.can_transition(
            OrderStatus.CANCELLED,
            OrderStatus.PAID,
        ) is False

    @pytest.mark.parametrize("current,target,expected", [
        (OrderStatus.PENDING, OrderStatus.PAID, True),
        (OrderStatus.PENDING, OrderStatus.CANCELLED, True),
        (OrderStatus.PAID, OrderStatus.PROCESSING, True),
        (OrderStatus.PAID, OrderStatus.SHIPPED, False),
        (OrderStatus.SHIPPED, OrderStatus.DELIVERED, True),
        (OrderStatus.DELIVERED, OrderStatus.CANCELLED, False),
    ])
    def test_state_transitions(self, current, target, expected):
        """Verify state machine transition rules."""
        assert OrderService.can_transition(current, target) is expected

    # --- Get Order Tests ---

    @pytest.mark.asyncio
    async def test_get_order_success(self, mock_db, sample_order):
        """Successfully fetch existing order."""
        mock_db.execute.return_value.scalar_one_or_none.return_value = sample_order

        result = await OrderService.get_order(mock_db, order_id=1)

        assert result.id == 1
        mock_db.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_order_not_found(self, mock_db):
        """Raise EntityNotFoundError for missing order."""
        mock_db.execute.return_value.scalar_one_or_none.return_value = None

        with pytest.raises(EntityNotFoundError) as exc_info:
            await OrderService.get_order(mock_db, order_id=999)

        assert "999" in str(exc_info.value.message)

    @pytest.mark.asyncio
    async def test_get_order_with_owner_filter(self, mock_db, sample_order):
        """Filter order by owner."""
        mock_db.execute.return_value.scalar_one_or_none.return_value = sample_order
        owner = OrderOwner(user_id=42, guest_email=None)

        result = await OrderService.get_order(mock_db, order_id=1, owner=owner)

        assert result.id == 1

    # --- Cancel Order Tests ---

    @pytest.mark.asyncio
    async def test_cancel_pending_order(self, mock_db, sample_order):
        """Successfully cancel pending order."""
        mock_db.execute.return_value.scalar_one_or_none.return_value = sample_order

        result = await OrderService.cancel(mock_db, order_id=1)

        assert result.status == OrderStatus.CANCELLED.value
        mock_db.flush.assert_called_once()

    @pytest.mark.asyncio
    async def test_cancel_shipped_order_fails(self, mock_db, sample_order):
        """Cannot cancel already shipped order."""
        sample_order.status = OrderStatus.SHIPPED.value
        mock_db.execute.return_value.scalar_one_or_none.return_value = sample_order

        with pytest.raises(InvalidStateTransitionError):
            await OrderService.cancel(mock_db, order_id=1)


class TestOrderAPI:
    """Integration tests for order API endpoints."""

    @pytest.mark.asyncio
    async def test_create_order_endpoint(self, client, auth_headers):
        """Create order via API."""
        response = await client.post(
            "/api/orders",
            json={
                "shipping": {
                    "name": "Test User",
                    "address": "123 Test St",
                    "city": "Riga",
                    "postal_code": "LV-1001",
                    "country": "Latvia",
                },
            },
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "pending"
        assert "id" in data

    @pytest.mark.asyncio
    async def test_cancel_order_endpoint(self, client, auth_headers, pending_order):
        """Cancel order via API."""
        response = await client.delete(
            f"/api/orders/{pending_order.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.json()["status"] == "cancelled"

    @pytest.mark.asyncio
    async def test_cancel_shipped_order_fails(self, client, auth_headers, shipped_order):
        """Cannot cancel shipped order via API."""
        response = await client.delete(
            f"/api/orders/{shipped_order.id}",
            headers=auth_headers,
        )

        assert response.status_code == 400
```

### Testing Conventions

| Convention | Example |
|------------|---------|
| Use `pytest.fixture` for setup | `@pytest.fixture def mock_db()` |
| Use `@pytest.mark.asyncio` for async | Required for async tests |
| Use `@pytest.mark.parametrize` | For multiple test cases |
| Mock external dependencies | `AsyncMock(spec=AsyncSession)` |
| Test both success and failure | `test_*_success`, `test_*_fails` |
| Descriptive test names | `test_cancel_shipped_order_fails` |

### Critical: conftest.py Model Import

The `db_session` fixture **MUST** import all models before calling `Base.metadata.create_all`. Without this, SQLAlchemy metadata is empty and no tables are created:

```python
@pytest.fixture
async def db_session():
    from app.database import Base
    import app.models  # noqa: F401 — registers models with Base.metadata

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # ...
```

See BUG-012 for the full root cause analysis.

### Agent Tool Access in Tests

Use the `get_tool_func()` helper to access agent tool functions. This wraps the internal API in one place, making it easy to update when pydantic-ai changes (see BUG-013):

```python
def get_tool_func(agent, tool_name: str):
    """Extract a tool function from the agent by name."""
    tools = agent._function_tools  # pydantic-ai 0.0.53+
    if tool_name in tools:
        return tools[tool_name].function
    raise ValueError(f"Tool '{tool_name}' not found in agent")
```

---

## Error Handling

### Error Response Pattern

```python
# In utils/errors.py
import logging
from enum import Enum
from fastapi import HTTPException, Request

logger = logging.getLogger(__name__)


class ErrorCode(str, Enum):
    """Standard error codes for API responses."""
    NOT_FOUND = "not_found"
    VALIDATION_ERROR = "validation_error"
    INSUFFICIENT_STOCK = "insufficient_stock"
    INVALID_STATE = "invalid_state"
    UNAUTHORIZED = "unauthorized"
    STRIPE_ERROR = "stripe_error"
    INTERNAL_ERROR = "internal_error"


def safe_error_response(
    error: Exception,
    request: Request,
    context: dict | None = None,
) -> HTTPException:
    """
    Create safe HTTP error response with logging.

    Sanitizes error messages to prevent information leakage.
    """
    # Log full error for debugging
    logger.error(
        f"Error processing request",
        extra={
            "path": request.url.path,
            "method": request.method,
            "error_type": type(error).__name__,
            "error_message": str(error),
            "context": context or {},
        },
        exc_info=True,
    )

    # Return sanitized response
    return HTTPException(
        status_code=500,
        detail={
            "code": ErrorCode.INTERNAL_ERROR.value,
            "message": "An unexpected error occurred",
        },
    )
```

### Exception Handling in Routes

```python
@router.post("/create-checkout")
async def create_checkout(
    request: Request,
    order_id: int,
    db: AsyncSession = Depends(get_db),
):
    try:
        # Business logic...
        session = await StripeService.create_checkout_session(order)
        return {"checkout_url": session.url}

    except DomainException as e:
        # Known business errors - return appropriate HTTP status
        raise domain_to_http(e)

    except stripe.StripeError as e:
        # External service errors - log and return safe message
        logger.error(f"Stripe error: {e}", exc_info=True)
        raise HTTPException(
            status_code=502,
            detail={"code": "stripe_error", "message": "Payment service unavailable"},
        )

    except Exception as e:
        # Unexpected errors - log full details, return generic message
        raise safe_error_response(e, request, {"order_id": order_id})
```

---

## Logging

### Logging Configuration

```python
# In logging_config.py
import logging
import sys
from pythonjsonlogger import jsonlogger


def setup_logging(level: str = "INFO"):
    """Configure structured JSON logging."""
    handler = logging.StreamHandler(sys.stdout)
    formatter = jsonlogger.JsonFormatter(
        fmt="%(asctime)s %(levelname)s %(name)s %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.addHandler(handler)

    # Reduce noise from libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
```

### Logging Usage

```python
import logging

logger = logging.getLogger(__name__)

# Info level for normal operations
logger.info("Order created", extra={"order_id": order.id, "user_id": user.id})

# Warning for recoverable issues
logger.warning("Stock low for variant", extra={"variant_id": variant.id, "stock": variant.stock})

# Error for failures (with stack trace)
logger.error("Payment failed", extra={"order_id": order.id}, exc_info=True)

# Debug for development
logger.debug("Query executed", extra={"query": str(stmt), "params": params})
```

---

## Code Quality

### PEP 8 Compliance

- Max line length: 100 characters
- Use 4 spaces for indentation
- Two blank lines between top-level definitions
- One blank line between method definitions

### Type Hints

```python
# Function signatures
async def get_order(
    db: AsyncSession,
    order_id: int,
    owner: OrderOwner | None = None,
) -> Order:
    ...

# Variable annotations
items: list[OrderItem] = []
total: Decimal = Decimal("0.00")
user_id: int | None = None

# Generic types
from typing import TypeVar, Generic

T = TypeVar("T")

class Repository(Generic[T]):
    async def get(self, id: int) -> T | None:
        ...
```

### Docstrings

```python
def calculate_totals(items: list[CartItem]) -> CartSummary:
    """
    Calculate cart totals from items.

    Sums the price * quantity for each item and counts total items.

    Args:
        items: List of cart items with variant relationships loaded

    Returns:
        CartSummary with total amount and item count

    Example:
        >>> items = [CartItem(quantity=2, variant=Variant(price=10.00))]
        >>> totals = calculate_totals(items)
        >>> totals.total
        Decimal('20.00')
    """
    total = sum(item.quantity * item.variant.price for item in items)
    item_count = sum(item.quantity for item in items)
    return CartSummary(total=total, item_count=item_count)
```

---

## References

- **Architecture guide**: `reference/backend_architecture_guide.md` — concise 5-step workflow for adding new resources
- FastAPI Documentation: https://fastapi.tiangolo.com/
- SQLAlchemy 2.0 Async: https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html
- Pydantic V2: https://docs.pydantic.dev/latest/
- Pydantic AI: https://ai.pydantic.dev/
- Stripe Python: https://stripe.com/docs/api?lang=python
- pytest-asyncio: https://pytest-asyncio.readthedocs.io/
