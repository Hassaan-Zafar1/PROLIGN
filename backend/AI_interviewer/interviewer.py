"""
ProLign AI Interviewer — Core Orchestration
Uses Groq (Llama 3.3) with prompt-based orchestration (no fine-tuning).

Flow:
  1. InterviewOrchestrator manages phase transitions and conversation state
  2. Each phase has its own question targets baked into SYSTEM_PROMPT
  3. ProfileExtractor parses the final [DONE] + JSON block into a flat
     CSV-schema-shaped MenteeProfile
  4. MongoSessionStore persists sessions + raw answers + final profiles to MongoDB
  5. Voice input is handled by transcribing recorded audio via Groq Whisper;
     voice output (TTS) is handled client-side (browser SpeechSynthesis) —
     this file only ever deals with text.
"""

import os
import io
import csv
import json
import sys
import uuid
import re
from pathlib import Path
from datetime import datetime, timezone
from dataclasses import dataclass, field, asdict
from typing import Optional
from groq import Groq
from pymongo import MongoClient
from dotenv import load_dotenv

# One .env for the whole backend, lives at backend/.env — this file is at
# backend/AI_interviewer/interviewer.py, so parents[1] is the backend root.
BACKEND_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_ROOT / ".env")

# datacleaning.py lives in the sibling Mentor_Mentee_Match folder — it's the
# single source of truth for cleaning logic, shared by the interview pipeline
# and the bulk CSV pipeline.
sys.path.append(str(BACKEND_ROOT / "Mentor_Mentee_Match"))
from datacleaning import clean_mentee_record

# ── Constants ────────────────────────────────────────────────────────────────

CHAT_MODEL = "llama-3.3-70b-versatile"
WHISPER_MODEL = "whisper-large-v3"

PHASES = {
    0: "introduction",
    1: "technical_skills",
    2: "soft_skills",
    3: "experience_goals",
    4: "wrap_up",
}

PHASE_QUESTION_RANGES = {
    "introduction":      (1, 2),
    "technical_skills":  (3, 5),
    "soft_skills":       (6, 7),
    "experience_goals":  (8, 9),
    "wrap_up":           (10, 10),
}

TOTAL_QUESTIONS = 10

# Exact column order for the exported mentee CSV / Mongo profile doc
CSV_FIELDS = [
    "full_name",
    "university",
    "degree",
    "experience_level",
    "domain_interest",
    "target_role",
    "target_company_tier",
    "target_industry",
    "bio",
    "tech_skills",
    "domain_skills",
    "soft_skills",
]

# ── System Prompt ─────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are Ayla, a warm, professional AI voice interviewer for ProLign — \
a mentorship platform at FAST National University, Karachi. This is a VOICE interview: \
the mentee may answer by speaking (their speech is transcribed to text) or by typing. \
Treat both the same way.

Your goal is to conduct a structured 10-question assessment interview with a mentee to build \
a skill profile for mentor-mentee matching.

## Interview Structure

| Questions | Phase            | Topics                                                    |
|-----------|------------------|------------------------------------------------------------|
| 1–2       | Introduction     | Name, university, degree/program, year of study            |
| 3–5       | Technical Skills | Languages, frameworks, tools, notable projects              |
| 6–7       | Soft Skills      | Communication, teamwork, leadership, problem-solving        |
| 8–9       | Experience/Goals | Internships, certifications, target role/company/industry   |
| 10        | Wrap-up          | Final strengths, anything they want mentors to know         |

## Conversation Rules

1. Ask EXACTLY ONE question per turn — never ask two questions together.
2. After each answer give a 1–2 sentence warm acknowledgement, then ask the next question.
3. Be encouraging, empathetic, and conversational — like a supportive career advisor.
4. Keep questions concise and open-ended (this is spoken aloud, so avoid long run-on sentences).
5. You MUST prefix every reply with a tag: [Q:N] where N is the question number you just asked.
   Example: [Q:3] That's impressive experience! Now, which programming languages are you most confident in?
