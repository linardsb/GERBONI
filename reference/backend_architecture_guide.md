# Backend Architecture Guide

Use when adding a new API resource, service, or domain feature to the GERBONI backend.

## Architecture

```
Import only downward — never up:

  api/*.py          ← Routes (thin: parse → delegate → respond)
       ↓
  services/*.py     ← Business logic (HTTP-agnostic, domain exceptions)
       ↓
  models/*.py       ← ORM          schemas/*.py  ← Pydantic v2
       ↓                                ↓
  database.py / exceptions.py / api/deps.py  ← Shared infrastructure
```

## Step 1: Define the Model

```python
# models/resource.py
from datetime import datetime
from decimal import Decimal
from enum import Enum
from sqlalchemy import String, DateTime, func, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base

class ResourceStatus(str, Enum):       # str, Enum — lowercase values
    ACTIVE = "active"
    ARCHIVED = "archived"

class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), index=True)
    name_lv: Mapped[str] = mapped_column(String(100))           # Latvian translation
    status: Mapped[str] = mapped_column(String(50), default=ResourceStatus.ACTIVE.value)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))      # Decimal for money
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    user: Mapped["User | None"] = relationship(back_populates="resources")
    items: Mapped[list["ResourceItem"]] = relationship(back_populates="resource")
```

Export in `models/__init__.py` — conftest `import app.models` must capture all models.

- `Mapped[T]` only. `Decimal`/`Numeric(10,2)` for money. `DateTime(timezone=True)` timestamps.

## Step 2: Create Schemas

```python
# schemas/resource.py
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel

class ResourceCreate(BaseModel):          # Input — user-provided fields only
    name: str
    name_lv: str
    price: Decimal

class ResourceRead(BaseModel):           # Output — full representation
    id: int
    name: str
    name_lv: str
    status: str
    price: Decimal
    user_id: int | None
    created_at: datetime
    class Config:
        from_attributes = True           # ORM → schema auto-mapping
```

- `Create` = input, `Read` = response. `Decimal` for money, `| None` for optional.

## Step 3: Build the Service

```python
# services/resource_service.py
from dataclasses import dataclass
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from ..models import Resource
from ..exceptions import EntityNotFoundError, AuthorizationError

@dataclass
class ResourceOwner:
    user_id: int | None
    guest_email: str | None

class ResourceService:
    @staticmethod
    async def get(db: AsyncSession, resource_id: int, owner: ResourceOwner | None = None) -> Resource:
        stmt = select(Resource).options(selectinload(Resource.items)).where(Resource.id == resource_id)
        if owner and owner.user_id:
            stmt = stmt.where(Resource.user_id == owner.user_id)
        result = await db.execute(stmt)
        resource = result.scalar_one_or_none()
        if not resource:
            raise EntityNotFoundError("Resource not found")
        return resource

    @staticmethod
    async def create(db: AsyncSession, owner: ResourceOwner, name: str, name_lv: str, price: Decimal) -> Resource:
        if not owner.user_id and not owner.guest_email:
            raise AuthorizationError("Authentication required")
        resource = Resource(user_id=owner.user_id, name=name, name_lv=name_lv, price=price)
        db.add(resource)
        await db.flush()  # ← flush, NEVER commit
        await db.refresh(resource)
        return resource

    @staticmethod
    async def list_all(db: AsyncSession, skip: int = 0, limit: int = 20) -> list[Resource]:
        result = await db.execute(select(Resource).options(selectinload(Resource.items))
            .order_by(Resource.created_at.desc()).offset(skip).limit(limit))
        return list(result.scalars().all())
```

- Static methods, `db: AsyncSession` first. `flush()` never `commit()`. `selectinload()` for joins.

## Step 4: Write Route Handlers

```python
# api/resources.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..schemas.resource import ResourceCreate, ResourceRead
from ..services.resource_service import ResourceService, ResourceOwner
from ..exceptions import DomainException, domain_to_http
from .deps import require_auth, get_auth, AuthResult
router = APIRouter()

@router.get("", response_model=list[ResourceRead])  # Public — no auth needed
async def list_resources(skip: int = 0, limit: int = 20, db: AsyncSession = Depends(get_db)):
    return await ResourceService.list_all(db, skip, limit)

@router.get("/{resource_id}", response_model=ResourceRead)
async def get_resource(resource_id: int, auth: AuthResult = Depends(require_auth), db: AsyncSession = Depends(get_db)):
    owner = ResourceOwner(user_id=auth.user_id, guest_email=auth.guest_email)
    try:
        return await ResourceService.get(db, resource_id, owner)
    except DomainException as e:
        raise domain_to_http(e)

@router.post("", response_model=ResourceRead, status_code=201)
async def create_resource(data: ResourceCreate, auth: AuthResult = Depends(require_auth), db: AsyncSession = Depends(get_db)):
    owner = ResourceOwner(user_id=auth.user_id, guest_email=auth.guest_email)
    try:
        resource = await ResourceService.create(db, owner, data.name, data.name_lv, data.price)
        await db.commit()  # ← route commits after service succeeds
        return resource
    except DomainException as e:
        raise domain_to_http(e)
```

- Thin: parse → delegate → respond. `DomainException` → `domain_to_http(e)`. `db.commit()` after mutations.

## Step 5: Register and Test

Register: `api_router.include_router(resources_router, prefix="/resources", tags=["resources"])` in `api/__init__.py`

```python
# tests/test_resources.py
class TestResourceAPI:
    @pytest.mark.asyncio
    async def test_create_resource(self, auth_client):
        resp = await auth_client.post("/api/resources", json={"name": "Test", "name_lv": "Tests", "price": "19.99"})
        assert resp.status_code == 201
        assert resp.json()["name"] == "Test"

    @pytest.mark.asyncio
    async def test_create_requires_auth(self, client):  # client = unauthenticated
        resp = await client.post("/api/resources", json={"name": "Test", "name_lv": "Tests", "price": "19.99"})
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_not_found(self, auth_client):
        assert (await auth_client.get("/api/resources/999")).status_code == 404
# Fixtures: client (anon), auth_client (JWT), admin_client (admin) — from conftest.py
```

## Quick Checklist

- [ ] Model in `models/` with `Mapped[T]`, exported in `models/__init__.py`
- [ ] Schemas: `Create` (input) + `Read` (output, `from_attributes = True`)
- [ ] Service: static methods, `db: AsyncSession` first, `flush()` not `commit()`
- [ ] Service raises domain exceptions — never `HTTPException`
- [ ] Routes: thin, `DomainException` → `domain_to_http(e)`, `db.commit()` after mutation
- [ ] Auth: `require_auth`/`get_auth` from deps — build `Owner` from `AuthResult`
- [ ] Router registered in `api/__init__.py` with prefix and tags
- [ ] `selectinload()` for relationships. `Decimal`/`Numeric(10,2)` for money.
- [ ] Tests: happy path + 401 + 404 + domain error cases
