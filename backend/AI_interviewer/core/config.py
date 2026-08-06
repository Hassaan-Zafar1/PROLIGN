"""Application configuration for the AI Interviewer service.

Still reads the single backend/.env (one level up from AI_interviewer/),
same as before - just centralized here instead of scattered `os.environ`
reads across interviewer.py/matcher.py/api.py.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

BACKEND_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_ROOT / ".env")


def _required(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


@dataclass(frozen=True)
class Settings:
    groq_api_key: str
    mongo_uri: str
    mongo_db_name: str


settings = Settings(
    groq_api_key=_required("GROQ_API_KEY"),
    # No default. This previously fell back to a hardcoded Atlas connection
    # string containing live credentials, which meant the secret shipped inside
    # every build of this file and a misconfigured environment silently connected
    # to the real cluster instead of failing loudly.
    mongo_uri=_required("MONGO_URI"),
    mongo_db_name=os.getenv("MONGO_DB_NAME", "Prolign"),
)
