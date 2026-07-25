"""Interview service - the business logic layer for the AI interview flow.

Replaces the old InterviewOrchestrator + MongoSessionStore (which mixed
Mongo I/O, Groq calls, and business rules together). Now:
  - core.database / core.groq_client own the raw connections
  - selector/repositories own the Mongo reads/writes
  - domain.models owns the pure logic (prompt, phase rules, extraction)
  - this module is what api/routes.py actually talks to
"""

from __future__ import annotations

import csv
import io
import re
import sys
from dataclasses import asdict
from pathlib import Path
from typing import Optional

from core.config import settings
from core.database import get_db
from core.groq_client import GroqClient
from domain.models import (
    CHAT_MODEL,
    CSV_FIELDS,
    SYSTEM_PROMPT,
    WHISPER_MODEL,
    InterviewSession,
    MenteeProfile,
    Message,
    ProfileExtractor,
    _now,
    clean_reply,
    phase_for_question,
)
from repositories import profile_repository, session_repository
from selector import profile_selector, session_selector

# datacleaning.py lives in the sibling Mentor_Mentee_Match folder - single
# source of truth for cleaning logic, shared with the bulk CSV pipeline.
BACKEND_ROOT = Path(__file__).resolve().parents[2]
sys.path.append(str(BACKEND_ROOT / "Mentor_Mentee_Match"))
from datacleaning import clean_mentee_record  

_groq = GroqClient(api_key=settings.groq_api_key)
_db = get_db()
_sessions_collection = _db["interview_sessions"]
_profiles_collection = _db["Mentee_Profiles"]
_sessions_collection.create_index("session_id", unique=True)
_profiles_collection.create_index("session_id", unique=True)

_extractor = ProfileExtractor()


# ── Session persistence (thin wrappers around selector/repository) ─────────

def _load_session(session_id: str) -> Optional[InterviewSession]:
    doc = session_selector.find_session(_sessions_collection, session_id)
    if not doc:
        return None
    doc.pop("_id", None)
    history = doc.pop("history", [])
    session = InterviewSession(**doc)
    session.history = [Message(**m) for m in history]
    return session


def _save_session(session: InterviewSession) -> None:
    doc = asdict(session)
    doc["_id"] = session.session_id
    session_repository.save_session(_sessions_collection, doc)


def _save_profile(profile_doc: dict) -> None:
    """profile_doc must be the fully cleaned, flat dict (session.profile),
    not the raw MenteeProfile dataclass - this is what fixes the original
    bug where the uncleaned profile was persisted instead."""
    profile_repository.save_profile(_profiles_collection, profile_doc)


def all_profiles() -> list[dict]:
    return profile_selector.find_all_profiles(_profiles_collection)


# ── LLM calls ────────────────────────────────────────────────────────────

def _call_llm(session: InterviewSession) -> str:
    messages = [{"role": m.role, "content": m.content} for m in session.history]
    if not messages:
        messages.append({"role": "user", "content": "Hello, I'm ready to begin."})
    return _groq.chat_completion(
        model=CHAT_MODEL,
        max_tokens=1024,
        messages=[{"role": "system", "content": SYSTEM_PROMPT}] + messages,
    )


def transcribe_audio(file_bytes: bytes, filename: str = "audio.webm") -> str:
    return _groq.transcribe(model=WHISPER_MODEL, file_bytes=file_bytes, filename=filename)


# ── State transitions ────────────────────────────────────────────────────

def _update_session_state(session: InterviewSession, raw_reply: str) -> None:
    q_match = re.search(r"\[Q:(\d+)\]", raw_reply)
    if q_match:
        session.current_question = int(q_match.group(1))
        session.current_phase = phase_for_question(session.current_question)

    if "[DONE]" in raw_reply:
        session.is_complete = True
        session.completed_at = _now()
        profile = _extractor.extract(raw_reply, session.session_id)
        if profile:
            flat = {
                "full_name": profile.full_name,
                "university": profile.university,
                "degree": profile.degree,
                "experience_level": profile.experience_level,
                "domain_interest": profile.domain_interest,
                "target_role": profile.target_role,
                "target_company_tier": profile.target_company_tier,
                "target_industry": profile.target_industry,
                "bio": profile.bio,
                "tech_skills": " | ".join(profile.tech_skills),
                "domain_skills": " | ".join(profile.domain_skills),
                "soft_skills": " | ".join(profile.soft_skills),
                "source": "interview",
                "session_id": profile.session_id,
                "generated_at": profile.generated_at,
            }
            flat = clean_mentee_record(flat)  # adds cleaned_* fields + mentee_experience_years

            session.profile = asdict(profile)
            session.profile.update(flat)  # merge in cleaned_* + mentee_experience_years

            # THE FIX: persist the cleaned/merged dict, not the raw `profile`
            # dataclass - mentee_profiles now actually contains what the
            # matching engine needs (cleaned_* fields, mentee_experience_years,
            # pipe-joined skill strings).
            _save_profile(session.profile)

    session.history.append(Message(role="assistant", content=raw_reply))


# ── Public API used by api/routes.py ────────────────────────────────────

def start_session() -> tuple[InterviewSession, str]:
    session = InterviewSession()
    first_reply = _call_llm(session)
    _update_session_state(session, first_reply)
    _save_session(session)
    return session, clean_reply(first_reply)


def send_message(session_id: str, user_text: str, input_mode: str = "text"):
    """Returns (reply, is_complete, session) or (None, None, None) if session not found."""
    session = _load_session(session_id)
    if not session:
        return None, None, None
    if session.is_complete:
        raise ValueError("Interview already complete")

    session.history.append(Message(role="user", content=user_text, input_mode=input_mode))
    raw_reply = _call_llm(session)
    _update_session_state(session, raw_reply)
    _save_session(session)

    if session.is_complete:
        return clean_reply(raw_reply, strip_done=True), True, session
    return clean_reply(raw_reply), False, session


def get_session(session_id: str) -> Optional[InterviewSession]:
    return _load_session(session_id)


def export_csv() -> str:
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=CSV_FIELDS)
    writer.writeheader()
    for doc in all_profiles():
        profile = MenteeProfile(session_id=doc.get("session_id", ""), **{
            k: v for k, v in doc.items() if k in MenteeProfile.__dataclass_fields__
        })
        writer.writerow(profile.to_csv_row())
    return buf.getvalue()

def exit_session(session_id: str) -> Optional[InterviewSession]:
    """Let the mentee exit before completion. Marks the session as abandoned
    rather than complete - no profile is extracted since the [DONE] JSON
    block was never produced, so no mentee_profiles write happens either."""
    session = _load_session(session_id)
    if not session:
        return None
    if session.is_complete:
        return session 
    session.is_abandoned = True
    session.completed_at = _now()
    _save_session(session)
    return session