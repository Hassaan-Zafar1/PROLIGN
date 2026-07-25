"""Write operations against the mentee_profiles collection."""

from __future__ import annotations

from core.exceptions import DatabaseError


def save_profile(profiles_collection, doc: dict) -> None:
    try:
        profiles_collection.replace_one({"_id": doc["session_id"]}, doc, upsert=True)
    except Exception as exc:
        raise DatabaseError("Failed to save mentee profile.") from exc
