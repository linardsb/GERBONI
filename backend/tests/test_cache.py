"""Tests for CacheService — uses mocked Redis."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.cache_service import CacheService, _JSONEncoder


# ── JSONEncoder ──────────────────────────────────────────────────────


class TestJSONEncoder:
    def test_decimal(self):
        from decimal import Decimal

        result = json.dumps({"price": Decimal("29.99")}, cls=_JSONEncoder)
        assert '"29.99"' in result

    def test_datetime(self):
        from datetime import datetime

        dt = datetime(2026, 1, 15, 12, 0, 0)
        result = json.dumps({"ts": dt}, cls=_JSONEncoder)
        assert "2026-01-15T12:00:00" in result

    def test_fallback(self):
        with pytest.raises(TypeError):
            json.dumps({"x": object()}, cls=_JSONEncoder)


# ── CacheService with no Redis ───────────────────────────────────────


class TestCacheServiceNoRedis:
    """All operations should silently no-op when Redis is unavailable."""

    @pytest.fixture(autouse=True)
    def _reset(self):
        CacheService._redis = None
        yield
        CacheService._redis = None

    @pytest.mark.asyncio
    async def test_init_without_url(self):
        await CacheService.init(None)
        assert CacheService._redis is None

    @pytest.mark.asyncio
    async def test_init_with_empty_url(self):
        await CacheService.init("")
        assert CacheService._redis is None

    @pytest.mark.asyncio
    async def test_get_returns_none(self):
        assert await CacheService.get("anything") is None

    @pytest.mark.asyncio
    async def test_set_noop(self):
        await CacheService.set("key", {"data": 1})  # should not raise

    @pytest.mark.asyncio
    async def test_delete_noop(self):
        await CacheService.delete("key")

    @pytest.mark.asyncio
    async def test_invalidate_pattern_returns_zero(self):
        assert await CacheService.invalidate_pattern("*") == 0

    @pytest.mark.asyncio
    async def test_products_list_returns_none(self):
        assert await CacheService.get_products_list({"q": "test"}) is None

    @pytest.mark.asyncio
    async def test_close_noop(self):
        await CacheService.close()


# ── CacheService with mocked Redis ──────────────────────────────────


class TestCacheServiceWithRedis:
    @pytest.fixture(autouse=True)
    def _mock_redis(self):
        self.mock_redis = AsyncMock()
        CacheService._redis = self.mock_redis
        yield
        CacheService._redis = None

    @pytest.mark.asyncio
    async def test_get_hit(self):
        self.mock_redis.get.return_value = json.dumps({"id": 1, "name": "test"})
        result = await CacheService.get("key")
        assert result == {"id": 1, "name": "test"}

    @pytest.mark.asyncio
    async def test_get_miss(self):
        self.mock_redis.get.return_value = None
        result = await CacheService.get("key")
        assert result is None

    @pytest.mark.asyncio
    async def test_get_error_returns_none(self):
        self.mock_redis.get.side_effect = Exception("connection lost")
        result = await CacheService.get("key")
        assert result is None

    @pytest.mark.asyncio
    async def test_set(self):
        await CacheService.set("key", {"data": 1}, ttl=60)
        self.mock_redis.set.assert_called_once()
        call_args = self.mock_redis.set.call_args
        assert call_args[0][0] == "key"
        assert call_args[1]["ex"] == 60

    @pytest.mark.asyncio
    async def test_set_error_silent(self):
        self.mock_redis.set.side_effect = Exception("connection lost")
        await CacheService.set("key", {"data": 1})  # should not raise

    @pytest.mark.asyncio
    async def test_delete(self):
        await CacheService.delete("key")
        self.mock_redis.delete.assert_called_once_with("key")

    @pytest.mark.asyncio
    async def test_delete_error_silent(self):
        self.mock_redis.delete.side_effect = Exception("connection lost")
        await CacheService.delete("key")  # should not raise

    @pytest.mark.asyncio
    async def test_invalidate_pattern(self):
        # scan_iter returns an async iterator
        self.mock_redis.scan_iter = lambda **kwargs: _async_iter(["k1", "k2", "k3"])
        count = await CacheService.invalidate_pattern("gerboni:products:*")
        assert count == 3
        assert self.mock_redis.delete.call_count == 3

    @pytest.mark.asyncio
    async def test_invalidate_pattern_error(self):
        def _raise(**kwargs):
            raise Exception("fail")
        self.mock_redis.scan_iter = _raise
        count = await CacheService.invalidate_pattern("*")
        assert count == 0

    @pytest.mark.asyncio
    async def test_products_list_roundtrip(self):
        data = [{"id": 1}, {"id": 2}]
        await CacheService.set_products_list({"q": "riga"}, data)
        self.mock_redis.set.assert_called_once()

    @pytest.mark.asyncio
    async def test_product_detail_key(self):
        key = CacheService._product_detail_key(42)
        assert key == "gerboni:products:42"

    @pytest.mark.asyncio
    async def test_invalidate_products(self):
        self.mock_redis.scan_iter = lambda **kwargs: _async_iter(["gerboni:products:1"])
        count = await CacheService.invalidate_products()
        assert count == 1

    @pytest.mark.asyncio
    async def test_close(self):
        await CacheService.close()
        self.mock_redis.aclose.assert_called_once()
        assert CacheService._redis is None

    @pytest.mark.asyncio
    async def test_init_success(self):
        CacheService._redis = None
        mock_redis_instance = AsyncMock()
        mock_redis_instance.ping = AsyncMock()

        with patch("app.services.cache_service.CacheService._redis", None):
            with patch.dict("sys.modules", {}):
                import redis.asyncio as aioredis
                with patch.object(aioredis, "from_url", return_value=mock_redis_instance):
                    await CacheService.init("redis://localhost:6379/0")

    @pytest.mark.asyncio
    async def test_init_connection_failure(self):
        CacheService._redis = None
        with patch("redis.asyncio.from_url", side_effect=Exception("refused")):
            await CacheService.init("redis://bad-host:6379/0")
        assert CacheService._redis is None


# ── Helper ───────────────────────────────────────────────────────────


async def _async_iter(items):
    for item in items:
        yield item
