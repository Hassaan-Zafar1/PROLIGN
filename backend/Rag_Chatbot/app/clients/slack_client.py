"""Slack webhook client, built on the common BaseHTTPClient."""

from __future__ import annotations

from core.http_client import BaseHTTPClient


class SlackClient(BaseHTTPClient):
    service_name = "Slack"

    async def send_webhook(self, webhook_url: str, payload: dict) -> None:
        # expect_json=False: Slack's incoming webhook returns the plain-text
        # body "ok" on success, not JSON. Forcing response.json() on that
        # always raised ExternalServiceError, even though Slack had already
        # posted the message successfully - this is what was producing the
        # 502 / "No response received." on every single escalation.
        await self.post(webhook_url, json=payload, expect_json=False)


slack_client = SlackClient()