"""Cart business logic service.

Follows the static method pattern established by AuthService.
All methods accept db: AsyncSession as first parameter.
Services don't commit transactions - caller controls boundaries.
"""

from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..exceptions import (
    AuthorizationError,
    EntityNotFoundError,
    InsufficientStockError,
)
from ..models import CartItem, TShirtVariant, User, GuestSession


@dataclass
class CartOwner:
    """Identifies cart owner - either user or guest session."""
    user_id: int | None
    session_id: int | None

    def __post_init__(self):
        if self.user_id is None and self.session_id is None:
            raise AuthorizationError("User or guest session required")


@dataclass
class CartSummary:
    """Calculated cart totals."""
    item_count: int
    total: Decimal


class CartService:
    @staticmethod
    async def get_cart_items(
        db: AsyncSession,
        owner: CartOwner,
    ) -> list[CartItem]:
        """Get all cart items for the owner with variant and product data loaded."""
        stmt = select(CartItem).options(
            selectinload(CartItem.variant).selectinload(TShirtVariant.product)
        )

        if owner.user_id:
            stmt = stmt.where(CartItem.user_id == owner.user_id)
        else:
            stmt = stmt.where(CartItem.session_id == owner.session_id)

        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def add_item(
        db: AsyncSession,
        owner: CartOwner,
        variant_id: int,
        quantity: int,
    ) -> list[CartItem]:
        """Add item to cart, merging if already exists.

        Raises:
            EntityNotFoundError: Variant does not exist
            InsufficientStockError: Requested quantity exceeds available stock
        """
        # Verify variant exists
        result = await db.execute(
            select(TShirtVariant).where(TShirtVariant.id == variant_id)
        )
        variant = result.scalar_one_or_none()

        if not variant:
            raise EntityNotFoundError("Product variant not found")

        # Check for existing cart item
        stmt = select(CartItem).where(CartItem.variant_id == variant_id)
        if owner.user_id:
            stmt = stmt.where(CartItem.user_id == owner.user_id)
        else:
            stmt = stmt.where(CartItem.session_id == owner.session_id)

        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()

        # Calculate total quantity (existing + new)
        total_quantity = quantity
        if existing:
            total_quantity += existing.quantity

        if variant.stock < total_quantity:
            raise InsufficientStockError("Insufficient stock")

        if existing:
            existing.quantity = total_quantity
        else:
            cart_item = CartItem(
                user_id=owner.user_id,
                session_id=owner.session_id,
                variant_id=variant_id,
                quantity=quantity,
            )
            db.add(cart_item)

        await db.flush()
        return await CartService.get_cart_items(db, owner)

    @staticmethod
    async def update_item(
        db: AsyncSession,
        owner: CartOwner,
        item_id: int,
        quantity: int,
    ) -> list[CartItem]:
        """Update cart item quantity or remove if quantity <= 0.

        Raises:
            EntityNotFoundError: Cart item does not exist or doesn't belong to owner
            InsufficientStockError: Requested quantity exceeds available stock
        """
        stmt = select(CartItem).options(
            selectinload(CartItem.variant)
        ).where(CartItem.id == item_id)

        if owner.user_id:
            stmt = stmt.where(CartItem.user_id == owner.user_id)
        else:
            stmt = stmt.where(CartItem.session_id == owner.session_id)

        result = await db.execute(stmt)
        cart_item = result.scalar_one_or_none()

        if not cart_item:
            raise EntityNotFoundError("Cart item not found")

        if quantity <= 0:
            await db.delete(cart_item)
        else:
            if cart_item.variant.stock < quantity:
                raise InsufficientStockError("Insufficient stock")
            cart_item.quantity = quantity

        await db.flush()
        return await CartService.get_cart_items(db, owner)

    @staticmethod
    async def remove_item(
        db: AsyncSession,
        owner: CartOwner,
        item_id: int,
    ) -> list[CartItem]:
        """Remove item from cart.

        Raises:
            EntityNotFoundError: Cart item does not exist or doesn't belong to owner
        """
        stmt = select(CartItem).where(CartItem.id == item_id)

        if owner.user_id:
            stmt = stmt.where(CartItem.user_id == owner.user_id)
        else:
            stmt = stmt.where(CartItem.session_id == owner.session_id)

        result = await db.execute(stmt)
        cart_item = result.scalar_one_or_none()

        if not cart_item:
            raise EntityNotFoundError("Cart item not found")

        await db.delete(cart_item)
        await db.flush()
        return await CartService.get_cart_items(db, owner)

    @staticmethod
    async def clear_cart(
        db: AsyncSession,
        owner: CartOwner,
    ) -> None:
        """Remove all items from cart."""
        items = await CartService.get_cart_items(db, owner)
        for item in items:
            await db.delete(item)
        await db.flush()

    @staticmethod
    def calculate_totals(items: list[CartItem]) -> CartSummary:
        """Calculate cart totals from items (pure function, no DB access)."""
        total = Decimal("0.00")
        item_count = 0

        for item in items:
            total += item.variant.price * item.quantity
            item_count += item.quantity

        return CartSummary(item_count=item_count, total=total)

    @staticmethod
    async def validate_stock_for_checkout(
        db: AsyncSession,
        items: list[CartItem],
    ) -> None:
        """Validate all items have sufficient stock for checkout.

        Raises:
            InsufficientStockError: If any item exceeds available stock
        """
        for item in items:
            # Refresh variant to get current stock
            result = await db.execute(
                select(TShirtVariant).where(TShirtVariant.id == item.variant_id)
            )
            variant = result.scalar_one()

            if variant.stock < item.quantity:
                product = item.variant.product
                raise InsufficientStockError(
                    f"Insufficient stock for {product.city_name} ({variant.color}, {variant.size})"
                )
