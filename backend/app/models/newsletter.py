from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean

from ..database import Base


class NewsletterSubscription(Base):
    __tablename__ = "newsletter_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    subscribed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    unsubscribed_at = Column(DateTime, nullable=True)
    source = Column(String, nullable=True)  # e.g., "popup", "footer", "checkout"
