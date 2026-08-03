"""Unit tests for the pure-logic pieces underneath the Groq/Slack clients —
core/http_client.py's retry/error-mapping and core/key_pool.py's rotation.
The higher-level route tests (test_routes.py) mock groq_client/slack_client
entirely to avoid real network calls, which means this logic never runs
there; these tests exercise it directly with respx mocking the HTTP
transport, still with zero real network calls.
"""
import httpx
import pytest
import respx

from core.exceptions import ExternalServiceError, RateLimitError
from core.http_client import BaseHTTPClient
from core.key_pool import KeyPool


class TestKeyPool:
    def test_rejects_an_empty_key_list(self):
        with pytest.raises(ValueError):
            KeyPool([])

    def test_round_robins_through_keys(self):
        pool = KeyPool(["a", "b", "c"])
        assert [pool.get_key() for _ in range(4)] == ["a", "b", "c", "a"]

    def test_size_reports_the_key_count(self):
        assert KeyPool(["a", "b"]).size() == 2

    def test_a_rate_limited_key_is_skipped_until_cooldown_expires(self):
        pool = KeyPool(["a", "b"], cooldown_seconds=1000)
        pool.get_key()  # "a"
        pool.mark_rate_limited("a")
        # "b" is next in the cycle regardless, but since "a" is cooling down
        # every subsequent draw should skip it.
        for _ in range(4):
            assert pool.get_key() == "b"

    def test_falls_back_to_the_soonest_expiring_key_when_all_are_cooling_down(self):
        pool = KeyPool(["a", "b"], cooldown_seconds=1000)
        pool.mark_rate_limited("a", cooldown_seconds=500)
        pool.mark_rate_limited("b", cooldown_seconds=1000)
        assert pool.get_key() == "a"  # expires sooner


class ConcreteClient(BaseHTTPClient):
    service_name = "TestService"
    max_retries = 1
    retry_backoff_seconds = 0.01


@pytest.mark.respx(base_url="https://example.test")
class TestBaseHTTPClient:
    async def test_successful_post_returns_parsed_json(self, respx_mock):
        respx_mock.post("/ok").mock(return_value=httpx.Response(200, json={"hello": "world"}))
        client = ConcreteClient()
        result = await client.post("https://example.test/ok", json={})
        assert result == {"hello": "world"}

    async def test_expect_json_false_returns_raw_text(self, respx_mock):
        respx_mock.post("/webhook").mock(return_value=httpx.Response(200, text="ok"))
        client = ConcreteClient()
        result = await client.post("https://example.test/webhook", json={}, expect_json=False)
        assert result == {"raw": "ok"}

    async def test_empty_body_returns_empty_dict(self, respx_mock):
        respx_mock.post("/empty").mock(return_value=httpx.Response(204))
        client = ConcreteClient()
        result = await client.post("https://example.test/empty", json={})
        assert result == {}

    async def test_invalid_json_body_raises_external_service_error(self, respx_mock):
        respx_mock.post("/bad-json").mock(return_value=httpx.Response(200, text="not json", headers={"content-type": "application/json"}))
        client = ConcreteClient()
        with pytest.raises(ExternalServiceError):
            await client.post("https://example.test/bad-json", json={})

    async def test_non_429_error_status_raises_external_service_error(self, respx_mock):
        respx_mock.post("/error").mock(return_value=httpx.Response(500))
        client = ConcreteClient()
        with pytest.raises(ExternalServiceError):
            await client.post("https://example.test/error", json={})

    async def test_429_retries_then_raises_rate_limit_error_once_exhausted(self, respx_mock):
        respx_mock.post("/limited").mock(return_value=httpx.Response(429, headers={"Retry-After": "0"}))
        client = ConcreteClient()  # max_retries=1 -> 2 attempts total, both 429
        with pytest.raises(RateLimitError):
            await client.post("https://example.test/limited", json={})

    async def test_429_then_success_recovers_within_the_retry_budget(self, respx_mock):
        route = respx_mock.post("/flaky")
        route.side_effect = [
            httpx.Response(429, headers={"Retry-After": "0"}),
            httpx.Response(200, json={"ok": True}),
        ]
        client = ConcreteClient()
        result = await client.post("https://example.test/flaky", json={})
        assert result == {"ok": True}

    async def test_transport_level_failure_raises_external_service_error(self, respx_mock):
        respx_mock.post("/down").mock(side_effect=httpx.ConnectError("connection refused"))
        client = ConcreteClient()
        with pytest.raises(ExternalServiceError):
            await client.post("https://example.test/down", json={})
