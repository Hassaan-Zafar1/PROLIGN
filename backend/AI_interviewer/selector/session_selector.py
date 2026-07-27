"""Read-only queries against the interview_sessions collection."""

from __future__ import annotations

from core.exceptions import DatabaseError


def find_session(sessions_collection, session_id: str) -> dict | None:
    try:
        return sessions_collection.find_one({"_id": session_id})
    except Exception as exc:
        raise DatabaseError("Failed to load interview session.") from exc
