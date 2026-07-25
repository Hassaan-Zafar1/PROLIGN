"""Common base class for outbound calls to external services.

Every integration (Groq, Slack, anything added later) subclasses
BaseHTTPClient instead of hand-rolling its own httpx.AsyncClient. This is the
ONE place that owns: timeout defaults, header merging, raise-for-status
handling, JSON parsing, and translating transport failures into the common
ExternalServiceError so callers never touch httpx directly.
"""

from __future__ import annotations

import asyncio

import httpx

from core.exceptions import ExternalServiceError, RateLimitError


class BaseHTTPClient:
    """Thin, reusable wrapper around httpx for JSON-speaking HTTP APIs."""

    service_name: str = "external service"
    max_retries: int = 2
    retry_backoff_seconds: float = 1.0

    def __init__(self, timeout: float = 30.0, default_headers: dict | None = None):
        self.timeout = timeout
        self.default_headers = default_headers or {}

    async def _request(
        self,
        method: str,
        url: str,
        *,
        json: dict | None = None,
        headers: dict | None = None,
        params: dict | None = None,
        expect_json: bool = True,
    ) -> dict:
        merged_headers = {**self.default_headers, **(headers or {})}
        attempt = 0

        while True:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.request(
                        method, url, json=json, headers=merged_headers, params=params
                    )
                    response.raise_for_status()
                break
            except httpx.HTTPStatusError as exc:
                status = exc.response.status_code
                if status == 429 and attempt < self.max_retries:
                    # Honor Retry-After if the service sends one; otherwise back off linearly.
                    wait_seconds = float(
                        exc.response.headers.get(
                            "Retry-After", self.retry_backoff_seconds * (attempt + 1)
                        )
                    )
                    await asyncio.sleep(wait_seconds)
                    attempt += 1
                    continue
                if status == 429:
                    raise RateLimitError(
                        self.service_name,
                        f"{self.service_name} rate limit exceeded after {attempt} retries.",
                    ) from exc
                raise ExternalServiceError(
                    self.service_name,
                    f"{self.service_name} returned HTTP {status}.",
                ) from exc
            except httpx.HTTPError as exc:
                raise ExternalServiceError(
                    self.service_name, f"{self.service_name} request failed: {exc}"
                ) from exc

        if not expect_json:
            # Some APIs (e.g. Slack's incoming webhooks) return a plain-text
            # body like "ok" on success, not JSON - forcing response.json()
            # on that would always raise. Callers that don't need a parsed
            # body back should pass expect_json=False.
            return {"raw": response.text}

        if not response.content:
            return {}
        try:
            return response.json()
        except ValueError as exc:
            raise ExternalServiceError(
                self.service_name, f"{self.service_name} returned invalid JSON."
            ) from exc

    async def get(self, url: str, **kwargs) -> dict:
        return await self._request("GET", url, **kwargs)

    async def post(self, url: str, **kwargs) -> dict:
        return await self._request("POST", url, **kwargs)