"""Admin product management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ...database import get_db
from ...models import User, Product, TShirtVariant
from ...schemas import VariantUpdate
from ..deps import get_admin_user
from ...services.cache_service import CacheService
from ...utils.csv_export import csv_streaming_response
from ...middleware import limiter

router = APIRouter()

LOW_STOCK_THRESHOLD = 10


@router.get("/export")
async def export_products_csv(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Export products with variants as CSV. One row per variant."""
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.variants))
        .order_by(Product.city_name)
    )
    products = result.scalars().all()

    headers = [
        "product_id", "city_name", "city_name_lv", "is_active",
        "variant_id", "color", "size", "price", "stock", "sku",
    ]
    rows = []
    for p in products:
        for v in p.variants:
            rows.append({
                "product_id": p.id,
                "city_name": p.city_name,
                "city_name_lv": p.city_name_lv or "",
                "is_active": p.is_active,
                "variant_id": v.id,
                "color": v.color,
                "size": v.size,
                "price": str(v.price),
                "stock": v.stock,
                "sku": v.sku or "",
            })

    return csv_streaming_response(rows, headers, "products.csv")


@router.get("")
async def list_products(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List all products with stock information."""
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.variants))
        .order_by(Product.city_name)
        .limit(limit)
        .offset(offset)
    )
    products = result.scalars().all()

    # Get total count
    count_result = await db.execute(select(func.count(Product.id)))
    total = count_result.scalar() or 0

    return {
        "products": [
            {
                "id": product.id,
                "city_name": product.city_name,
                "city_name_lv": product.city_name_lv,
                "is_active": product.is_active,
                "variant_count": len(product.variants),
                "total_stock": sum(v.stock for v in product.variants),
                "low_stock_count": sum(
                    1 for v in product.variants if v.stock < LOW_STOCK_THRESHOLD
                ),
            }
            for product in products
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{product_id}")
async def get_product(
    product_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific product with all variants."""
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.variants))
        .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    return {
        "id": product.id,
        "city_name": product.city_name,
        "city_name_lv": product.city_name_lv,
        "coat_of_arms_image": product.coat_of_arms_image,
        "description": product.description,
        "description_lv": product.description_lv,
        "is_active": product.is_active,
        "variants": [
            {
                "id": variant.id,
                "color": variant.color,
                "size": variant.size,
                "price": variant.price,
                "stock": variant.stock,
                "sku": variant.sku,
            }
            for variant in product.variants
        ],
    }


@router.get("/{product_id}/variants")
async def list_variants(
    product_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all variants for a product."""
    # Verify product exists
    product_result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    if not product_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    result = await db.execute(
        select(TShirtVariant)
        .where(TShirtVariant.product_id == product_id)
        .order_by(TShirtVariant.color, TShirtVariant.size)
    )
    variants = result.scalars().all()

    return [
        {
            "id": variant.id,
            "product_id": variant.product_id,
            "color": variant.color,
            "size": variant.size,
            "price": variant.price,
            "stock": variant.stock,
            "sku": variant.sku,
        }
        for variant in variants
    ]


@router.put("/{product_id}/variants/{variant_id}")
@limiter.limit("30/minute")
async def update_variant(
    request: Request,
    product_id: int,
    variant_id: int,
    data: VariantUpdate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a variant's price or stock."""
    result = await db.execute(
        select(TShirtVariant).where(
            TShirtVariant.id == variant_id,
            TShirtVariant.product_id == product_id,
        )
    )
    variant = result.scalar_one_or_none()

    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variant not found",
        )

    if data.price is not None:
        variant.price = data.price

    if data.stock is not None:
        if data.stock < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stock cannot be negative",
            )
        variant.stock = data.stock

    await db.commit()
    await db.refresh(variant)

    # Invalidate product caches after variant update
    await CacheService.invalidate_products()

    return {
        "id": variant.id,
        "product_id": variant.product_id,
        "color": variant.color,
        "size": variant.size,
        "price": variant.price,
        "stock": variant.stock,
        "sku": variant.sku,
    }


@router.get("/low-stock")
async def list_low_stock(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
    threshold: int = Query(LOW_STOCK_THRESHOLD, ge=0),
):
    """List all variants with low stock."""
    result = await db.execute(
        select(TShirtVariant)
        .options(selectinload(TShirtVariant.product))
        .where(TShirtVariant.stock < threshold)
        .order_by(TShirtVariant.stock)
    )
    variants = result.scalars().all()

    return [
        {
            "id": variant.id,
            "product_id": variant.product_id,
            "product_name": variant.product.city_name,
            "color": variant.color,
            "size": variant.size,
            "price": variant.price,
            "stock": variant.stock,
            "sku": variant.sku,
        }
        for variant in variants
    ]
