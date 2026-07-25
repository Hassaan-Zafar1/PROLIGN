"""Common wrapper around the Groq SDK for both chat completions and Whisper
transcription. This is the ONE place that owns retry-on-429 and translating
groq SDK exceptions into the app's own error hierarchy, so nothing else in
the service touches groq's exception types directly.
"""

from __future__ import annotations

import time

import groq as groq_sdk
from groq import Groq

from core.exceptions import ExternalServiceError, RateLimitError


class GroqClient:
    def __init__(self, api_key: str, max_retries: int = 2, retry_backoff_seconds: float = 1.0):
        self._client = Groq(api_key=api_key)
        self.max_retries = max_retries
        self.retry_backoff_seconds = retry_backoff_seconds

    def _call_with_retry(self, fn, *args, **kwargs):
        attempt = 0
        while True:
            try:
                return fn(*args, **kwargs)
            except groq_sdk.RateLimitError as exc:
                if attempt < self.max_retries:
                    time.sleep(self.retry_backoff_seconds * (attempt + 1))
                    attempt += 1
                    continue
                raise RateLimitError(
                    "Groq", f"Groq rate limit exceeded after {attempt} retries."
                ) from exc
            except groq_sdk.APIStatusError as exc:
                raise ExternalServiceError("Groq", f"Groq returned HTTP {exc.status_code}.") from exc
            except groq_sdk.APIConnectionError as exc:
                raise ExternalServiceError("Groq", f"Groq request failed: {exc}") from exc

    def chat_completion(self, *, model: str, messages: list[dict], max_tokens: int = 1024) -> str:
        response = self._call_with_retry(
            self._client.chat.completions.create,
            model=model,
            max_tokens=max_tokens,
            messages=messages,
        )
        return response.choices[0].message.content

    def transcribe(self, *, model: str, file_bytes: bytes, filename: str) -> str:
        result = self._call_with_retry(
            self._client.audio.transcriptions.create,
            file=(filename, file_bytes),
            model=model,
            response_format="text",
        )
        if isinstance(result, str):
            return result.strip()
        return getattr(result, "text", "").strip()
