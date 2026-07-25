"""Business logic for conversation memory.

This is the only layer the API/agent should talk to for conversation
history - it hides whether a read goes through a selector or a write goes
through a repository.
"""

from __future__ import annotations

from core.config import settings
from repositories import conversation_repository
from selector import conversation_selector


def _to_history_item(doc: dict) -> dict:
    created_at = doc.get("created_at")
    return {
        "role": doc.get("role"),
        "message": doc.get("content", ""),
        "created_at": created_at.isoformat() if hasattr(created_at, "isoformat") else "",
    }


async def load_history(
    session_id: str,
    limit: int | None = None,
    days: int | None = None,
) -> list[dict]:
    """Load conversation history for a session, oldest first."""
    effective_limit = limit or settings.memory_limit
    docs = await conversation_selector.get_recent_messages(session_id, effective_limit, days)
    return [
        _to_history_item(doc)
        for doc in reversed(docs)
        if doc.get("role") in {"user", "assistant"}
    ]


async def save_message(
    session_id: str,
    role: str,
    message: str,
    intent: str | None = None,
) -> None:
    """Save one user or assistant message."""
    await conversation_repository.insert_message(session_id, role, message, intent)
