from datetime import datetime
from enum import Enum

from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base


class CampaignStatus(str, Enum):
    DRAFT = "draft"
    SENDING = "sending"
    SENT = "sent"
    PARTIAL = "partial"  # some sends failed


class NewsletterCampaign(Base):
    __tablename__ = "newsletter_campaigns"
    __table_args__ = (
        Index("ix_newsletter_campaigns_status", "status"),  # Fix #5: missing index
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    subject: Mapped[str] = mapped_column(String(200))
    intro_text: Mapped[str] = mapped_column(Text)
    featured_product_ids: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array of ints

    status: Mapped[str] = mapped_column(String(20), default=CampaignStatus.DRAFT.value)
    recipient_count: Mapped[int] = mapped_column(Integer, default=0)
    sent_count: Mapped[int] = mapped_column(Integer, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, default=0)

    created_by: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
