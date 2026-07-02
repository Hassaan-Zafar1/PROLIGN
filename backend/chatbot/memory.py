"""Conversation memory stored in MongoDB (prolign.conversations collection).

Document shape:
  session_id : str
  role       : "user" | "assistant"
  content    : str
  intent     : str | None
  created_at : datetime (UTC)
"""

from datetime import UTC, datetime

from fastapi import HTTPException

from database import get_db


async def load_history(session_id: str, limit: int | None = None) -> list[dict]:
    """Load recent conversation history for a session in chronological order."""
    from config import settings
    db = get_db()
    effective_limit = limit or settings.memory_limit

    try:
        cursor = db.conversations.find(
            {"session_id": session_id},
            {"_id": 0, "role": 1, "content": 1, "created_at": 1},
        ).sort("created_at", -1).limit(effective_limit)
        docs = await cursor.to_list(length=effective_limit)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Failed to load conversation history.",
        ) from exc

    history = []
    for doc in reversed(docs):
        if doc.get("role") not in {"user", "assistant"}:
            continue
        created_at = doc.get("created_at")
        history.append({
            "role": doc.get("role"),
            "message": doc.get("content", ""),
            "created_at": created_at.isoformat() if isinstance(created_at, datetime) else "",
        })
    return history


async def save_message(
    session_id: str,
    role: str,
    message: str,
    intent: str | None = None,
) -> None:
    """Save one user or assistant message to the conversations collection."""
    if role not in {"user", "assistant"}:
        raise HTTPException(status_code=400, detail="Invalid conversation role.")

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
        raise HTTPException(
            status_code=502,
            detail="Failed to save conversation history.",
        ) from exc