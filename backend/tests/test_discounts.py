"""Tests for discount code validation and order integration."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DiscountCode, DiscountType
from app.services import DiscountService
from app.exceptions import EntityNotFoundError, ValidationError


# ── Service Tests ────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestDiscountService:
    async def _create_discount(self, db: AsyncSession, **kwargs) -> DiscountCode:
        defaults = {
            "code": "SAVE10",
            "type": DiscountType.PERCENTAGE.value,
            "value": Decimal("10"),
        }
        defaults.update(kwargs)
        return await DiscountService.create(db, **defaults)

    async def test_validate_percentage(self, db_session: AsyncSession):
        discount = await self._create_discount(db_session)
        await db_session.commit()

        code, amount = await DiscountService.validate_code(
            db_session, "SAVE10", Decimal("100.00")
        )
        assert code.id == discount.id
        assert amount == Decimal("10.00")

    async def test_validate_fixed(self, db_session: AsyncSession):
        await self._create_discount(
            db_session, code="FLAT5", type="fixed", value=Decimal("5.00")
        )
        await db_session.commit()

        _, amount = await DiscountService.validate_code(
            db_session, "flat5", Decimal("50.00")
        )
        assert amount == Decimal("5.00")

    async def test_fixed_capped_at_subtotal(self, db_session: AsyncSession):
        """Fixed discount can't exceed subtotal."""
        await self._create_discount(
            db_session, code="BIG50", type="fixed", value=Decimal("50.00")
        )
        await db_session.commit()

        _, amount = await DiscountService.validate_code(
            db_session, "BIG50", Decimal("30.00")
        )
        assert amount == Decimal("30.00")

    async def test_not_found(self, db_session: AsyncSession):
        with pytest.raises(EntityNotFoundError):
            await DiscountService.validate_code(
                db_session, "NOPE", Decimal("100.00")
            )

    async def test_inactive(self, db_session: AsyncSession):
        discount = await self._create_discount(db_session)
        discount.active = False
        await db_session.commit()

        with pytest.raises(ValidationError, match="no longer active"):
            await DiscountService.validate_code(
                db_session, "SAVE10", Decimal("100.00")
            )

    async def test_expired(self, db_session: AsyncSession):
        past = datetime.now(timezone.utc) - timedelta(days=1)
        await self._create_discount(db_session, valid_until=past)
        await db_session.commit()

        with pytest.raises(ValidationError, match="expired"):
            await DiscountService.validate_code(
                db_session, "SAVE10", Decimal("100.00")
            )

    async def test_not_yet_valid(self, db_session: AsyncSession):
        future = datetime.now(timezone.utc) + timedelta(days=1)
        await self._create_discount(db_session, valid_from=future)
        await db_session.commit()

        with pytest.raises(ValidationError, match="not yet valid"):
            await DiscountService.validate_code(
                db_session, "SAVE10", Decimal("100.00")
            )

    async def test_max_uses_reached(self, db_session: AsyncSession):
        discount = await self._create_discount(db_session, max_uses=1)
        discount.used_count = 1
        await db_session.commit()

        with pytest.raises(ValidationError, match="maximum uses"):
            await DiscountService.validate_code(
                db_session, "SAVE10", Decimal("100.00")
            )

    async def test_min_order_amount(self, db_session: AsyncSession):
        await self._create_discount(
            db_session, min_order_amount=Decimal("50.00")
        )
        await db_session.commit()

        with pytest.raises(ValidationError, match="Minimum order amount"):
            await DiscountService.validate_code(
                db_session, "SAVE10", Decimal("30.00")
            )

    async def test_increment_usage(self, db_session: AsyncSession):
        discount = await self._create_discount(db_session)
        await db_session.commit()

        assert discount.used_count == 0
        await DiscountService.increment_usage(db_session, discount.id)
        await db_session.commit()
        await db_session.refresh(discount)
        assert discount.used_count == 1

    async def test_deactivate(self, db_session: AsyncSession):
        discount = await self._create_discount(db_session)
        await db_session.commit()

        result = await DiscountService.deactivate(db_session, discount.id)
        await db_session.commit()
        assert result.active is False

    async def test_list_all(self, db_session: AsyncSession):
        await self._create_discount(db_session, code="A")
        await self._create_discount(db_session, code="B")
        await db_session.commit()

        codes = await DiscountService.list_all(db_session)
        assert len(codes) == 2


# ── API Tests ────────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestDiscountAPI:
    async def test_validate_valid_code(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        discount = DiscountCode(
            code="WELCOME",
            type="percentage",
            value=Decimal("15"),
            active=True,
        )
        db_session.add(discount)
        await db_session.commit()

        response = await client.post(
            "/api/discounts/validate",
            json={"code": "WELCOME", "subtotal": 80.00},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["code"] == "WELCOME"
        assert float(data["discount_amount"]) == 12.00

    async def test_validate_invalid_code(self, client: AsyncClient):
        response = await client.post(
            "/api/discounts/validate",
            json={"code": "DOESNOTEXIST", "subtotal": 50.00},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert data["message"] is not None


@pytest.mark.asyncio
class TestAdminDiscountAPI:
    async def test_create_discount(self, admin_client: AsyncClient):
        response = await admin_client.post(
            "/api/admin/discounts",
            json={
                "code": "NEWCODE",
                "type": "fixed",
                "value": 5.00,
                "max_uses": 100,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == "NEWCODE"
        assert data["active"] is True

    async def test_list_discounts(self, admin_client: AsyncClient, db_session: AsyncSession):
        discount = DiscountCode(
            code="LIST1", type="percentage", value=Decimal("10"), active=True
        )
        db_session.add(discount)
        await db_session.commit()

        response = await admin_client.get("/api/admin/discounts")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    async def test_deactivate_discount(
        self, admin_client: AsyncClient, db_session: AsyncSession
    ):
        discount = DiscountCode(
            code="DEACT", type="percentage", value=Decimal("10"), active=True
        )
        db_session.add(discount)
        await db_session.commit()
        await db_session.refresh(discount)

        response = await admin_client.put(
            f"/api/admin/discounts/{discount.id}/deactivate"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["active"] is False

    async def test_unauthorized(self, client: AsyncClient):
        response = await client.get("/api/admin/discounts")
        assert response.status_code in (401, 403)
