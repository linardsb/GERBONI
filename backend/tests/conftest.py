"""
Shared test fixtures for the GERBONI backend test suite.
"""

import asyncio
from typing import AsyncGenerator, Generator
from decimal import Decimal
from unittest.mock import patch, AsyncMock

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
    # Import Base here to avoid circular imports
    from app.database import Base

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

    # Patch init_db before the app starts
    with patch("app.main.init_db", mock_init_db):
        transport = ASGITransport(app=app)
        # Use localhost to satisfy TrustedHostMiddleware
        async with AsyncClient(transport=transport, base_url="http://localhost") as ac:
            yield ac

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
    colors = ["Black", "White", "Navy"]
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
