"""Write operations against the `conversations` collection.

Repositories only ever mutate state (insert/update/delete). Reads live in
selector/ instead, so it's always obvious from the import which kind of
operation a piece of code is doing.
"""

from __future__ import annotations

from datetime import UTC, datetime

from core.database import get_db
from core.exceptions import DatabaseError, ValidationError

VALID_ROLES = {"user", "assistant"}


async def insert_message(
    session_id: str,
    role: str,
    message: str,
    intent: str | None = None,
) -> None:
    """Persist one user or assistant message."""
    if role not in VALID_ROLES:
        raise ValidationError("Invalid conversation role.")

    db = get_db()
    doc: dict = {
        "session_id": session_id,
        "role": role,
        "content": message,
        "created_at": datetime.now(UTC),
    }
    if intent is not None:
        doc["intent"] = intent

    try:
        await db.conversations.insert_one(doc)
    except Exception as exc:
        raise DatabaseError("Failed to save conversation history.") from exc
