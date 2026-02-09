"""
Shared test fixtures for the GERBONI backend test suite.
"""

import asyncio
from typing import AsyncGenerator, Generator
from decimal import Decimal
from unittest.mock import patch, AsyncMock, MagicMock

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool


# Test database URL - use in-memory SQLite for speed
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


# Create test engine and session maker
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
)

test_session_maker = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session with tables."""
    # Import Base and all models to ensure metadata is populated
    from app.database import Base
    import app.models  # noqa: F401 — registers models with Base.metadata

    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create session
    async with test_session_maker() as session:
        yield session

    # Drop tables after test
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create an async HTTP client for testing."""
    from app.database import get_db
    from app.main import app

    # Override database dependency
    async def override_get_db():
        yield db_session

    # Mock init_db to avoid connecting to production database
    async def mock_init_db():
        pass

    app.dependency_overrides[get_db] = override_get_db

    # Disable rate limiting in tests
    from app.middleware import limiter
    original_enabled = limiter.enabled
    limiter.enabled = False

    # Patch init_db before the app starts
    with patch("app.main.init_db", mock_init_db):
        transport = ASGITransport(app=app)
        # Use localhost to satisfy TrustedHostMiddleware
        async with AsyncClient(transport=transport, base_url="http://localhost") as ac:
            yield ac

    limiter.enabled = original_enabled
    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session: AsyncSession):
    """Create a test user."""
    from app.models import User
    from app.services import AuthService

    user = User(
        email="test@example.com",
        password_hash=AuthService.get_password_hash("TestPass123"),
        is_guest=False,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_user_token(test_user) -> str:
    """Create an access token for the test user."""
    from app.services import AuthService

    return AuthService.create_access_token(data={"sub": str(test_user.id)})


@pytest.fixture
async def auth_client(client: AsyncClient, test_user_token: str) -> AsyncClient:
    """Create an authenticated client."""
    client.headers["Authorization"] = f"Bearer {test_user_token}"
    return client


@pytest.fixture
async def test_guest_session(db_session: AsyncSession):
    """Create a test guest session."""
    from app.models import GuestSession

    session = GuestSession(email="guest@example.com")
    db_session.add(session)
    await db_session.commit()
    await db_session.refresh(session)
    return session


@pytest.fixture
async def test_product(db_session: AsyncSession):
    """Create a test product with variants."""
    from app.models import Product, TShirtVariant

    product = Product(
        city_name="Riga",
        city_name_lv="Rīga",
        coat_of_arms_image="riga.svg",
        description="T-shirt featuring the coat of arms of Riga",
        description_lv="T-krekls ar Rīgas ģerboni",
        is_active=True,
    )
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)

    # Add variants
    colors = ["Black", "White", "Red"]
    sizes = ["S", "M", "L"]

    for color in colors:
        for size in sizes:
            variant = TShirtVariant(
                product_id=product.id,
                color=color,
                size=size,
                price=Decimal("24.99"),
                stock=100,
                sku=f"RIG-{color[:3].upper()}-{size}",
            )
            db_session.add(variant)

    await db_session.commit()
    await db_session.refresh(product)
    return product


@pytest.fixture
async def test_variant(test_product, db_session: AsyncSession):
    """Get a test variant from the test product."""
    from sqlalchemy import select
    from app.models import TShirtVariant

    result = await db_session.execute(
        select(TShirtVariant).where(TShirtVariant.product_id == test_product.id).limit(1)
    )
    return result.scalar_one()


# =============================================================================
# Admin User Fixtures
# =============================================================================


@pytest.fixture
async def test_admin_user(db_session: AsyncSession):
    """Create an admin user."""
    from app.models import User, UserRole
    from app.services import AuthService

    user = User(
        email="admin@example.com",
        password_hash=AuthService.get_password_hash("AdminPass123"),
        is_guest=False,
        is_active=True,
        role=UserRole.ADMIN.value,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_admin_token(test_admin_user) -> str:
    """Create an access token for the admin user."""
    from app.services import AuthService

    return AuthService.create_access_token(data={"sub": str(test_admin_user.id)})


@pytest.fixture
async def admin_client(client: AsyncClient, test_admin_token: str) -> AsyncClient:
    """Create an admin-authenticated client."""
    client.headers["Authorization"] = f"Bearer {test_admin_token}"
    return client


@pytest.fixture
async def test_super_admin_user(db_session: AsyncSession):
    """Create a super_admin user."""
    from app.models import User, UserRole
    from app.services import AuthService

    user = User(
        email="superadmin@example.com",
        password_hash=AuthService.get_password_hash("SuperPass123"),
        is_guest=False,
        is_active=True,
        role=UserRole.SUPER_ADMIN.value,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_super_admin_token(test_super_admin_user) -> str:
    """Create an access token for the super_admin user."""
    from app.services import AuthService

    return AuthService.create_access_token(data={"sub": str(test_super_admin_user.id)})


@pytest.fixture
async def super_admin_client(client: AsyncClient, test_super_admin_token: str) -> AsyncClient:
    """Create a super_admin-authenticated client."""
    client.headers["Authorization"] = f"Bearer {test_super_admin_token}"
    return client


@pytest.fixture
async def test_reset_token(db_session: AsyncSession, test_user):
    """Create a password reset token for the test user."""
    from app.models import PasswordResetToken

    token = PasswordResetToken(user_id=test_user.id)
    db_session.add(token)
    await db_session.commit()
    await db_session.refresh(token)
    return token


# =============================================================================
# Stripe Mocks
# =============================================================================


class MockStripeSession:
    """Mock Stripe checkout session."""

    def __init__(
        self,
        id: str = "cs_test_123",
        url: str = "https://checkout.stripe.com/pay/cs_test_123",
        status: str = "open",
        payment_status: str = "unpaid",
        metadata: dict | None = None,
    ):
        self.id = id
        self.url = url
        self.status = status
        self.payment_status = payment_status
        self.metadata = metadata or {}


@pytest.fixture
def mock_stripe_checkout_session():
    """Mock for Stripe checkout session creation."""
    return MockStripeSession()


@pytest.fixture
def mock_stripe_service(mock_stripe_checkout_session):
    """Fixture that patches StripeService methods for testing."""
    with patch("app.services.StripeService") as mock_stripe:
        # Create checkout session mock
        mock_stripe.create_checkout_session = AsyncMock(
            return_value=mock_stripe_checkout_session
        )

        # Retrieve session mock
        mock_stripe.retrieve_session = AsyncMock(
            return_value=mock_stripe_checkout_session
        )

        # Construct webhook event mock
        mock_stripe.construct_webhook_event = MagicMock(
            return_value={
                "type": "checkout.session.completed",
                "data": {
                    "object": {
                        "id": "cs_test_123",
                        "payment_intent": "pi_test_123",
                        "metadata": {"order_id": "1"},
                    }
                },
            }
        )

        yield mock_stripe


@pytest.fixture
def stripe_checkout_completed_event():
    """Sample Stripe checkout.session.completed webhook event."""
    return {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_test_completed",
                "payment_intent": "pi_test_123",
                "payment_status": "paid",
                "metadata": {"order_id": "1"},
                "amount_total": 2499,
                "currency": "eur",
            }
        },
    }


