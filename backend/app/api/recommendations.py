"""Product recommendations API endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..services import RecommendationService

router = APIRouter()


@router.get("/popular")
async def get_popular_products(
    limit: int = Query(default=8, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    """Get popular products based on order history."""
    products = await RecommendationService.get_popular_products(db, limit=limit)
    return [RecommendationService.format_product_with_stats(p) for p in products]


@router.get("/related/{product_id}")
async def get_related_products(
    product_id: int,
    limit: int = Query(default=4, ge=1, le=10),
    db: AsyncSession = Depends(get_db),
):
    """Get products related to a specific product."""
    products = await RecommendationService.get_related_products(
        db, product_id=product_id, limit=limit
    )
    return [RecommendationService.format_product_with_stats(p) for p in products]


@router.get("/frequently-bought-together/{product_id}")
async def get_frequently_bought_together(
    product_id: int,
    limit: int = Query(default=4, ge=1, le=10),
    db: AsyncSession = Depends(get_db),
):
    """Get products frequently bought together with a specific product."""
    products = await RecommendationService.get_frequently_bought_together(
        db, product_id=product_id, limit=limit
    )
    return [RecommendationService.format_product_with_stats(p) for p in products]
