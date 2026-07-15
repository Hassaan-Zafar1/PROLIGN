"""Common exception hierarchy for the ProLign chatbot backend.

Every layer raises one of these instead of fastapi.HTTPException directly.
A single exception handler (see core/error_handlers.py) translates any
AppError into a consistent JSON response, so individual services/selector/
clients never need to know about HTTP status codes.
"""

from __future__ import annotations


class AppError(Exception):
    """Base class for all application errors."""

    status_code: int = 500
    default_detail: str = "An unexpected error occurred."

    def __init__(self, detail: str | None = None):
        self.detail = detail or self.default_detail
        super().__init__(self.detail)


class ExternalServiceError(AppError):
    """Raised when an outbound call to a third-party service fails (Groq, Slack, ...)."""

    status_code = 502
    default_detail = "An upstream service call failed."

    def __init__(self, service: str, detail: str | None = None):
        self.service = service
        super().__init__(detail or f"{service} request failed.")

class RateLimitError(ExternalServiceError):
    """Raised when an external service returns HTTP 429 after retries are exhausted."""
    status_code = 429
    default_detail = "The service is receiving too many requests right now. Please try again shortly."
    
class DatabaseError(AppError):
    """Raised when a MongoDB read or write fails."""

    status_code = 502
    default_detail = "A database operation failed."


class EmbeddingError(AppError):
    """Raised when local embedding generation fails."""

    status_code = 502
    default_detail = "Failed to generate embedding."


class ValidationError(AppError):
    """Raised for bad input that isn't already caught by pydantic."""

    status_code = 400
    default_detail = "Invalid input."


class NotFoundError(AppError):
    status_code = 404
    default_detail = "Resource not found."


class AgentError(AppError):
    """Raised when the intent agent fails to classify or dispatch a tool call."""

    status_code = 502
    default_detail = "The assistant could not process this message."