6. Do not reveal the total question count to the mentee.
7. Make sure by question 10 you have gathered: full name, university, degree/program, \
year of study, experience level, primary domain of interest, target role, target company \
tier (e.g. startup / mid-size / big tech / any), target industry, technical skills, \
domain-specific skills (e.g. UI/UX, data analysis, DevOps), and soft skills.

## Completion

After the mentee answers question 10, output exactly:
  [DONE]
followed immediately (no blank line) by a valid JSON object with NO markdown fencing.

The JSON must follow this schema EXACTLY (these keys map directly to database columns):
{
  "full_name": "string",
  "university": "string",
  "degree": "string — e.g. BS Computer Science, 3rd year",
  "experience_level": "beginner | intermediate | advanced",
  "domain_interest": "string — primary area of interest, e.g. Web Development, AI/ML, Data Science",
  "target_role": "string — e.g. Backend Engineer, Product Designer",
  "target_company_tier": "string — Startup | Mid-size | Big Tech | Any",
  "target_industry": "string — e.g. Fintech, Healthcare, Telecom",
  "bio": "string — 2-3 sentence third-person bio summarizing background, skills, and goals",
  "tech_skills": ["list of technical skills/tools/languages/frameworks mentioned"],
  "domain_skills": ["list of domain-specific skills, e.g. UI/UX, data analysis, cloud infra"],
  "soft_skills": ["list of demonstrated soft skill traits, e.g. Leadership, Communication"]
}
"""

# ── Data Classes ──────────────────────────────────────────────────────────────

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class Message:
    role: str          # "user" | "assistant"
    content: str        # transcribed / typed text — always the RAW answer
    input_mode: str = "text"   # "text" | "voice" — how the user produced this message
    timestamp: str = field(default_factory=_now)


@dataclass
class MenteeProfile:
    """Flat, CSV-schema-shaped profile — one row per mentee."""
    session_id: str
    full_name: str = ""
    university: str = ""
    degree: str = ""
    experience_level: str = "beginner"
    domain_interest: str = ""
    target_role: str = ""
    target_company_tier: str = ""
    target_industry: str = ""
    bio: str = ""
    tech_skills: list = field(default_factory=list)
    domain_skills: list = field(default_factory=list)
    soft_skills: list = field(default_factory=list)
    generated_at: str = field(default_factory=_now)

    def to_csv_row(self) -> dict:
        """Flatten list fields into ';'-joined strings for CSV export."""
        row = {}
        for f in CSV_FIELDS:
            v = getattr(self, f, "")
            row[f] = "; ".join(v) if isinstance(v, list) else v
        return row


@dataclass
class InterviewSession:
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    started_at: str = field(default_factory=_now)
    completed_at: Optional[str] = None
    current_phase: str = "introduction"
    current_question: int = 0
    history: list = field(default_factory=list)   # list of Message dicts (raw answers live here)
    profile: Optional[dict] = None
    mentee_id: Optional[str] = None   # set once the cleaned mentee record is saved to `mentees`
    is_complete: bool = False


# ── Profile Extractor ─────────────────────────────────────────────────────────

class ProfileExtractor:
    """Parses the [DONE] + JSON block from the assistant's final message."""

    @staticmethod
    def extract(raw_text: str, session_id: str) -> Optional[MenteeProfile]:
        if "[DONE]" not in raw_text:
            return None

        after_done = raw_text.split("[DONE]", 1)[1].strip()
        after_done = re.sub(r"^```(?:json)?", "", after_done).strip()
        after_done = re.sub(r"```$", "", after_done).strip()

        start = after_done.find("{")
        end = after_done.rfind("}") + 1
        if start == -1 or end == 0:
            return None

        try:
            data = json.loads(after_done[start:end])
        except json.JSONDecodeError:
            return None

        def as_list(v):
            if isinstance(v, list):
                return [str(x).strip() for x in v if str(x).strip()]
            if isinstance(v, str):
                return [s.strip() for s in re.split(r"[,;]", v) if s.strip()]
            return []

        return MenteeProfile(
            session_id=session_id,
            full_name=data.get("full_name", ""),
            university=data.get("university", ""),
            degree=data.get("degree", ""),
            experience_level=data.get("experience_level", "beginner"),
            domain_interest=data.get("domain_interest", ""),
            target_role=data.get("target_role", ""),
            target_company_tier=data.get("target_company_tier", ""),
            target_industry=data.get("target_industry", ""),
            bio=data.get("bio", ""),
            tech_skills=as_list(data.get("tech_skills", [])),
            domain_skills=as_list(data.get("domain_skills", [])),
            soft_skills=as_list(data.get("soft_skills", [])),
        )