@pytest.fixture
def stripe_checkout_expired_event():
    """Sample Stripe checkout.session.expired webhook event."""
    return {
        "type": "checkout.session.expired",
        "data": {
            "object": {
                "id": "cs_test_expired",
                "metadata": {"order_id": "1"},
            }
        },
    }


# =============================================================================
# Pydantic AI / Anthropic Mocks
# =============================================================================


class MockAgentResult:
    """Mock result from Pydantic AI agent."""

    def __init__(self, data: str):
        self.data = data
        self.output = data


@pytest.fixture
def mock_anthropic_agent():
    """Mock the Pydantic AI agent for testing without API calls."""
    with patch("app.agent.support_agent.get_support_agent") as mock_get_agent:
        mock_agent = MagicMock()
        mock_agent.run = AsyncMock(
            return_value=MockAgentResult(
                data="I'm here to help! How can I assist you today?"
            )
        )
        mock_get_agent.return_value = mock_agent
        yield mock_agent


@pytest.fixture
def mock_agent_order_lookup():
    """Mock agent that returns order information."""
    with patch("app.agent.support_agent.get_support_agent") as mock_get_agent:
        mock_agent = MagicMock()
        mock_agent.run = AsyncMock(
            return_value=MockAgentResult(
                data="Order #1: Status pending | €24.99 | Placed 2026-01-15"
            )
        )
        mock_get_agent.return_value = mock_agent
        yield mock_agent


@pytest.fixture
def mock_agent_product_search():
    """Mock agent that returns product search results."""
    with patch("app.agent.support_agent.get_support_agent") as mock_get_agent:
        mock_agent = MagicMock()
        mock_agent.run = AsyncMock(
            return_value=MockAgentResult(
                data="Available products:\n  • Rīga (Rīga): from €24.99 | Colors: Black, White, Red"
            )
        )
        mock_get_agent.return_value = mock_agent
        yield mock_agent


@pytest.fixture
def mock_agent_refund():
    """Mock agent that processes refund requests."""
    with patch("app.agent.support_agent.get_support_agent") as mock_get_agent:
        mock_agent = MagicMock()
        mock_agent.run = AsyncMock(
            return_value=MockAgentResult(
                data="✅ Refund approved for Order #1\nAmount: €24.99\nExpected completion: 5-10 business days"
            )
        )
        mock_get_agent.return_value = mock_agent
        yield mock_agent


# =============================================================================
# Order Test Fixtures
# =============================================================================


@pytest.fixture
async def test_order(db_session: AsyncSession, test_user, test_variant):
    """Create a test order with items."""
    from app.models import Order, OrderItem, OrderStatus

    order = Order(
        user_id=test_user.id,
        status=OrderStatus.PENDING.value,
        total=Decimal("24.99"),
        shipping_name="Test User",
        shipping_address="123 Test Street",
        shipping_city="Riga",
        shipping_postal_code="LV-1001",
        shipping_country="Latvia",
    )
    db_session.add(order)
    await db_session.flush()

    order_item = OrderItem(
        order_id=order.id,
        variant_id=test_variant.id,
        quantity=1,
        price=Decimal("24.99"),
    )
    db_session.add(order_item)
    await db_session.commit()
    await db_session.refresh(order)
    return order


@pytest.fixture
async def test_paid_order(db_session: AsyncSession, test_user, test_variant):
    """Create a paid test order."""
    from app.models import Order, OrderItem, OrderStatus

    order = Order(
        user_id=test_user.id,
        status=OrderStatus.PAID.value,
        total=Decimal("24.99"),
        shipping_name="Test User",
        shipping_address="123 Test Street",
        shipping_city="Riga",
        shipping_postal_code="LV-1001",
        shipping_country="Latvia",
        stripe_payment_id="pi_test_123",
    )
    db_session.add(order)
    await db_session.flush()

    order_item = OrderItem(
        order_id=order.id,
        variant_id=test_variant.id,
        quantity=1,
        price=Decimal("24.99"),
    )
    db_session.add(order_item)
    await db_session.commit()
    await db_session.refresh(order)
    return order
