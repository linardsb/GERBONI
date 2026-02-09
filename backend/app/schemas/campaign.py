from datetime import datetime
from pydantic import BaseModel, Field


class CampaignCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    subject: str = Field(min_length=1, max_length=200)
    intro_text: str = Field(min_length=1)
    featured_product_ids: list[int] | None = None


class CampaignUpdate(BaseModel):
    title: str | None = None
    subject: str | None = None
    intro_text: str | None = None
    featured_product_ids: list[int] | None = None


class CampaignRead(BaseModel):
    id: int
    title: str
    subject: str
    intro_text: str
    featured_product_ids: list[int] = []
    status: str
    recipient_count: int
    sent_count: int
    failed_count: int
    created_by: int
    created_at: datetime
    sent_at: datetime | None = None

    class Config:
        from_attributes = True
