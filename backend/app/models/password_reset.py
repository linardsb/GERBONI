import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, func
from sqlalchemy.orm import relationship

from ..database import Base


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, nullable=False, index=True, default=lambda: secrets.token_urlsafe(32))
    expires_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc) + timedelta(hours=1))
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", backref="password_reset_tokens")
