"""Application configuration for the ProLign chatbot backend."""

from dataclasses import dataclass
import os

from dotenv import load_dotenv

load_dotenv()


GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"


def _required(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def _float_env(name: str, default: float) -> float:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    try:
        return float(raw_value)
    except ValueError as exc:
        raise RuntimeError(f"Environment variable {name} must be a float.") from exc


def _int_env(name: str, default: int) -> int:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    try:
        return int(raw_value)
    except ValueError as exc:
        raise RuntimeError(f"Environment variable {name} must be an integer.") from exc


@dataclass(frozen=True)
class Settings:
    """Validated runtime settings loaded from environment variables."""

    groq_api_key: str
    mongodb_uri: str
    mongodb_db_name: str
    slack_webhook_url: str
    slack_complaint_webhook_url: str
    groq_model: str
    faq_match_threshold: float
    faq_match_count: int
    memory_limit: int
    frontend_origin: str


settings = Settings(
    groq_api_key=_required("GROQ_API_KEY"),
    mongodb_uri=_required("MONGODB_URI"),
    mongodb_db_name=os.getenv("MONGODB_DB_NAME", "prolign"),
    slack_webhook_url=_required("SLACK_WEBHOOK_URL"),
    slack_complaint_webhook_url=_required("SLACK_COMPLAINT_WEBHOOK_URL"),
    groq_model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
    faq_match_threshold=_float_env("FAQ_MATCH_THRESHOLD", 0.4),
    faq_match_count=_int_env("FAQ_MATCH_COUNT", 3),
    memory_limit=_int_env("MEMORY_LIMIT", 6),
    frontend_origin=os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"),
)
