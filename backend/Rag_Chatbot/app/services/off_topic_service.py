"""Handling for messages that fall outside ProLign's domain entirely."""

OFF_TOPIC_REPLY = (
    "I'm ProLign's assistant, so I can only help with questions about the "
    "ProLign platform - things like registration, onboarding, mentor "
    "matching, bookings, payments, sessions, or career guidance. Could you "
    "rephrase your question around one of those topics?"
)

async def handle_off_topic(session_id: str, message: str, email: str | None = None) -> str:
    return OFF_TOPIC_REPLY