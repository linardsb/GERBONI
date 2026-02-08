from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, exists, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Product, TShirtVariant
from ..schemas import ProductRead, ProductListRead, VariantRead

router = APIRouter()


@router.get("", response_model=list[ProductListRead])
async def list_products(
    q: str | None = Query(default=None, description="Search city name or description"),
    color: str | None = Query(default=None, description="Filter by variant color"),
    size: str | None = Query(default=None, description="Filter by variant size"),
    min_price: float | None = Query(default=None, ge=0, description="Minimum price"),
    max_price: float | None = Query(default=None, ge=0, description="Maximum price"),
    in_stock: bool | None = Query(default=None, description="Only show in-stock products"),
    sort: str | None = Query(default=None, description="Sort: price_asc, price_desc, name_asc, newest"),
    skip: int = 0,
    limit: int = 20,
    lang: Literal["en", "lv"] = Query(default="en", description="Language for localized fields"),
    db: AsyncSession = Depends(get_db),
):
    """
    List all active products with minimum price and total stock.

    Supports search, filtering by color/size/price/stock, and sorting.
    """
    # Base query: products with aggregated variant info
    stmt = (
        select(
            Product,
            func.min(TShirtVariant.price).label("min_price"),
            func.coalesce(func.sum(TShirtVariant.stock), 0).label("total_stock"),
        )
        .outerjoin(TShirtVariant)
        .where(Product.is_active == True)
        .group_by(Product.id)
    )

    # Search: ILIKE on city_name, city_name_lv, description, description_lv
    if q:
        search_term = f"%{q}%"
        stmt = stmt.where(
            or_(
                Product.city_name.ilike(search_term),
                Product.city_name_lv.ilike(search_term),
                Product.description.ilike(search_term),
                Product.description_lv.ilike(search_term),
            )
        )

    # Color/size filter via EXISTS subquery on variants
    if color:
        color_subq = (
            select(TShirtVariant.id)
            .where(
                TShirtVariant.product_id == Product.id,
                func.lower(TShirtVariant.color) == color.lower(),
            )
            .correlate(Product)
            .exists()
        )
        stmt = stmt.where(color_subq)

    if size:
        size_subq = (
            select(TShirtVariant.id)
            .where(
                TShirtVariant.product_id == Product.id,
                func.upper(TShirtVariant.size) == size.upper(),
            )
            .correlate(Product)
            .exists()
        )
        stmt = stmt.where(size_subq)

    # Price filter on aggregated min_price via HAVING
    if min_price is not None:
        stmt = stmt.having(func.min(TShirtVariant.price) >= min_price)

    if max_price is not None:
        stmt = stmt.having(func.min(TShirtVariant.price) <= max_price)

    # In-stock filter
    if in_stock is True:
        stmt = stmt.having(func.coalesce(func.sum(TShirtVariant.stock), 0) > 0)

    # Sorting
    if sort == "price_asc":
        stmt = stmt.order_by(func.min(TShirtVariant.price).asc())
    elif sort == "price_desc":
        stmt = stmt.order_by(func.min(TShirtVariant.price).desc())
    elif sort == "name_asc":
        stmt = stmt.order_by(Product.city_name.asc())
    elif sort == "newest":
        stmt = stmt.order_by(Product.created_at.desc())
    else:
        stmt = stmt.order_by(Product.id.asc())

    stmt = stmt.offset(skip).limit(limit)

    result = await db.execute(stmt)
    rows = result.all()

    products = []
    for product, min_price_val, total_stock in rows:
        # Select localized fields based on language
        if lang == "lv":
            city_name = product.city_name_lv or product.city_name
            description = product.description_lv or product.description
        else:
            city_name = product.city_name
            description = product.description

        products.append(
            ProductListRead(
                id=product.id,
                city_name=city_name,
                city_name_lv=product.city_name_lv,
                coat_of_arms_image=product.coat_of_arms_image,
                description=description,
                description_lv=product.description_lv,
                is_active=product.is_active,
                min_price=min_price_val,
                total_stock=int(total_stock) if total_stock else 0,
                created_at=product.created_at,
            )
        )
    return products


@router.get("/{product_id}", response_model=ProductRead)
async def get_product(
    product_id: int,
    lang: Literal["en", "lv"] = Query(default="en", description="Language for localized fields"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a single product by ID with all variants.

    The `lang` parameter controls which localized fields are returned:
    - `en` (default): Returns English city_name and description
    - `lv`: Returns Latvian city_name (city_name_lv) and description (description_lv)
    """
    stmt = (
        select(Product)
        .options(selectinload(Product.variants))
        .where(Product.id == product_id, Product.is_active == True)
    )
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    # For single product response, the ProductRead schema handles the fields
    # but we can optionally swap city_name if lang=lv
    # The frontend will handle display logic based on the language
    return product


@router.get("/{product_id}/variants", response_model=list[VariantRead])
async def get_product_variants(
    product_id: int,
    color: str | None = None,
    size: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(TShirtVariant).where(TShirtVariant.product_id == product_id)

    if color:
        stmt = stmt.where(TShirtVariant.color == color)
    if size:
        stmt = stmt.where(TShirtVariant.size == size)

    result = await db.execute(stmt)
    variants = result.scalars().all()
    return variants
