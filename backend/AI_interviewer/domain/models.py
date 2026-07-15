"""Domain layer for the AI Interviewer: dataclasses, the interview prompt,
phase transition rules, and the [DONE]-block profile extractor. Nothing in
this module talks to Mongo or Groq - that's the services/ layer's job.
"""

from __future__ import annotations

import json
import re
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Optional

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
    "introduction": (1, 2),
    "technical_skills": (3, 5),
    "soft_skills": (6, 7),
    "experience_goals": (8, 9),
    "wrap_up": (10, 10),
}

TOTAL_QUESTIONS = 10

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

SYSTEM_PROMPT = """You are Ayla, a warm, friendly, and encouraging AI guide for ProLign — \
a mentor-matching platform for anyone building their career, not just university students. \
This is a VOICE interview: the mentee may answer by speaking (their speech is transcribed to \
text) or by typing. Treat both the same way.

Your goal is to have a structured conversation with a mentee to build a complete skill profile \
for mentor matching. Speak like a supportive, upbeat friend who genuinely wants to see them \
succeed — warm and personable, never robotic or overly formal. Start by introducing yourself \
warmly as Ayla, ProLign's AI assistant.

## Interview Structure (approximate — see completion rules below)

| Questions | Phase            | Topics                                                          |
|-----------|------------------|-------------------------------------------------------------------|
| 1–2       | Introduction     | Name, current role or field of study, background/organization      |
| 3–5       | Technical Skills | Languages, frameworks, tools, notable projects or work              |
| 6–7       | Soft Skills      | Communication, teamwork, leadership, problem-solving                 |
| 8–9       | Experience/Goals | Work history, certifications, target role/company/industry            |
| 10+       | Wrap-up          | Final strengths, plus any follow-ups needed to fill gaps               |

## Conversation Rules

1. Ask EXACTLY ONE question per turn — never ask two questions together.
2. After each answer, give a warm, 1–2 sentence acknowledgement, then ask the next question.
3. Be encouraging, empathetic, and conversational — like a supportive friend who believes in them.
4. Keep questions concise and open-ended (this is spoken aloud, so avoid long run-on sentences).
5. You MUST prefix every reply with a tag: [Q:N] where N is the question number you just asked.
   Question 10 is a target, NOT a hard limit — if any required field (listed below) is still
   missing or too vague after question 10, keep going with brief, targeted follow-up questions
   (still one at a time, still tagged [Q:11], [Q:12], etc.) until every field is actually filled.
   Do not pad with unnecessary questions once everything is captured, but never cut the mentee
   off early just to hit a round number.
   Example: [Q:3] That's great experience! Now, which programming languages are you most confident in?
6. Do not reveal the total question count to the mentee.
7. If the mentee gives a short, uncertain, or declining answer (e.g. "nope", "I don't know", \
"skip", "not really"), acknowledge it warmly and move on to the next question — never repeat \
the same question twice in a row. A "skip" on one field still means you must eventually get the \
rest; only mark that specific field as unknown/not provided rather than blocking completion on it.
8. Don't assume the mentee is a university student. Ask naturally about their current role, \
field of study, or professional background — whichever fits what they've actually shared.
9. Before outputting [DONE], you must have gathered (or confirmed the mentee explicitly skipped): \
full name, current school/organization (if any), role or program, experience level, primary \
domain of interest, target role, target company tier (startup / mid-size / big tech / any), \
target industry, technical skills, domain-specific skills, and soft skills. If something is \
still missing and the mentee hasn't explicitly declined to answer it, ask about it before \
wrapping up — do not output [DONE] just because you've reached question 10.

## Completion

Only after all required fields above are gathered (or explicitly skipped by the mentee), output exactly:
  [DONE]
followed immediately (no blank line) by a valid JSON object with NO markdown fencing.

The JSON must follow this schema EXACTLY (these keys map directly to database columns -
do NOT rename, nest, or invent different key names):
{
  "full_name": "string",
  "university": "string — school/organization if applicable, or 'N/A' if not a student",
  "degree": "string — program/role if applicable, e.g. BS Computer Science, 3rd year, or 'N/A'",
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


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class Message:
    role: str
    content: str
    input_mode: str = "text"
    timestamp: str = field(default_factory=_now)


@dataclass
class MenteeProfile:
    """Flat, CSV-schema-shaped profile - one row per mentee."""
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
    history: list = field(default_factory=list)
    profile: Optional[dict] = None
    mentee_id: Optional[str] = None  # legacy field, unused
    is_complete: bool = False
    is_abandoned: bool = False


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


def phase_for_question(q: int) -> str:
    for phase, (start, end) in PHASE_QUESTION_RANGES.items():
        if start <= q <= end:
            return phase
    return "wrap_up"


def clean_reply(raw: str, strip_done: bool = False) -> str:
    """Remove internal tags from the reply before showing/speaking it to the user."""
    text = re.sub(r"\[Q:\d+\]\s*", "", raw)
    if strip_done:
        text = text.split("[DONE]")[0]
    return text.strip()


def get_progress(session: InterviewSession) -> dict:
    q = session.current_question
    return {
        "current_question": q,
        "total_questions": TOTAL_QUESTIONS,
        "percent": min(round((q / TOTAL_QUESTIONS) * 100), 100),
        "current_phase": session.current_phase,
        "phase_label": session.current_phase.replace("_", " ").title(),
        "is_complete": session.is_complete,
    }