from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "GERBONI"
    debug: bool = False
    api_prefix: str = "/api"

    # Database
    database_url: str = "postgresql+asyncpg://gerboni:gerboni@localhost:5432/gerboni"

    # JWT
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Stripe
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""

    # Anthropic
    anthropic_api_key: str = ""

    # URLs
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"

    # ==========================================================================
    # Security Settings
    # ==========================================================================

    # Password complexity requirements
    password_min_length: int = 8
    password_max_length: int = 128
    password_require_uppercase: bool = True
    password_require_lowercase: bool = True
    password_require_digit: bool = True

    # WebSocket security
    ws_rate_limit_messages: int = 30  # messages per window
    ws_rate_limit_window_seconds: int = 60  # window size
    ws_max_message_size: int = 10 * 1024  # 10KB
    ws_auth_timeout_seconds: int = 30  # seconds to authenticate

    # Trusted hosts (comma-separated for production)
    trusted_hosts: str = "localhost,127.0.0.1"

    # Request size limit
    max_request_size: int = 5 * 1024 * 1024  # 5MB

    # ==========================================================================
    # Observability Settings
    # ==========================================================================

    # Logging
    log_level: str = "INFO"
    log_format: str = "standard"  # "standard" or "json"

    # Performance thresholds (seconds)
    slow_request_threshold: float = 1.0
    very_slow_request_threshold: float = 5.0
    slow_query_threshold: float = 0.5

    # Error tracking
    error_retention_hours: int = 24
    max_tracked_errors: int = 1000

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
