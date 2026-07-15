"""Write operations against the escalations collection.

Tracks every complaint, abuse report, and unanswered FAQ that needs human
follow-up, alongside the user's email once we have it. An escalation can
exist in two states:
  - "pending_email": we escalated but don't have an email yet - the agent
    will check the NEXT message to see if it looks like one.
  - "notified": Slack has been posted and the email (if any) is attached.
"""

from __future__ import annotations

from datetime import UTC, datetime

from core.database import get_db
from core.exceptions import DatabaseError


async def save_pending(session_id: str, intent: str, message: str) -> None:
    """Record an escalation that's still waiting on the user's email."""
    db = get_db()
    doc = {
        "session_id": session_id,
        "intent": intent,
        "message": message,
        "email": None,
        "status": "pending_email",
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }
    try:
        await db.escalations.update_one(
            {"session_id": session_id, "status": "pending_email"},
            {"$set": doc},
            upsert=True,
        )
    except Exception as exc:
        raise DatabaseError("Failed to save pending escalation.") from exc


async def finalize(session_id: str, intent: str, message: str, email: str) -> None:
    """Record (or complete) an escalation now that we have the user's email.

    If a pending record exists for this session, completes it in place.
    Otherwise inserts a fresh, already-complete record (the email was known
    up front, so there was never a pending step).
    """
    db = get_db()
    now = datetime.now(UTC)
    try:
        result = await db.escalations.update_one(
            {"session_id": session_id, "status": "pending_email"},
            {
                "$set": {
                    "intent": intent,
                    "message": message,
                    "email": email,
                    "status": "notified",
                    "updated_at": now,
                }
            },
        )
        if result.matched_count == 0:
            await db.escalations.insert_one(
                {
                    "session_id": session_id,
                    "intent": intent,
                    "message": message,
                    "email": email,
                    "status": "notified",
                    "created_at": now,
                    "updated_at": now,
                }
            )
    except Exception as exc:
        raise DatabaseError("Failed to save escalation.") from exc