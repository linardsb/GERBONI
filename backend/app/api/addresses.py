from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Address, User
from ..schemas import AddressCreate, AddressUpdate, AddressRead
from .deps import get_current_user_required

router = APIRouter()


@router.get("", response_model=list[AddressRead])
async def list_addresses(
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    """List all addresses for the current user."""
    result = await db.execute(
        select(Address)
        .where(Address.user_id == user.id)
        .order_by(Address.is_default.desc(), Address.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=AddressRead, status_code=status.HTTP_201_CREATED)
async def create_address(
    data: AddressCreate,
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    """Create a new address for the current user."""
    # If this is the first address or is_default is True, update other addresses
    if data.is_default:
        await _unset_default_addresses(db, user.id)

    # Check if this is the user's first address
    result = await db.execute(
        select(Address).where(Address.user_id == user.id).limit(1)
    )
    is_first_address = result.scalar_one_or_none() is None

    address = Address(
        user_id=user.id,
        name=data.name,
        address_line1=data.address_line1,
        address_line2=data.address_line2,
        city=data.city,
        postal_code=data.postal_code,
        country=data.country,
        phone=data.phone,
        label=data.label,
        is_default=data.is_default or is_first_address,  # First address is always default
    )
    db.add(address)
    await db.commit()
    await db.refresh(address)
    return address


@router.get("/{address_id}", response_model=AddressRead)
async def get_address(
    address_id: int,
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific address by ID."""
    address = await _get_user_address(db, address_id, user.id)
    return address


@router.put("/{address_id}", response_model=AddressRead)
async def update_address(
    address_id: int,
    data: AddressUpdate,
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing address."""
    address = await _get_user_address(db, address_id, user.id)

    # Handle default flag change
    if data.is_default is True and not address.is_default:
        await _unset_default_addresses(db, user.id)

    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(address, field, value)

    await db.commit()
    await db.refresh(address)
    return address


@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_address(
    address_id: int,
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    """Delete an address."""
    address = await _get_user_address(db, address_id, user.id)

    was_default = address.is_default
    await db.delete(address)
    await db.commit()

    # If we deleted the default, make another address default
    if was_default:
        result = await db.execute(
            select(Address)
            .where(Address.user_id == user.id)
            .order_by(Address.created_at.desc())
            .limit(1)
        )
        new_default = result.scalar_one_or_none()
        if new_default:
            new_default.is_default = True
            await db.commit()


@router.post("/{address_id}/set-default", response_model=AddressRead)
async def set_default_address(
    address_id: int,
    user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db),
):
    """Set an address as the default."""
    address = await _get_user_address(db, address_id, user.id)

    await _unset_default_addresses(db, user.id)
    address.is_default = True
    await db.commit()
    await db.refresh(address)
    return address


async def _get_user_address(db: AsyncSession, address_id: int, user_id: int) -> Address:
    """Helper to get an address and verify ownership."""
    result = await db.execute(
        select(Address).where(Address.id == address_id, Address.user_id == user_id)
    )
    address = result.scalar_one_or_none()
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found",
        )
    return address


async def _unset_default_addresses(db: AsyncSession, user_id: int):
    """Helper to unset all default addresses for a user."""
    result = await db.execute(
        select(Address).where(Address.user_id == user_id, Address.is_default == True)
    )
    for address in result.scalars().all():
        address.is_default = False
