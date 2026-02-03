"""Wishlist business logic service.

Follows the static method pattern established by CartService.
All methods accept db: AsyncSession as first parameter.
Services don't commit transactions - caller controls boundaries.
"""

from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..exceptions import (
    AuthorizationError,
    EntityNotFoundError,
)
from ..models import WishlistItem, Product, TShirtVariant


@dataclass
class WishlistOwner:
    """Identifies wishlist owner - either user or guest session."""
    user_id: int | None
    session_id: int | None

    def __post_init__(self):
        if self.user_id is None and self.session_id is None:
            raise AuthorizationError("User or guest session required")


class WishlistService:
    @staticmethod
    async def get_wishlist_items(
        db: AsyncSession,
        owner: WishlistOwner,
    ) -> list[WishlistItem]:
        """Get all wishlist items for the owner with product data loaded."""
        stmt = select(WishlistItem).options(
            selectinload(WishlistItem.product).selectinload(Product.variants)
        )

        if owner.user_id:
            stmt = stmt.where(WishlistItem.user_id == owner.user_id)
        else:
            stmt = stmt.where(WishlistItem.session_id == owner.session_id)

        stmt = stmt.order_by(WishlistItem.created_at.desc())

        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def add_item(
        db: AsyncSession,
        owner: WishlistOwner,
        product_id: int,
    ) -> list[WishlistItem]:
        """Add product to wishlist.

        Raises:
            EntityNotFoundError: Product does not exist
        """
        # Verify product exists
        result = await db.execute(
            select(Product).where(Product.id == product_id)
        )
        product = result.scalar_one_or_none()

        if not product:
            raise EntityNotFoundError("Product not found")

        # Check for existing wishlist item (to avoid constraint violation)
        stmt = select(WishlistItem).where(WishlistItem.product_id == product_id)
        if owner.user_id:
            stmt = stmt.where(WishlistItem.user_id == owner.user_id)
        else:
            stmt = stmt.where(WishlistItem.session_id == owner.session_id)

        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()

        if not existing:
            wishlist_item = WishlistItem(
                user_id=owner.user_id,
                session_id=owner.session_id,
                product_id=product_id,
            )
            db.add(wishlist_item)
            await db.flush()

        return await WishlistService.get_wishlist_items(db, owner)

    @staticmethod
    async def remove_item(
        db: AsyncSession,
        owner: WishlistOwner,
        product_id: int,
    ) -> list[WishlistItem]:
        """Remove product from wishlist.

        Raises:
            EntityNotFoundError: Wishlist item does not exist or doesn't belong to owner
        """
        stmt = select(WishlistItem).where(WishlistItem.product_id == product_id)

        if owner.user_id:
            stmt = stmt.where(WishlistItem.user_id == owner.user_id)
        else:
            stmt = stmt.where(WishlistItem.session_id == owner.session_id)

        result = await db.execute(stmt)
        wishlist_item = result.scalar_one_or_none()

        if not wishlist_item:
            raise EntityNotFoundError("Wishlist item not found")

        await db.delete(wishlist_item)
        await db.flush()
        return await WishlistService.get_wishlist_items(db, owner)

    @staticmethod
    async def check_item(
        db: AsyncSession,
        owner: WishlistOwner,
        product_id: int,
    ) -> tuple[bool, int | None]:
        """Check if product is in wishlist.

        Returns:
            Tuple of (in_wishlist, wishlist_item_id)
        """
        stmt = select(WishlistItem).where(WishlistItem.product_id == product_id)

        if owner.user_id:
            stmt = stmt.where(WishlistItem.user_id == owner.user_id)
        else:
            stmt = stmt.where(WishlistItem.session_id == owner.session_id)

        result = await db.execute(stmt)
        item = result.scalar_one_or_none()

        if item:
            return True, item.id
        return False, None

    @staticmethod
    async def get_count(
        db: AsyncSession,
        owner: WishlistOwner,
    ) -> int:
        """Get count of items in wishlist."""
        stmt = select(func.count(WishlistItem.id))

        if owner.user_id:
            stmt = stmt.where(WishlistItem.user_id == owner.user_id)
        else:
            stmt = stmt.where(WishlistItem.session_id == owner.session_id)

        result = await db.execute(stmt)
        return result.scalar() or 0

    @staticmethod
    async def clear_wishlist(
        db: AsyncSession,
        owner: WishlistOwner,
    ) -> None:
        """Remove all items from wishlist."""
        items = await WishlistService.get_wishlist_items(db, owner)
        for item in items:
            await db.delete(item)
        await db.flush()

    @staticmethod
    async def merge_guest_to_user(
        db: AsyncSession,
        user_id: int,
        session_id: int,
    ) -> None:
        """Merge guest wishlist to user wishlist on login.

        Items in guest wishlist are moved to user's wishlist.
        Duplicates are skipped (user's existing items take precedence).
        """
        # Get guest wishlist items
        guest_stmt = select(WishlistItem).where(
            WishlistItem.session_id == session_id
        )
        result = await db.execute(guest_stmt)
        guest_items = result.scalars().all()

        for guest_item in guest_items:
            # Check if user already has this product
            user_stmt = select(WishlistItem).where(
                WishlistItem.user_id == user_id,
                WishlistItem.product_id == guest_item.product_id,
            )
            result = await db.execute(user_stmt)
            existing = result.scalar_one_or_none()

            if existing:
                # User already has this product, delete guest item
                await db.delete(guest_item)
            else:
                # Move guest item to user
                guest_item.user_id = user_id
                guest_item.session_id = None

        await db.flush()

    @staticmethod
    def calculate_product_info(product: Product) -> dict:
        """Calculate min_price and total_stock for a product."""
        if not product.variants:
            return {"min_price": None, "total_stock": None}

        min_price = min(v.price for v in product.variants)
        total_stock = sum(v.stock for v in product.variants)

        return {"min_price": min_price, "total_stock": total_stock}
