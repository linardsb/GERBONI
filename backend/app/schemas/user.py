import re
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


class UserCreate(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if len(v) > 128:
            raise ValueError("Password must be at most 128 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserRead(BaseModel):
    id: int
    email: str
    role: str
    is_guest: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GuestSessionCreate(BaseModel):
    email: EmailStr | None = None


class GuestSessionRead(BaseModel):
    id: int
    session_token: str
    email: str | None
    expires_at: datetime

    class Config:
        from_attributes = True


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if len(v) > 128:
            raise ValueError("Password must be at most 128 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v


class MessageResponse(BaseModel):
    message: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if len(v) > 128:
            raise ValueError("Password must be at most 128 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v


# ── 2FA Schemas ──────────────────────────────────────────────────────

class TwoFactorSetupResponse(BaseModel):
    secret: str
    provisioning_uri: str
    qr_code: str  # base64-encoded PNG


class TwoFactorVerifyRequest(BaseModel):
    code: str  # 6-digit TOTP code or 8-char backup code


class TwoFactorBackupCodesResponse(BaseModel):
    backup_codes: list[str]


class LoginResponse(BaseModel):
    access_token: str | None = None
    token_type: str = "bearer"
    requires_2fa: bool = False
    temp_token: str | None = None


class TwoFactorDisableRequest(BaseModel):
    password: str
    code: str  # TOTP code to confirm


# ── Profile Schemas ─────────────────────────────────────────────────

VALID_SIZES = ["XS", "S", "M", "L", "XL", "XXL"]
VALID_COLORS = ["Black", "White", "Red"]
VALID_CITIES = [
    "Riga", "Daugavpils", "Jelgava", "Jekabpils", "Jurmala",
    "Liepaja", "Ogre", "Rezekne", "Valmiera", "Ventspils",
]


class UserProfileRead(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool
    created_at: datetime
    display_name: str | None = None
    phone: str | None = None
    birthday: datetime | None = None
    preferred_size: str | None = None
    preferred_colors: list[str] = []
    preferred_cities: list[str] = []

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    display_name: str | None = None
    phone: str | None = None
    birthday: str | None = None  # ISO date string
    preferred_size: str | None = None
    preferred_colors: list[str] | None = None
    preferred_cities: list[str] | None = None

    @field_validator("preferred_size")
    @classmethod
    def validate_size(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_SIZES:
            raise ValueError(f"Invalid size. Must be one of: {', '.join(VALID_SIZES)}")
        return v

    @field_validator("preferred_colors")
    @classmethod
    def validate_colors(cls, v: list[str] | None) -> list[str] | None:
        if v is not None:
            for color in v:
                if color not in VALID_COLORS:
                    raise ValueError(f"Invalid color '{color}'. Must be one of: {', '.join(VALID_COLORS)}")
        return v

    @field_validator("preferred_cities")
    @classmethod
    def validate_cities(cls, v: list[str] | None) -> list[str] | None:
        if v is not None:
            for city in v:
                if city not in VALID_CITIES:
                    raise ValueError(f"Invalid city '{city}'. Must be one of: {', '.join(VALID_CITIES)}")
        return v
