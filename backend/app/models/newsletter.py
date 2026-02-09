from sqlalchemy import String, Integer, DateTime, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class NewsletterSubscription(Base):
    __tablename__ = "newsletter_subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    subscribed_at = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    unsubscribed_at = mapped_column(DateTime(timezone=True), nullable=True)
    source: Mapped[str | None] = mapped_column(String, nullable=True)  # e.g., "popup", "footer", "checkout"