# ── MongoDB Session Store ──────────────────────────────────────────────────────

class MongoSessionStore:
    """
    Persists sessions (raw Q&A history, including input_mode per answer) and
    finalized flat mentee profiles to MongoDB.

    Collections:
      interview_sessions — one doc per session (full raw transcript + state)
      mentee_profiles    — one doc per completed mentee, shaped exactly like CSV_FIELDS
    """

    def __init__(self, uri: Optional[str] = None, db_name: Optional[str] = None):
        uri = uri or os.environ.get("MONGO_URI", "mongodb://localhost:27017")
        db_name = db_name or os.environ.get("MONGO_DB_NAME", "prolign")
        self.client = MongoClient(uri)
        self.db = self.client[db_name]
        self.sessions = self.db["interview_sessions"]
        self.profiles = self.db["mentee_profiles"]
        self.mentees = self.db["mentees"]
        self.sessions.create_index("session_id", unique=True)
        self.profiles.create_index("session_id", unique=True)
        # sparse: bulk-imported mentees have no session_id, so this only
        # enforces uniqueness among interview-sourced records.
        self.mentees.create_index("session_id", unique=True, sparse=True)
        self.mentees.create_index("mentee_id")

    def save(self, session: InterviewSession):
        doc = asdict(session)
        doc["_id"] = session.session_id
        self.sessions.replace_one({"_id": session.session_id}, doc, upsert=True)

    def load(self, session_id: str) -> Optional[InterviewSession]:
        doc = self.sessions.find_one({"_id": session_id})
        if not doc:
            return None
        doc.pop("_id", None)
        history = doc.pop("history", [])
        session = InterviewSession(**doc)
        session.history = [Message(**m) for m in history]
        return session

    def save_profile(self, profile: MenteeProfile):
        doc = asdict(profile)
        doc["_id"] = profile.session_id
        self.profiles.replace_one({"_id": profile.session_id}, doc, upsert=True)

    def save_mentee_record(self, profile: MenteeProfile) -> dict:
        """
        Build a mentee record shaped like the bulk-upload schema (mentee_id,
        pipe-joined skill strings, etc.), run it through the same EDA cleaning
        used for the CSV pipeline, and upsert it into the `mentees` collection —
        keyed by session_id so re-completing a session updates rather than
        duplicates.
        """
        existing = self.mentees.find_one({"session_id": profile.session_id})
        mentee_id = existing["mentee_id"] if existing else f"MT-{uuid.uuid4().hex[:8].upper()}"

        record = {
            "mentee_id": mentee_id,
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
        record = clean_mentee_record(record)  # adds cleaned_* fields + mentee_experience_years

        self.mentees.replace_one({"session_id": profile.session_id}, record, upsert=True)
        return record

    def all_profiles(self) -> list:
        return list(self.profiles.find({}, {"_id": 0}))

    def export_csv(self) -> str:
        """Return a CSV string of every completed mentee profile, exact column order."""
        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=CSV_FIELDS)
        writer.writeheader()
        for doc in self.all_profiles():
            profile = MenteeProfile(session_id=doc.get("session_id", ""), **{
                k: v for k, v in doc.items() if k in MenteeProfile.__dataclass_fields__
            })
            writer.writerow(profile.to_csv_row())
        return buf.getvalue()


# ── Interview Orchestrator ────────────────────────────────────────────────────

