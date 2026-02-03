"""Product recommendation service.

Provides recommendations based on product similarity and popularity.
"""

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models import Product, TShirtVariant, Order, OrderItem, OrderStatus


class RecommendationService:
    @staticmethod
    async def get_related_products(
        db: AsyncSession,
        product_id: int,
        limit: int = 4,
    ) -> list[Product]:
        """
        Get products related to the given product.

        Currently returns other active products (excluding the given one),
        prioritizing those with higher stock availability.
        """
        stmt = (
            select(Product)
            .options(selectinload(Product.variants))
            .where(
                and_(
                    Product.is_active == True,
                    Product.id != product_id,
                )
            )
            .limit(limit)
        )

        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_popular_products(
        db: AsyncSession,
        limit: int = 8,
        exclude_product_ids: list[int] | None = None,
    ) -> list[Product]:
        """
        Get popular products based on order history.

        Returns products ordered by the number of times they've been ordered
        (in paid/processing/shipped/delivered orders).
        """
        # Subquery to count orders per product
        popular_statuses = [
            OrderStatus.PAID.value,
            OrderStatus.PROCESSING.value,
            OrderStatus.SHIPPED.value,
            OrderStatus.DELIVERED.value,
        ]

        order_count_subq = (
            select(
                TShirtVariant.product_id,
                func.sum(OrderItem.quantity).label("order_count"),
            )
            .join(OrderItem, OrderItem.variant_id == TShirtVariant.id)
            .join(Order, Order.id == OrderItem.order_id)
            .where(Order.status.in_(popular_statuses))
            .group_by(TShirtVariant.product_id)
            .subquery()
        )

        stmt = (
            select(Product)
            .options(selectinload(Product.variants))
            .outerjoin(order_count_subq, order_count_subq.c.product_id == Product.id)
            .where(Product.is_active == True)
        )

        if exclude_product_ids:
            stmt = stmt.where(Product.id.notin_(exclude_product_ids))

        stmt = stmt.order_by(
            order_count_subq.c.order_count.desc().nullslast(),
            Product.created_at.desc(),
        ).limit(limit)

        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_frequently_bought_together(
        db: AsyncSession,
        product_id: int,
        limit: int = 4,
    ) -> list[Product]:
        """
        Get products that are frequently bought together with the given product.

        Finds orders containing the given product and returns other products
        from those same orders, ranked by frequency.
        """
        # Find order IDs that contain the given product
        orders_with_product = (
            select(OrderItem.order_id)
            .join(TShirtVariant, TShirtVariant.id == OrderItem.variant_id)
            .where(TShirtVariant.product_id == product_id)
            .subquery()
        )

        # Find other products in those orders, with count
        co_purchased = (
            select(
                TShirtVariant.product_id,
                func.count(TShirtVariant.product_id).label("co_purchase_count"),
            )
            .join(OrderItem, OrderItem.variant_id == TShirtVariant.id)
            .where(
                and_(
                    OrderItem.order_id.in_(select(orders_with_product)),
                    TShirtVariant.product_id != product_id,
                )
            )
            .group_by(TShirtVariant.product_id)
            .subquery()
        )

        stmt = (
            select(Product)
            .options(selectinload(Product.variants))
            .join(co_purchased, co_purchased.c.product_id == Product.id)
            .where(Product.is_active == True)
            .order_by(co_purchased.c.co_purchase_count.desc())
            .limit(limit)
        )

        result = await db.execute(stmt)
        products = list(result.scalars().all())

        # If not enough co-purchased products, fill with related products
        if len(products) < limit:
            additional = await RecommendationService.get_related_products(
                db,
                product_id,
                limit=limit - len(products),
            )
            existing_ids = {p.id for p in products}
            for p in additional:
                if p.id not in existing_ids:
                    products.append(p)

        return products[:limit]

    @staticmethod
    def format_product_with_stats(product: Product) -> dict:
        """Format product with calculated min_price and total_stock."""
        min_price = None
        total_stock = 0

        if product.variants:
            min_price = min(v.price for v in product.variants)
            total_stock = sum(v.stock for v in product.variants)

        return {
            "id": product.id,
            "city_name": product.city_name,
            "city_name_lv": product.city_name_lv,
            "coat_of_arms_image": product.coat_of_arms_image,
            "description": product.description,
            "min_price": min_price,
            "total_stock": total_stock,
        }
