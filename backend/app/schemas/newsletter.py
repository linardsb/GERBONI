from datetime import datetime
from pydantic import BaseModel, EmailStr


class NewsletterSubscribe(BaseModel):
    email: EmailStr
    source: str | None = None


class NewsletterUnsubscribe(BaseModel):
    email: EmailStr


class NewsletterRead(BaseModel):
    id: int
    email: str
    is_active: bool
    subscribed_at: datetime
    source: str | None

    class Config:
        from_attributes = True
