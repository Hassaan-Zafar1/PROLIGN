"""Groq chat-completions client with API key rotation.

Rotates across multiple API keys (GROQ_API_KEYS) on every call - if a key
comes back rate limited (429), it's cooled down and the request is
immediately retried on the next available key.
"""

from __future__ import annotations

import json

from core.config import GROQ_CHAT_COMPLETIONS_URL, settings
from core.exceptions import ExternalServiceError, RateLimitError
from core.http_client import BaseHTTPClient
from core.key_pool import KeyPool

_key_pool = KeyPool(settings.groq_api_keys)


class GroqClient(BaseHTTPClient):
    service_name = "Groq"
    max_retries = 0  # key rotation below handles rate limits instead of same-key retry

    def __init__(self):
        super().__init__(timeout=45.0)

    async def chat_completion(
        self,
        messages: list[dict],
        *,
        tools: list[dict] | None = None,
        tool_choice: str | dict | None = None,
        max_tokens: int = 512,
        temperature: float = 0.2,
    ) -> dict:
        payload: dict = {
            "model": settings.groq_model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if tools:
            payload["tools"] = tools
        if tool_choice is not None:
            payload["tool_choice"] = tool_choice

        attempts = max(_key_pool.size(), 1)
        last_error: Exception | None = None

        for _ in range(attempts):
            api_key = _key_pool.get_key()
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            try:
                return await self.post(GROQ_CHAT_COMPLETIONS_URL, json=payload, headers=headers)
            except RateLimitError as exc:
                _key_pool.mark_rate_limited(api_key)
                last_error = exc
                continue

        raise last_error or RateLimitError(self.service_name, "All Groq API keys are rate limited.")


def extract_message_content(response: dict) -> str:
    try:
        message = response["choices"][0]["message"]
    except (KeyError, IndexError, TypeError) as exc:
        raise ExternalServiceError("Groq", "Groq response was malformed.") from exc
    content = message.get("content")
    return content.strip() if content else ""


def extract_tool_calls(response: dict) -> list[dict]:
    try:
        message = response["choices"][0]["message"]
    except (KeyError, IndexError, TypeError) as exc:
        raise ExternalServiceError("Groq", "Groq response was malformed.") from exc
    raw_calls = message.get("tool_calls") or []
    calls: list[dict] = []
    for call in raw_calls:
        function = call.get("function", {})
        name = function.get("name")
        if not name:
            continue
        raw_arguments = function.get("arguments") or "{}"
        try:
            arguments = json.loads(raw_arguments) if isinstance(raw_arguments, str) else raw_arguments
        except json.JSONDecodeError:
            arguments = {}
        calls.append({"name": name, "arguments": arguments})
    return calls


groq_client = GroqClient()