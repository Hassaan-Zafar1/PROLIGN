"""Agentic intent routing.

Old flow: intent_classifier.classify() returns a bare string -> main.py
branches with if/else -> each branch manually calls the right module.

New flow: the model is given the full TOOL_SCHEMAS toolbelt and picks
exactly one tool for the message. route() dispatches straight to that tool's
handler and returns its reply. Classification and action collapse into a
single agent turn.

Note on tool_choice: we use "auto" rather than "required" for broadest
compatibility across Groq-hosted models. If DEFAULT_TOOL_NAME's fallback
ever fires more than expected, tool_choice can be tightened once you've
confirmed your chosen model supports "required".
"""

from __future__ import annotations

from services import complaint_service
from agent.tools import DEFAULT_TOOL_NAME, TOOL_REGISTRY, TOOL_SCHEMAS
from clients.groq_client import extract_tool_calls, groq_client
from core.exceptions import AgentError, AppError

SYSTEM_PROMPT = """You are the routing brain for ProLign's mentorship platform assistant.
Given the user's latest message, call exactly one tool that best matches their intent.

Use answer_faq for any question about the ProLign platform itself (registration,
onboarding, bookings, payments, sessions, mentor matching, career guidance, or
general how-to/policy questions) - even if you're not sure the FAQ database
covers it, since answer_faq already has its own fallback for coverage gaps.

Use handle_off_topic when the message has NOTHING to do with ProLign at all:
general knowledge questions, unrelated coding help, small talk, or requests
outside mentorship/bookings/payments/sessions/career guidance. The key test is
the TOPIC, not whether the FAQ database happens to cover it - a ProLign
question with no matching FAQ still goes to answer_faq, not handle_off_topic.

Use escalate_complaint only for a real, specific service problem the user is unhappy about.
Use handle_abusive_message for hostility, insults, or hate speech unrelated to a real issue.
Use summarize_conversation only when the user explicitly asks for a recap or summary.

When in doubt between answer_faq and handle_off_topic, prefer answer_faq."""




async def route(session_id: str, message: str, email: str | None = None) -> tuple[str, str]:

    """Classify the message and execute the matching tool.

    Returns (intent_label, reply_text).
    """
    captured_reply = await complaint_service.try_capture_email(session_id, message)
    if captured_reply:
        return "EMAIL_CAPTURED", captured_reply

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": message},
    ]

    response = await groq_client.chat_completion(
        messages,
        tools=TOOL_SCHEMAS,
        tool_choice="auto",
        max_tokens=30,
        temperature=0,
    )

    tool_calls = extract_tool_calls(response)
    tool_name = tool_calls[0]["name"] if tool_calls else DEFAULT_TOOL_NAME
    if tool_name not in TOOL_REGISTRY:
        tool_name = DEFAULT_TOOL_NAME

    intent_label, handler = TOOL_REGISTRY[tool_name]

    try:
        reply = await handler(session_id, message)
    except AppError:
        # Already a typed, well-formed error (DatabaseError, ExternalServiceError, ...) -
        # let it propagate as-is so the right status/detail reaches the client.
        raise
    except Exception as exc:
        raise AgentError(f"Tool '{tool_name}' failed while handling the message.") from exc

    return intent_label, reply