class InterviewOrchestrator:
    """
    Core orchestration engine.

    Responsibilities:
      - Maintain conversation history (multi-turn context window)
      - Detect phase transitions from [Q:N] tags in assistant output
      - Detect completion from [DONE] tag
      - Call the Groq chat model with full history on every turn
      - Transcribe recorded audio answers via Groq Whisper
      - Extract and persist the flat mentee profile on completion
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        mongo_uri: Optional[str] = None,
        mongo_db: Optional[str] = None,
    ):
        self.client = Groq(api_key=api_key or os.environ["GROQ_API_KEY"])
        self.store = MongoSessionStore(uri=mongo_uri, db_name=mongo_db)
        self.extractor = ProfileExtractor()

    # ── Session lifecycle ──────────────────────────────────────────────────

    def start_session(self) -> tuple[InterviewSession, str]:
        """Create a new session and get Ayla's opening question."""
        session = InterviewSession()
        first_reply = self._call_llm(session)
        self._update_session_state(session, first_reply)
        self.store.save(session)
        return session, self._clean_reply(first_reply)

    def send_message(
        self, session: InterviewSession, user_text: str, input_mode: str = "text"
    ) -> tuple[str, bool]:
        """
        Send a user's raw answer (typed or transcribed-from-voice) and get Ayla's reply.
        Returns (clean_reply, is_complete). The raw answer is always stored verbatim
        in session.history regardless of input_mode.
        """
        session.history.append(Message(role="user", content=user_text, input_mode=input_mode))
        raw_reply = self._call_llm(session)
        self._update_session_state(session, raw_reply)
        self.store.save(session)

        if session.is_complete:
            return self._clean_reply(raw_reply, strip_done=True), True
        return self._clean_reply(raw_reply), False

    def transcribe_audio(self, file_bytes: bytes, filename: str = "audio.webm") -> str:
        """Send recorded audio to Groq Whisper and return the raw transcript text."""
        result = self.client.audio.transcriptions.create(
            file=(filename, file_bytes),
            model=WHISPER_MODEL,
            response_format="text",
        )
        # groq sdk returns a plain string when response_format="text",
        # but guard against object-with-.text for forward compatibility.
        if isinstance(result, str):
            return result.strip()
        return getattr(result, "text", "").strip()

    # ── Internal helpers ───────────────────────────────────────────────────

    def _call_llm(self, session: InterviewSession) -> str:
        messages = [{"role": m.role, "content": m.content} for m in session.history]
        if not messages:
            # Kick off Ayla's opening question — chat models require alternating roles.
            messages.append({"role": "user", "content": "Hello, I'm ready to begin."})

        response = self.client.chat.completions.create(
            model=CHAT_MODEL,
            max_tokens=1024,
            messages=[{"role": "system", "content": SYSTEM_PROMPT}] + messages,
        )
        return response.choices[0].message.content

    def _update_session_state(self, session: InterviewSession, raw_reply: str):
        q_match = re.search(r"\[Q:(\d+)\]", raw_reply)
        if q_match:
            session.current_question = int(q_match.group(1))
            session.current_phase = self._phase_for_question(session.current_question)

        if "[DONE]" in raw_reply:
            session.is_complete = True
            session.completed_at = _now()
            profile = self.extractor.extract(raw_reply, session.session_id)
            if profile:
                session.profile = asdict(profile)
                self.store.save_profile(profile)
                record = self.store.save_mentee_record(profile)
                session.mentee_id = record["mentee_id"]

        session.history.append(Message(role="assistant", content=raw_reply))

    def _phase_for_question(self, q: int) -> str:
        for phase, (start, end) in PHASE_QUESTION_RANGES.items():
            if start <= q <= end:
                return phase
        return "wrap_up"

    @staticmethod
    def _clean_reply(raw: str, strip_done: bool = False) -> str:
        """Remove internal tags from the reply before showing/speaking it to the user."""
        text = re.sub(r"\[Q:\d+\]\s*", "", raw)
        if strip_done:
            text = text.split("[DONE]")[0]
        return text.strip()


# ── Progress Utilities ────────────────────────────────────────────────────────

def get_progress(session: InterviewSession) -> dict:
    q = session.current_question
    return {
        "current_question": q,
        "total_questions": TOTAL_QUESTIONS,
        "percent": round((q / TOTAL_QUESTIONS) * 100),
        "current_phase": session.current_phase,
        "phase_label": session.current_phase.replace("_", " ").title(),
        "is_complete": session.is_complete,
    }