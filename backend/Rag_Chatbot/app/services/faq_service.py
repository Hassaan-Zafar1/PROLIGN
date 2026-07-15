"""FAQ RAG answer generation.

Invoked by the agent when it decides the user's message is a platform
question (the `answer_faq` tool in agent/tools.py).
"""

from __future__ import annotations

from clients.groq_client import extract_message_content, groq_client
from core.embedder import embed
from selector import faq_selector
from services import complaint_service, conversation_service
FALLBACK_REPLY = "I don't have information on that yet, but you can reach our support team."

SYSTEM_PROMPT = """You are ProLign's helpful mentorship assistant.
Answer questions only using the provided FAQ context.
Use the conversation history only to understand references, not to invent facts.
If the answer is not in the FAQ context, say:
"I don't have information on that yet, but you can reach our support team."
Be concise, friendly, and student-focused."""


def _format_history(history: list[dict]) -> str:
    lines = [
        f"{'User' if item.get('role') == 'user' else 'Assistant'}: {item.get('message', '')}"
        for item in history
    ]
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


async def answer_faq(session_id: str, message: str, email: str | None = None) -> str:
    """Generate a FAQ answer using vector-retrieved context and recent memory."""
    embedding = await embed(message)
    context_chunks = await faq_selector.search_faqs(embedding)
    if not context_chunks:
        return await complaint_service.escalate_unanswered_faq(session_id, message, email, FALLBACK_REPLY)

    context = _format_context(context_chunks)
    if not context.strip():
        return await complaint_service.escalate_unanswered_faq(session_id, message, email, FALLBACK_REPLY)
    
    history = await conversation_service.load_history(session_id)
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
    response = await groq_client.chat_completion(messages)
    reply = extract_message_content(response)
    return reply or FALLBACK_REPLY
