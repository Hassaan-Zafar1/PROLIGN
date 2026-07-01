"""RAG response generation for FAQ answers."""

from fastapi import HTTPException
import httpx

import memory
from config import GROQ_CHAT_COMPLETIONS_URL, settings


FALLBACK_REPLY = (
    "I don't have information on that yet, but you can reach our support team."
)

SYSTEM_PROMPT = """You are ProLign's helpful mentorship assistant.
Answer questions only using the provided FAQ context.
Use the conversation history only to understand references, not to invent facts.
If the answer is not in the FAQ context, say:
"I don't have information on that yet, but you can reach our support team."
Be concise, friendly, and student-focused."""

SUMMARY_SYSTEM_PROMPT = """You are ProLign's helpful mentorship assistant.
The user has asked you to summarise the conversation so far.
Write a clear, concise summary of what was discussed, in 3-5 bullet points.
If there is no meaningful conversation yet, say so politely."""


def _format_history(history: list[dict]) -> str:
    lines = []
    for item in history:
        role = "User" if item.get("role") == "user" else "Assistant"
        lines.append(f"{role}: {item.get('message', '')}")
    return "\n".join(lines) if lines else "No previous conversation."


def _format_context(context_chunks: list[dict]) -> str:
    blocks = []
    for chunk in context_chunks:
        question = chunk.get("question", "")
        answer = chunk.get("answer", "")
        if not question and not answer:
            continue
        blocks.append(f"Q: {question}\nA: {answer}")
    return "\n---\n".join(blocks)


async def _call_groq(messages: list[dict], max_tokens: int = 512) -> str:
    """Shared Groq chat completion call."""
    payload = {
        "model": settings.groq_model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.2,
    }
    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                GROQ_CHAT_COMPLETIONS_URL,
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail="Groq request failed.",
        ) from exc

    try:
        reply = data["choices"][0]["message"]["content"]
        return reply.strip() if reply else ""
    except (KeyError, IndexError, TypeError) as exc:
        raise HTTPException(
            status_code=502,
            detail="Groq response was malformed.",
        ) from exc


async def summarise(history: list[dict]) -> str:
    """Summarise the conversation history."""
    if not history:
        return "There's no conversation to summarise yet. Ask me anything about ProLign!"

    messages = [
        {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
        {"role": "user", "content": f"Here is the conversation:\n\n{_format_history(history)}\n\nPlease summarise it."},
    ]
    reply = await _call_groq(messages, max_tokens=300)
    return reply if reply else "I wasn't able to generate a summary. Please try again."


async def answer(session_id: str, message: str, context_chunks: list[dict]) -> str:
    """Generate a FAQ answer using retrieved context and recent memory."""
    if not context_chunks:
        return FALLBACK_REPLY

    context = _format_context(context_chunks)
    if not context.strip():
        return FALLBACK_REPLY

    history = await memory.load_history(session_id)
    user_prompt = f"""Context:
{context}

Conversation so far:
{_format_history(history)}

User:
{message}"""

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]
    reply = await _call_groq(messages)
    return reply if reply else FALLBACK_REPLY
