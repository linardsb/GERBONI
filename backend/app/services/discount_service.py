"""Discount code validation and application service."""

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..exceptions import EntityNotFoundError, ValidationError
from ..models import DiscountCode, DiscountType


class DiscountService:
    @staticmethod
    async def validate_code(
        db: AsyncSession,
        code: str,
        order_subtotal: Decimal,
    ) -> tuple[DiscountCode, Decimal]:
        """Validate a discount code and return (code_obj, discount_amount).

        Raises:
            EntityNotFoundError: Code not found
            ValidationError: Code invalid (inactive, expired, max uses, min order)
        """
        result = await db.execute(
            select(DiscountCode).where(
                func.upper(DiscountCode.code) == code.upper()
            )
        )
        discount = result.scalar_one_or_none()

        if not discount:
            raise EntityNotFoundError("Discount code not found")

        if not discount.active:
            raise ValidationError("Discount code is no longer active")

        now = datetime.now(timezone.utc)

        # Handle both naive (SQLite) and aware (PostgreSQL) datetimes
        def _make_aware(dt: datetime) -> datetime:
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt

        if discount.valid_from and now < _make_aware(discount.valid_from):
            raise ValidationError("Discount code is not yet valid")
        if discount.valid_until and now > _make_aware(discount.valid_until):
            raise ValidationError("Discount code has expired")

        if discount.max_uses is not None and discount.used_count >= discount.max_uses:
            raise ValidationError("Discount code has reached maximum uses")

        if discount.min_order_amount is not None and order_subtotal < discount.min_order_amount:
            raise ValidationError(
                f"Minimum order amount is €{discount.min_order_amount}"
            )

        amount = DiscountService.calculate_discount(discount, order_subtotal)
        return discount, amount

    @staticmethod
    def calculate_discount(discount: DiscountCode, subtotal: Decimal) -> Decimal:
        """Calculate the discount amount."""
        if discount.type == DiscountType.PERCENTAGE.value:
            amount = subtotal * discount.value / Decimal("100")
        else:  # fixed
            amount = min(discount.value, subtotal)  # can't exceed subtotal
        return amount.quantize(Decimal("0.01"))

    @staticmethod
    async def increment_usage(db: AsyncSession, discount_id: int) -> None:
        """Increment used_count after successful order."""
        result = await db.execute(
            select(DiscountCode).where(DiscountCode.id == discount_id)
        )
        discount = result.scalar_one_or_none()
        if discount:
            discount.used_count += 1

    @staticmethod
    async def create(
        db: AsyncSession,
        *,
        code: str,
        type: str,
        value: Decimal,
        min_order_amount: Decimal | None = None,
        max_uses: int | None = None,
        valid_from: datetime | None = None,
        valid_until: datetime | None = None,
    ) -> DiscountCode:
        """Create a new discount code."""
        discount = DiscountCode(
            code=code.upper(),
            type=type,
            value=value,
            min_order_amount=min_order_amount,
            max_uses=max_uses,
            valid_from=valid_from,
            valid_until=valid_until,
        )
        db.add(discount)
        await db.flush()
        return discount

    @staticmethod
    async def list_all(db: AsyncSession) -> list[DiscountCode]:
        """List all discount codes."""
        result = await db.execute(
            select(DiscountCode).order_by(DiscountCode.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def deactivate(db: AsyncSession, discount_id: int) -> DiscountCode:
        """Deactivate a discount code."""
        result = await db.execute(
            select(DiscountCode).where(DiscountCode.id == discount_id)
        )
        discount = result.scalar_one_or_none()
        if not discount:
            raise EntityNotFoundError("Discount code not found")
        discount.active = False
        await db.flush()
        return discount
