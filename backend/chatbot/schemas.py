"""Pydantic schemas for chatbot API requests and responses."""

from pydantic import BaseModel, Field, field_validator


class ChatRequest(BaseModel):
    """Incoming chat request from the React frontend."""

    session_id: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)

    @field_validator("session_id", "message")
    @classmethod
    def must_not_be_blank(cls, value: str) -> str:
        """Reject empty or whitespace-only strings."""
        if not value.strip():
            raise ValueError("Field must not be empty.")
        return value.strip()


class ChatResponse(BaseModel):
    """Chat response returned to the frontend."""

    reply: str
    intent: str

