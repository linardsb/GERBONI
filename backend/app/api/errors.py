from fastapi import APIRouter, Depends, HTTPException, status

from ..error_tracker import error_tracker
from ..models import User
from .deps import get_admin_user

router = APIRouter()


@router.get("/summary")
async def get_error_summary(
    admin: User = Depends(get_admin_user),
):
    """Get aggregated error summary. Admin only."""
    return error_tracker.get_summary()


@router.get("/{fingerprint}")
async def get_error_details(
    fingerprint: str,
    admin: User = Depends(get_admin_user),
):
    """Get specific error group details. Admin only."""
    error = error_tracker.get_error(fingerprint)
    if not error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Error group not found",
        )
    return error


@router.delete("")
async def clear_errors(
    admin: User = Depends(get_admin_user),
):
    """Clear all tracked errors. Admin only."""
    error_tracker.clear()
    return {"status": "cleared"}
