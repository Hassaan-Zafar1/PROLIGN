"""Read-only queries against the `conversations` collection.

Selectors only ever SELECT. They know MongoDB query shapes and nothing else -
no formatting, no business rules. That lives one layer up in services/.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from core.database import get_db
from core.exceptions import DatabaseError


async def get_recent_messages(
    session_id: str,
    limit: int,
    days: int | None = None,
) -> list[dict]:
    """Return raw conversation documents, newest-first, for a session."""
    db = get_db()
    query: dict = {"session_id": session_id}
    if days is not None:
        cutoff = datetime.now(UTC) - timedelta(days=days)
        query["created_at"] = {"$gte": cutoff}

    try:
        cursor = (
            db.conversations.find(query, {"_id": 0, "role": 1, "content": 1, "created_at": 1})
            .sort("created_at", -1)
            .limit(limit)
        )
        return await cursor.to_list(length=limit)
    except Exception as exc:
        raise DatabaseError("Failed to load conversation history.") from exc
