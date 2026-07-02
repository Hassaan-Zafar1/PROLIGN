# ProLign AI Interviewer — Python Workflow

AI-powered mentee assessment interview using **Anthropic Claude** with pure prompt-based
orchestration. No fine-tuning required.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Entry Points                      │
│   cli_runner.py (terminal)  │  api.py (FastAPI)     │
└────────────────┬────────────┴──────────┬────────────┘
                 │                       │
                 ▼                       ▼
┌──────────────────────────────────────────────────────┐
│           InterviewOrchestrator  (interviewer.py)    │
│                                                      │
│  • Manages InterviewSession state                    │
│  • Builds full conversation history each turn        │
│  • Detects [Q:N] phase tags from Claude output       │
│  • Detects [DONE] + extracts JSON skill profile      │
│  • Persists sessions via SessionStore                │
└───────────────────┬──────────────────────────────────┘
                    │
          Full history on every call
                    │
                    ▼
        ┌───────────────────────┐
        │   Anthropic Claude    │
        │  (claude-opus-4-6)    │
        │                       │
        │  SYSTEM_PROMPT with:  │
        │  • Interview phases   │
        │  • Question rules     │
        │  • [Q:N] tag format   │
        │  • JSON output schema │
        └───────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│           ProfileExtractor  (interviewer.py)         │
│  Parses [DONE] + JSON → SkillProfile dataclass       │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│           SessionStore  (interviewer.py)             │
│  ./sessions/<session_id>.json                        │
│  ./sessions/profile_<session_id>.json                │
│  (swap for Supabase / Redis in production)           │
└──────────────────────────────────────────────────────┘
```

## Interview Phases

| Questions | Phase           | Topics                                    |
|-----------|-----------------|-------------------------------------------|
| 1–2       | Introduction    | Name, program, year                       |
| 3–5       | Technical       | Languages, frameworks, projects           |
| 6–7       | Soft Skills     | Communication, teamwork, leadership       |
| 8–9       | Experience/Goals| Internships, certs, target roles          |
| 10        | Wrap-up         | Final strengths, mentor preferences       |

## Skill Profile Output

```json
{
  "name": "Ali Hassan",
  "program": "BS Computer Science",
  "year_of_study": "3rd year",
  "technical_skills": {
    "score": 72,
    "primary_language": "Python",
    "skills": ["Python", "FastAPI", "PostgreSQL", "React"]
  },
  "soft_skills": { "score": 65, "traits": ["Collaborative", "Analytical"] },
  "experience_level": "intermediate",
  "projects": ["E-commerce chatbot", "University timetable optimizer"],
  "strengths": ["Strong backend skills", "Eager learner", "Project ownership"],
  "weaknesses": ["Limited industry exposure", "Public speaking"],
  "career_goals": ["Backend engineer at a product startup", "ML engineer"],
  "interests": ["NLP", "distributed systems"],
  "certifications": [],
  "recommended_mentor_type": "Technical lead",
  "career_readiness_score": 68,
  "summary": "Ali is a technically solid 3rd-year CS student..."
}
```

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set your API key
export ANTHROPIC_API_KEY=sk-ant-...

# 3a. Run in terminal (CLI)
python cli_runner.py

# 3b. Resume a paused session
python cli_runner.py --session <session_id>

# 3c. Run as REST API (for React frontend / n8n)
uvicorn api:app --reload --port 8000
```

## REST API Quick Reference

```
POST /sessions                          → { session_id, opening_message, progress }
POST /sessions/{id}/messages            → { reply, is_complete, progress }
  body: { "text": "I know Python..." }
GET  /sessions/{id}                     → { session_id, is_complete, progress, profile? }
GET  /sessions/{id}/profile             → full SkillProfile JSON
GET  /health                            → { status: "ok" }
```

## Integrating with n8n

1. HTTP Request node → `POST /sessions` to start
2. Store `session_id` in n8n workflow static data or Supabase
3. Loop: HTTP Request → `POST /sessions/{id}/messages` on each user reply
4. Check `is_complete` — when true, fetch `/sessions/{id}/profile`
5. Pass profile JSON to your matching engine or store in Supabase `mentee_profiles` table

## Swap SessionStore for Supabase

```python
# In interviewer.py, replace SessionStore methods:
import supabase

class SupabaseSessionStore:
    def __init__(self, url, key):
        self.db = supabase.create_client(url, key)

    def save(self, session):
        self.db.table("interview_sessions").upsert(asdict(session)).execute()

    def load(self, session_id):
        row = self.db.table("interview_sessions").select("*").eq("id", session_id).single().execute()
        return InterviewSession(**row.data) if row.data else None

    def save_profile(self, profile):
        self.db.table("mentee_profiles").upsert(asdict(profile)).execute()
```
