"""Common exception hierarchy for the AI Interviewer service."""

from __future__ import annotations


class AppError(Exception):
    status_code: int = 500
    default_detail: str = "An unexpected error occurred."

    def __init__(self, detail: str | None = None):
        self.detail = detail or self.default_detail
        super().__init__(self.detail)


class ExternalServiceError(AppError):
    status_code = 502
    default_detail = "An upstream service call failed."

    def __init__(self, service: str, detail: str | None = None):
        self.service = service
        super().__init__(detail or f"{service} request failed.")


class RateLimitError(ExternalServiceError):
    status_code = 429
    default_detail = "The service is receiving too many requests right now. Please try again shortly."


class DatabaseError(AppError):
    status_code = 502
    default_detail = "A database operation failed."


class ValidationError(AppError):
    status_code = 400
    default_detail = "Invalid input."


class NotFoundError(AppError):
    status_code = 404
    default_detail = "Resource not found."
