"""Tool definitions the intent agent can invoke.

This replaces the old classify-then-if/else approach: instead of getting back
a bare string like "FAQ" and branching in main.py, we hand Groq a fixed
toolbelt (TOOL_SCHEMAS) and let the model call exactly one tool. The
orchestrator (agent/orchestrator.py) then dispatches to the matching handler
below - classification and action happen in a single agentic step.

Each tool schema intentionally takes no model-supplied arguments: the model's
only job is to PICK a tool, not fill in parameters. session_id/message are
threaded through by the orchestrator itself, since it already has them.
"""

from __future__ import annotations



from services import complaint_service, faq_service, summary_service, off_topic_service

TOOL_SCHEMAS: list[dict] = [
    {
        "type": "function",
        "function": {
            "name": "answer_faq",
            "description": (
                "Answer a question about the ProLign platform: registration, "
                "onboarding, mentor matching, bookings, payments, sessions, "
                "career guidance, or any general how-to/policy question."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "escalate_complaint",
            "description": (
                "Escalate a user complaint about a real platform problem: a "
                "broken feature, a failed payment, an unresolved issue, or an "
                "explicit request for human support. The user is unhappy about "
                "a genuine service problem, not just being rude."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "handle_off_topic",
            "description": (
                "Handle a message that has NOTHING to do with ProLign at all - "
                "general knowledge questions, unrelated coding help, small "
                "talk, or any request outside mentorship/bookings/payments/"
                "sessions/career guidance."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "handle_abusive_message",
            "description": (
                "Handle hate speech, personal insults, or hostile/abusive "
                "language directed at the assistant or others, when it is NOT "
                "tied to a real platform issue."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "summarize_conversation",
            "description": (
                "Summarise, recap, or repeat back the conversation so far, "
                "only when the user explicitly asks for a summary/recap of "
                "what's been discussed."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
]

# tool name -> (intent label stored in memory, async handler(session_id, message) -> str)
TOOL_REGISTRY = {
    "answer_faq": ("FAQ", faq_service.answer_faq),
    "escalate_complaint": ("COMPLAINT", complaint_service.escalate_complaint),
    "handle_abusive_message": ("VOILENCE", complaint_service.handle_abusive_message),
    "summarize_conversation": ("SUMMARY", summary_service.summarize_conversation),
    "handle_off_topic": ("OFF_TOPIC", off_topic_service.handle_off_topic),
}

DEFAULT_TOOL_NAME = "answer_faq"
