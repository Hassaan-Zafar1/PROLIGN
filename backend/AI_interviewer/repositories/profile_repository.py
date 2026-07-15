"""Write operations against the mentee_profiles collection."""

from __future__ import annotations

from core.exceptions import DatabaseError


def save_profile(profiles_collection, doc: dict) -> None:
    """`doc` must already be the fully cleaned, flat profile dict (with
    cleaned_* fields and mentee_experience_years) keyed by session_id -
    see services/interview_service.py."""
    try:
        profiles_collection.replace_one({"_id": doc["session_id"]}, doc, upsert=True)
    except Exception as exc:
        raise DatabaseError("Failed to save mentee profile.") from exc
