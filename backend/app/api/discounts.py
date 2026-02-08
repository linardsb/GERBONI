"""Public discount code validation endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..schemas import DiscountValidateRequest, DiscountValidateResponse
from ..services import DiscountService
from ..exceptions import DomainException

router = APIRouter()


@router.post("/validate", response_model=DiscountValidateResponse)
async def validate_discount(
    data: DiscountValidateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Validate a discount code and return the discount amount."""
    try:
        discount, amount = await DiscountService.validate_code(
            db, data.code, data.subtotal
        )
        return DiscountValidateResponse(
            valid=True,
            code=discount.code,
            type=discount.type,
            value=discount.value,
            discount_amount=amount,
        )
    except DomainException as e:
        return DiscountValidateResponse(
            valid=False,
            code=data.code,
            message=e.message,
        )
