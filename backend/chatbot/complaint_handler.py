"""Slack complaint escalation."""

from datetime import UTC, datetime

from fastapi import HTTPException
import httpx

from config import settings


async def escalate(session_id: str, message: str) -> None:
    """Send a complaint alert to the dedicated Slack complaints channel."""
    timestamp = datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC")
    payload = {
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🚨 New Complaint — ProLign AI",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Session ID:*\n`{session_id}`"},
                    {"type": "mrkdwn", "text": f"*Time:*\n{timestamp}"},
                ]
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"*Message:*\n>{message}"}
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "Mark Resolved", "emoji": True},
                        "style": "primary",
                        "value": session_id
                    }
                ]
            }
        ]
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                settings.slack_complaint_webhook_url,
                json=payload,
            )
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail="Slack complaint escalation failed.",
        ) from exc
