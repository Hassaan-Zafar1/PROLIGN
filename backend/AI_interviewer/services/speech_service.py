"""Text-to-speech via ElevenLabs (Cassidy voice by default - see core/config.py)."""

from __future__ import annotations

from core.config import settings
from core.elevenlabs_client import ElevenLabsClient

_elevenlabs = ElevenLabsClient(
    api_key=settings.elevenlabs_api_key,
    voice_id=settings.elevenlabs_voice_id,
    model_id=settings.elevenlabs_model,
)


async def synthesize_speech(text: str) -> bytes:
    return await _elevenlabs.synthesize(text)