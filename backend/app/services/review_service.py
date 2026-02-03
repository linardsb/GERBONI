"""Review business logic service."""

from dataclasses import dataclass
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..exceptions import (
    AuthorizationError,
    EntityNotFoundError,
    DomainException,
)
from ..models import Review, ReviewHelpful, Product, Order, OrderItem, TShirtVariant


@dataclass
class ReviewOwner:
    """Identifies review owner."""
    user_id: int | None
    session_id: int | None = None

    def __post_init__(self):
        if self.user_id is None:
            raise AuthorizationError("User authentication required for reviews")


class ReviewService:
    @staticmethod
    async def get_product_reviews(
        db: AsyncSession,
        product_id: int,
        page: int = 1,
        page_size: int = 10,
    ) -> tuple[list[Review], int]:
        """
        Get reviews for a product with pagination.

        Returns:
            Tuple of (reviews, total_count)
        """
        # Get total count
        count_stmt = (
            select(func.count(Review.id))
            .where(
                and_(
                    Review.product_id == product_id,
                    Review.is_approved == True,
                )
            )
        )
        result = await db.execute(count_stmt)
        total = result.scalar() or 0

        # Get paginated reviews
        offset = (page - 1) * page_size
        stmt = (
            select(Review)
            .options(selectinload(Review.user))
            .where(
                and_(
                    Review.product_id == product_id,
                    Review.is_approved == True,
                )
            )
            .order_by(Review.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )

        result = await db.execute(stmt)
        reviews = list(result.scalars().all())

        return reviews, total

    @staticmethod
    async def get_review_summary(
        db: AsyncSession,
        product_id: int,
    ) -> dict:
        """
        Get aggregate review statistics for a product.

        Returns:
            Dict with average_rating, total_reviews, rating_distribution
        """
        # Get rating distribution
        stmt = (
            select(Review.rating, func.count(Review.id))
            .where(
                and_(
                    Review.product_id == product_id,
                    Review.is_approved == True,
                )
            )
            .group_by(Review.rating)
        )
        result = await db.execute(stmt)
        rating_counts = dict(result.all())

        # Calculate totals
        total_reviews = sum(rating_counts.values())
        if total_reviews == 0:
            return {
                "average_rating": 0.0,
                "total_reviews": 0,
                "rating_distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            }

        weighted_sum = sum(rating * count for rating, count in rating_counts.items())
        average_rating = weighted_sum / total_reviews

        # Fill in missing ratings
        rating_distribution = {i: rating_counts.get(i, 0) for i in range(1, 6)}

        return {
            "average_rating": round(average_rating, 1),
            "total_reviews": total_reviews,
            "rating_distribution": rating_distribution,
        }

    @staticmethod
    async def create_review(
        db: AsyncSession,
        owner: ReviewOwner,
        product_id: int,
        rating: int,
        title: str | None = None,
        content: str | None = None,
        order_id: int | None = None,
    ) -> Review:
        """
        Create a new review.

        Raises:
            EntityNotFoundError: Product not found
            DomainException: User already reviewed this product or order doesn't contain product
        """
        # Verify product exists
        result = await db.execute(
            select(Product).where(Product.id == product_id)
        )
        product = result.scalar_one_or_none()
        if not product:
            raise EntityNotFoundError("Product not found")

        # Check for existing review
        result = await db.execute(
            select(Review).where(
                and_(
                    Review.user_id == owner.user_id,
                    Review.product_id == product_id,
                )
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            raise DomainException("You have already reviewed this product")

        # Verify purchase if order_id provided
        is_verified = False
        if order_id:
            # Check that order belongs to user and contains the product
            order_stmt = (
                select(Order)
                .options(
                    selectinload(Order.items).selectinload(OrderItem.variant)
                )
                .where(
                    and_(
                        Order.id == order_id,
                        Order.user_id == owner.user_id,
                    )
                )
            )
            result = await db.execute(order_stmt)
            order = result.scalar_one_or_none()

            if order:
                # Check if order contains this product
                for item in order.items:
                    if item.variant.product_id == product_id:
                        is_verified = True
                        break

        review = Review(
            product_id=product_id,
            user_id=owner.user_id,
            order_id=order_id if is_verified else None,
            rating=rating,
            title=title,
            content=content,
            is_verified_purchase=is_verified,
        )
        db.add(review)
        await db.flush()
        await db.refresh(review)

        return review

    @staticmethod
    async def update_review(
        db: AsyncSession,
        owner: ReviewOwner,
        review_id: int,
        rating: int | None = None,
        title: str | None = None,
        content: str | None = None,
    ) -> Review:
        """
        Update an existing review.

        Raises:
            EntityNotFoundError: Review not found or not owned by user
        """
        result = await db.execute(
            select(Review).where(
                and_(
                    Review.id == review_id,
                    Review.user_id == owner.user_id,
                )
            )
        )
        review = result.scalar_one_or_none()
        if not review:
            raise EntityNotFoundError("Review not found")

        if rating is not None:
            review.rating = rating
        if title is not None:
            review.title = title
        if content is not None:
            review.content = content

        await db.flush()
        return review

    @staticmethod
    async def delete_review(
        db: AsyncSession,
        owner: ReviewOwner,
        review_id: int,
    ) -> None:
        """
        Delete a review.

        Raises:
            EntityNotFoundError: Review not found or not owned by user
        """
        result = await db.execute(
            select(Review).where(
                and_(
                    Review.id == review_id,
                    Review.user_id == owner.user_id,
                )
            )
        )
        review = result.scalar_one_or_none()
        if not review:
            raise EntityNotFoundError("Review not found")

        await db.delete(review)
        await db.flush()

    @staticmethod
    async def mark_helpful(
        db: AsyncSession,
        review_id: int,
        user_id: int | None = None,
        session_id: int | None = None,
    ) -> tuple[int, bool]:
        """
        Mark a review as helpful.

        Returns:
            Tuple of (new_helpful_count, user_marked_helpful)
        """
        if user_id is None and session_id is None:
            raise AuthorizationError("User or guest session required")

        # Get the review
        result = await db.execute(
            select(Review).where(Review.id == review_id)
        )
        review = result.scalar_one_or_none()
        if not review:
            raise EntityNotFoundError("Review not found")

        # Check if already marked helpful
        check_stmt = select(ReviewHelpful).where(ReviewHelpful.review_id == review_id)
        if user_id:
            check_stmt = check_stmt.where(ReviewHelpful.user_id == user_id)
        else:
            check_stmt = check_stmt.where(ReviewHelpful.session_id == session_id)

        result = await db.execute(check_stmt)
        existing = result.scalar_one_or_none()

        if existing:
            # Already marked - return current count
            return review.helpful_count, True

        # Add helpful vote
        helpful = ReviewHelpful(
            review_id=review_id,
            user_id=user_id,
            session_id=session_id,
        )
        db.add(helpful)
        review.helpful_count += 1
        await db.flush()

        return review.helpful_count, True

    @staticmethod
    def mask_email(email: str) -> str:
        """Mask email for public display."""
        if not email or "@" not in email:
            return "Anonymous"

        local, domain = email.split("@", 1)
        if len(local) <= 2:
            masked_local = local[0] + "*"
        else:
            masked_local = local[0] + "*" * (len(local) - 2) + local[-1]

        return f"{masked_local}@{domain}"

    @staticmethod
    async def can_review_product(
        db: AsyncSession,
        user_id: int,
        product_id: int,
    ) -> tuple[bool, int | None]:
        """
        Check if user can review a product (has purchased it).

        Returns:
            Tuple of (can_review, order_id if found)
        """
        # Check if user has an order with this product
        stmt = (
            select(Order.id)
            .join(OrderItem, OrderItem.order_id == Order.id)
            .join(TShirtVariant, TShirtVariant.id == OrderItem.variant_id)
            .where(
                and_(
                    Order.user_id == user_id,
                    TShirtVariant.product_id == product_id,
                    Order.status.in_(["paid", "processing", "shipped", "delivered"]),
                )
            )
            .limit(1)
        )

        result = await db.execute(stmt)
        order_id = result.scalar_one_or_none()

        return order_id is not None, order_id
