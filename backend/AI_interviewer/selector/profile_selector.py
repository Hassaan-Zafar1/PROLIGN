"""Read-only queries against the mentee_profiles collection."""

from __future__ import annotations

from core.exceptions import DatabaseError


def find_all_profiles(profiles_collection) -> list[dict]:
    try:
        return list(profiles_collection.find({}, {"_id": 0}))
    except Exception as exc:
        raise DatabaseError("Failed to load mentee profiles.") from exc
