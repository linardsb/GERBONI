"""Redis caching service with graceful degradation."""

import hashlib
import json
import logging
from datetime import datetime
from decimal import Decimal
from typing import Any

logger = logging.getLogger(__name__)


class _JSONEncoder(json.JSONEncoder):
    """Custom encoder for Decimal and datetime."""

    def default(self, o: Any) -> Any:
        if isinstance(o, Decimal):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)


class CacheService:
    """Redis cache with graceful degradation — all ops are no-ops when Redis is unavailable."""

    PREFIX = "gerboni"
    PRODUCTS_LIST_TTL = 300  # 5 minutes
    PRODUCT_DETAIL_TTL = 600  # 10 minutes

    _redis = None

    @classmethod
    async def init(cls, redis_url: str | None = None) -> None:
        """Initialize Redis connection. Silent no-op if URL is empty or connection fails."""
        if not redis_url:
            logger.info("Redis URL not configured — caching disabled")
            return
        try:
            import redis.asyncio as aioredis

            cls._redis = aioredis.from_url(
                redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
            )
            await cls._redis.ping()
            logger.info("Redis cache connected")
        except Exception as exc:
            logger.warning("Redis connection failed — caching disabled: %s", exc)
            cls._redis = None

    @classmethod
    async def close(cls) -> None:
        if cls._redis:
            await cls._redis.aclose()
            cls._redis = None

    # ── low-level ────────────────────────────────────────────────────

    @classmethod
    async def get(cls, key: str) -> Any | None:
        if not cls._redis:
            return None
        try:
            raw = await cls._redis.get(key)
            if raw is None:
                return None
            return json.loads(raw)
        except Exception as exc:
            logger.warning("Cache GET failed for %s: %s", key, exc)
            return None

    @classmethod
    async def set(cls, key: str, value: Any, ttl: int = 300) -> None:
        if not cls._redis:
            return
        try:
            raw = json.dumps(value, cls=_JSONEncoder)
            await cls._redis.set(key, raw, ex=ttl)
        except Exception as exc:
            logger.warning("Cache SET failed for %s: %s", key, exc)

    @classmethod
    async def delete(cls, key: str) -> None:
        if not cls._redis:
            return
        try:
            await cls._redis.delete(key)
        except Exception as exc:
            logger.warning("Cache DELETE failed for %s: %s", key, exc)

    @classmethod
    async def invalidate_pattern(cls, pattern: str) -> int:
        """Delete all keys matching a pattern. Returns count of deleted keys."""
        if not cls._redis:
            return 0
        try:
            count = 0
            async for key in cls._redis.scan_iter(match=pattern, count=100):
                await cls._redis.delete(key)
                count += 1
            return count
        except Exception as exc:
            logger.warning("Cache invalidate_pattern failed for %s: %s", pattern, exc)
            return 0

    # ── products helpers ─────────────────────────────────────────────

    @classmethod
    def _products_list_key(cls, params: dict) -> str:
        """Generate a cache key from query parameters."""
        # Sort params for consistent hashing
        sorted_params = sorted((k, v) for k, v in params.items() if v is not None)
        param_hash = hashlib.md5(str(sorted_params).encode()).hexdigest()[:12]
        return f"{cls.PREFIX}:products:list:{param_hash}"

    @classmethod
    def _product_detail_key(cls, product_id: int) -> str:
        return f"{cls.PREFIX}:products:{product_id}"

    @classmethod
    async def get_products_list(cls, params: dict) -> list | None:
        return await cls.get(cls._products_list_key(params))

    @classmethod
    async def set_products_list(cls, params: dict, data: list) -> None:
        await cls.set(cls._products_list_key(params), data, cls.PRODUCTS_LIST_TTL)

    @classmethod
    async def get_product_detail(cls, product_id: int) -> dict | None:
        return await cls.get(cls._product_detail_key(product_id))

    @classmethod
    async def set_product_detail(cls, product_id: int, data: dict) -> None:
        await cls.set(cls._product_detail_key(product_id), data, cls.PRODUCT_DETAIL_TTL)

    @classmethod
    async def invalidate_products(cls) -> int:
        """Invalidate all product caches."""
        return await cls.invalidate_pattern(f"{cls.PREFIX}:products:*")
