"""Intent classification using Groq chat completions."""

from fastapi import HTTPException
import httpx

from config import GROQ_CHAT_COMPLETIONS_URL, settings


SYSTEM_PROMPT = """You are an intent classifier for a mentorship platform chatbot.
Respond with only one word: FAQ, COMPLAINT, SUMMARY, or VOILENCE.

FAQ = questions about the platform, mentorship, bookings, payments, profiles, career guidance, features, how-to, policies, or general follow-up messages.

COMPLAINT = expressions of frustration or dissatisfaction about a specific platform issue, broken features, failed payments, unresolved problems, or requests for human support. The user is unhappy but talking about a real issue with the service.

SUMMARY = requests to summarise, recap, or repeat the current conversation (e.g. "summarise our chat", "what have we discussed", "recap this conversation").

VOILENCE = hate speech, personal insults, derogatory remarks, abusive language, or hostile messages not related to any platform issue. Examples: "i hate you", "you are an idiot", "shut up", "you're useless", swear words directed at the bot or others.

Key distinction: COMPLAINT is about a service problem. VOILENCE is abusive or hateful language regardless of any service context.

When in doubt, respond with FAQ."""


async def classify(message: str) -> str:
    """Classify a user message as FAQ, COMPLAINT, SUMMARY, or VOILENCE."""
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

    if "VOILENCE" in raw_intent:
        return "VOILENCE"
    if "COMPLAINT" in raw_intent:
        return "COMPLAINT"
    if "SUMMARY" in raw_intent:
        return "SUMMARY"
    if "FAQ" in raw_intent:
        return "FAQ"
    return "FAQ"