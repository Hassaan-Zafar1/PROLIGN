"""Write operations against the interview_sessions collection."""

from __future__ import annotations

from core.exceptions import DatabaseError


def save_session(sessions_collection, doc: dict) -> None:
    try:
        sessions_collection.replace_one({"_id": doc["_id"]}, doc, upsert=True)
    except Exception as exc:
        raise DatabaseError("Failed to save interview session.") from exc
