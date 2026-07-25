"""Slack escalation for complaints, abusive/hostile messages, and
unanswered FAQs - now with email collection built in.

Every escalation is posted to Slack and saved to MongoDB. If the caller
already knows the user's email (passed through from the chat request), it's
attached immediately. If not, the reply asks for it, and the escalation is
saved as "pending" - `try_capture_email()` is called by the agent
orchestrator BEFORE normal intent routing on every subsequent turn, so the
very next message is checked to see if it looks like an email; if so, the
escalation is completed retroactively (Slack posted then, not before).
"""

from __future__ import annotations

import re
from datetime import UTC, datetime

from clients.slack_client import slack_client
from core.config import settings
from repositories import escalation_repository
from selector import escalation_selector

EMAIL_RE = re.compile(r"[^\s@]+@[^\s@]+\.[^\s@]+")

COMPLAINT_REPLY = (
    "I'm sorry to hear you're experiencing an issue. Your complaint has "
    "been escalated to our support team and a team member will follow up "
    "with you shortly."
)

ABUSE_REPLY = (
    "I want to help you, but I need us to keep this conversation respectful. "
    "Please let me know what issue you are facing so we can solve it together."
)

EMAIL_REQUEST_SUFFIX = " Could you also share your email so our team can reach out to you directly?"

EMAIL_THANKS_REPLY = "Thanks - we've got your email on file and our support team will follow up soon!"

_INTENT_HEADERS = {
    "COMPLAINT": "🚨 New Complaint — ProLign AI",
    "VOILENCE": "⚠️ Abusive Message — ProLign AI",
    "FAQ_UNANSWERED": "❓ Unanswered Question — ProLign AI",
}


def is_valid_email(text: str) -> bool:
    return EMAIL_RE.search(text.strip()) is not None


def _extract_email(text: str) -> str:
    """Pulls the actual email address out of a sentence like 'sure, it's
    jane@example.com' - callers must only call this after is_valid_email()
    confirms a match exists."""
    match = EMAIL_RE.search(text.strip())
    return match.group(0) if match else ""


def _build_payload(session_id: str, intent: str, message: str, email: str) -> dict:
    timestamp = datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC")
    header = _INTENT_HEADERS.get(intent, "🔔 Escalation — ProLign AI")
    return {
        "blocks": [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": header, "emoji": True},
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Session ID:*\n`{session_id}`"},
                    {"type": "mrkdwn", "text": f"*Email:*\n{email}"},
                    {"type": "mrkdwn", "text": f"*Time:*\n{timestamp}"},
                ],
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"*Message:*\n>{message}"},
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "Mark Resolved", "emoji": True},
                        "style": "primary",
                        "value": session_id,
                    }
                ],
            },
        ]
    }


async def _finalize(session_id: str, intent: str, message: str, email: str) -> None:
    payload = _build_payload(session_id, intent, message, email)
    await slack_client.send_webhook(settings.slack_complaint_webhook_url, payload)
    await escalation_repository.finalize(session_id, intent, message, email)


async def _escalate(session_id: str, intent: str, message: str, email: str | None, base_reply: str) -> str:
    """Shared path for every escalation type: post to Slack + save if the
    email is already known; otherwise save as pending and ask for it."""
    if email and is_valid_email(email):
        await _finalize(session_id, intent, message, _extract_email(email))
        return base_reply
    await escalation_repository.save_pending(session_id, intent, message)
    return base_reply.rstrip() + EMAIL_REQUEST_SUFFIX


async def try_capture_email(session_id: str, message: str) -> str | None:
    """Call this BEFORE normal intent routing on every turn.

    If this session has a pending escalation awaiting an email, and
    `message` contains something that looks like an email address, finalizes
    the escalation (posts to Slack, saves to MongoDB) and returns a
    thank-you reply. Returns None if there's nothing pending, or the
    message doesn't contain an email - in either case the caller should
    fall through to normal intent handling rather than getting stuck
    waiting.
    """
    pending = await escalation_selector.find_pending(session_id)
    if not pending or not is_valid_email(message):
        return None
    await _finalize(session_id, pending["intent"], pending["message"], _extract_email(message))
    return EMAIL_THANKS_REPLY


async def escalate_complaint(session_id: str, message: str, email: str | None = None) -> str:
    return await _escalate(session_id, "COMPLAINT", message, email, COMPLAINT_REPLY)


async def handle_abusive_message(session_id: str, message: str, email: str | None = None) -> str:
    return await _escalate(session_id, "VOILENCE", message, email, ABUSE_REPLY)


async def escalate_unanswered_faq(
    session_id: str, message: str, email: str | None, base_reply: str
) -> str:
    """Called by faq_service whenever it's about to fall back to 'I don't
    have information on that yet' - makes unanswered questions visible in
    Slack too, not just true complaints, per the same email-collection flow."""
    return await _escalate(session_id, "FAQ_UNANSWERED", message, email, base_reply)