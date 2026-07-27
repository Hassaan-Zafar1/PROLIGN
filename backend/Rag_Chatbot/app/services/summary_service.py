"""Conversation summarization. Invoked by the agent's `summarize_conversation` tool."""

from __future__ import annotations

from clients.groq_client import extract_message_content, groq_client
from services import conversation_service

SUMMARY_SYSTEM_PROMPT = """You are ProLign's helpful mentorship assistant.
The user has asked you to summarise the conversation so far.
Write a clear, concise summary of what was discussed, in 3-5 bullet points.
If there is no meaningful conversation yet, say so politely."""


def _format_history(history: list[dict]) -> str:
    lines = [
        f"{'User' if item.get('role') == 'user' else 'Assistant'}: {item.get('message', '')}"
        for item in history
    ]
    return "\n".join(lines) if lines else "No previous conversation."


async def summarize_conversation(
    session_id: str, message: str | None = None, email: str | None = None
) -> str:
    """Summarise the conversation so far. `message` is accepted for a uniform
    tool-handler signature but isn't needed to build the summary."""
    history = await conversation_service.load_history(session_id, limit=50)
    if not history:
        return "There's no conversation to summarise yet. Ask me anything about ProLign!"

    messages = [
        {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"Here is the conversation:\n\n{_format_history(history)}\n\nPlease summarise it.",
        },
    ]
    response = await groq_client.chat_completion(messages, max_tokens=300)
    reply = extract_message_content(response)
    return reply or "I wasn't able to generate a summary. Please try again."
