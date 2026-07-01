"""Intent classification using Groq chat completions."""

from fastapi import HTTPException
import httpx

from config import GROQ_CHAT_COMPLETIONS_URL, settings


SYSTEM_PROMPT = """You are an intent classifier for a mentorship platform chatbot.
Respond with only one word: FAQ, COMPLAINT, or SUMMARY.

FAQ = questions about the platform, mentorship, bookings, payments, profiles, career guidance, features, how-to, policies, or general follow-up messages.
COMPLAINT = expressions of anger, frustration, dissatisfaction, broken features, failed payments, unresolved issues, or requests for human support.
SUMMARY = requests to summarise, recap, or repeat the current conversation (e.g. "summarise our chat", "what have we discussed", "recap this conversation").

When in doubt, respond with FAQ."""


async def classify(message: str) -> str:
    """Classify a user message as FAQ, COMPLAINT, or SUMMARY."""
    payload = {
        "model": settings.groq_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": message},
        ],
        "max_tokens": 5,
        "temperature": 0,
    }
    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
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
            detail="Groq intent classification failed.",
        ) from exc

    try:
        raw_intent = data["choices"][0]["message"]["content"].strip().upper()
    except (KeyError, IndexError, TypeError) as exc:
        raise HTTPException(
            status_code=502,
            detail="Groq intent classification returned an invalid response.",
        ) from exc

    if "COMPLAINT" in raw_intent:
        return "COMPLAINT"
    if "SUMMARY" in raw_intent:
        return "SUMMARY"
    if "FAQ" in raw_intent:
        return "FAQ"
    return "FAQ"
