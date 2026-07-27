"""Pydantic request/response schemas for the interview API."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class StartResponse(BaseModel):
    session_id: str
    opening_message: str
    progress: dict


class MessageRequest(BaseModel):
    text: str
    input_mode: str = "text"


class MessageResponse(BaseModel):
    reply: str
    is_complete: bool
    progress: dict


class SessionResponse(BaseModel):
    session_id: str
    is_complete: bool
    progress: dict
    mentee_id: Optional[str] = None
    profile: Optional[dict] = None


class TranscribeResponse(BaseModel):
    text: str
