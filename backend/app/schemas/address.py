from datetime import datetime
from pydantic import BaseModel, field_validator


class AddressBase(BaseModel):
    name: str
    address_line1: str
    address_line2: str | None = None
    city: str
    postal_code: str
    country: str = "Latvia"
    phone: str | None = None
    label: str | None = None
    is_default: bool = False

    @field_validator("name", "address_line1", "city", "postal_code")
    @classmethod
    def validate_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("This field cannot be empty")
        return v.strip()


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    name: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    postal_code: str | None = None
    country: str | None = None
    phone: str | None = None
    label: str | None = None
    is_default: bool | None = None


class AddressRead(AddressBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
