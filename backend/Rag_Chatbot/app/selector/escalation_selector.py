"""Read-only queries against the escalations collection."""

from __future__ import annotations

from core.database import get_db
from core.exceptions import DatabaseError


async def find_pending(session_id: str) -> dict | None:
    """Return the pending (email-awaiting) escalation for this session, if any."""
    db = get_db()
    try:
        return await db.escalations.find_one(
            {"session_id": session_id, "status": "pending_email"}
        )
    except Exception as exc:
        raise DatabaseError("Failed to check pending escalation.") from exc