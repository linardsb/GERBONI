"""Pydantic schemas for review operations."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ReviewAuthor(BaseModel):
    """Author info for review display."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str  # Will be partially masked in API response


class ReviewRead(BaseModel):
    """Review response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    user_id: int
    rating: int
    title: str | None
    content: str | None
    is_verified_purchase: bool
    helpful_count: int
    created_at: datetime
    updated_at: datetime
    author_name: str  # Masked email or display name


class ReviewCreate(BaseModel):
    """Request to create a review."""

    rating: int = Field(ge=1, le=5, description="Rating from 1 to 5")
    title: str | None = Field(default=None, max_length=200)
    content: str | None = Field(default=None, max_length=2000)
    order_id: int | None = Field(
        default=None,
        description="Order ID to verify purchase (optional but enables verified badge)",
    )


class ReviewUpdate(BaseModel):
    """Request to update a review."""

    rating: int | None = Field(default=None, ge=1, le=5)
    title: str | None = Field(default=None, max_length=200)
    content: str | None = Field(default=None, max_length=2000)


class ReviewSummary(BaseModel):
    """Aggregate review statistics for a product."""

    average_rating: float
    total_reviews: int
    rating_distribution: dict[int, int]  # {1: count, 2: count, ...}


class ReviewListResponse(BaseModel):
    """Paginated review list response."""

    reviews: list[ReviewRead]
    total: int
    page: int
    page_size: int
    summary: ReviewSummary


class ReviewHelpfulResponse(BaseModel):
    """Response after marking a review as helpful."""

    review_id: int
    helpful_count: int
    user_marked_helpful: bool
