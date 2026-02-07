"""Product reviews API endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import User
from ..schemas.review import (
    ReviewRead,
    ReviewCreate,
    ReviewUpdate,
    ReviewListResponse,
    ReviewHelpfulResponse,
)
from ..services import ReviewService, ReviewOwner
from ..exceptions import DomainException, domain_to_http
from .deps import get_auth, get_current_user_required, AuthResult

router = APIRouter()


def _format_review(review) -> dict:
    """Format review for API response."""
    return {
        "id": review.id,
        "product_id": review.product_id,
        "user_id": review.user_id,
        "rating": review.rating,
        "title": review.title,
        "content": review.content,
        "is_verified_purchase": review.is_verified_purchase,
        "helpful_count": review.helpful_count,
        "created_at": review.created_at,
        "updated_at": review.updated_at,
        "author_name": ReviewService.mask_email(review.user.email) if review.user else "Anonymous",
    }


@router.get("/products/{product_id}/reviews", response_model=ReviewListResponse)
async def get_product_reviews(
    product_id: int,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Get reviews for a product with pagination and summary."""
    reviews, total = await ReviewService.get_product_reviews(
        db, product_id=product_id, page=page, page_size=page_size
    )
    summary = await ReviewService.get_review_summary(db, product_id)

    return {
        "reviews": [_format_review(r) for r in reviews],
        "total": total,
        "page": page,
        "page_size": page_size,
        "summary": summary,
    }


@router.post("/products/{product_id}/reviews", response_model=ReviewRead)
async def create_review(
    product_id: int,
    data: ReviewCreate,
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    """Create a review for a product. Requires authentication."""
    try:
        owner = ReviewOwner(user_id=user.id)
        review = await ReviewService.create_review(
            db,
            owner=owner,
            product_id=product_id,
            rating=data.rating,
            title=data.title,
            content=data.content,
            order_id=data.order_id,
        )
        await db.commit()

        # Reload with relationships
        await db.refresh(review)
        await db.refresh(review, ["user"])
        return _format_review(review)
    except DomainException as e:
        raise domain_to_http(e)


@router.put("/reviews/{review_id}", response_model=ReviewRead)
async def update_review(
    review_id: int,
    data: ReviewUpdate,
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    """Update your own review."""
    try:
        owner = ReviewOwner(user_id=user.id)
        review = await ReviewService.update_review(
            db,
            owner=owner,
            review_id=review_id,
            rating=data.rating,
            title=data.title,
            content=data.content,
        )
        await db.commit()
        await db.refresh(review)
        await db.refresh(review, ["user"])
        return _format_review(review)
    except DomainException as e:
        raise domain_to_http(e)


@router.delete("/reviews/{review_id}")
async def delete_review(
    review_id: int,
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    """Delete your own review."""
    try:
        owner = ReviewOwner(user_id=user.id)
        await ReviewService.delete_review(db, owner=owner, review_id=review_id)
        await db.commit()
        return {"status": "deleted"}
    except DomainException as e:
        raise domain_to_http(e)


@router.post("/reviews/{review_id}/helpful", response_model=ReviewHelpfulResponse)
async def mark_review_helpful(
    review_id: int,
    auth: AuthResult = Depends(get_auth),
    db: AsyncSession = Depends(get_db),
):
    """Mark a review as helpful. Works for both users and guests."""
    try:
        helpful_count, user_marked = await ReviewService.mark_helpful(
            db,
            review_id=review_id,
            user_id=auth.user_id,
            session_id=auth.session_id,
        )
        await db.commit()
        return {
            "review_id": review_id,
            "helpful_count": helpful_count,
            "user_marked_helpful": user_marked,
        }
    except DomainException as e:
        raise domain_to_http(e)


@router.get("/products/{product_id}/can-review")
async def can_review_product(
    product_id: int,
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    """Check if user can review a product (has purchased it)."""
    can_review, order_id = await ReviewService.can_review_product(
        db, user_id=user.id, product_id=product_id
    )
    return {
        "can_review": can_review,
        "order_id": order_id,
    }
