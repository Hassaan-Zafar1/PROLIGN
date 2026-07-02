"""
ProLign AI Interviewer — FastAPI REST API
Exposes the voice/text interviewer as HTTP endpoints for React frontends.

Endpoints:
  POST /sessions                       — start a new interview session
  POST /sessions/{id}/messages         — send a typed OR pre-transcribed message, get Ayla's reply
  POST /sessions/{id}/transcribe       — upload a recorded audio answer, get back the raw transcript
  GET  /sessions/{id}                  — get session state + progress
  GET  /sessions/{id}/profile          — get the completed flat mentee profile
  GET  /export/mentees.csv             — download all completed profiles as CSV
  GET  /health                         — health check

Run:
  pip install -r requirements.txt
  uvicorn api:app --reload --port 8000

Env vars:
  GROQ_API_KEY   — required (chat + Whisper transcription)
  MONGODB_URI    — defaults to mongodb://localhost:27017
  MONGODB_DB_NAME    — defaults to "prolign"
"""

import os
from typing import Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io

from interviewer import InterviewOrchestrator, get_progress
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(
    title="ProLign AI Voice Interviewer",
    description="AI-powered voice/text mentee assessment interview API",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = InterviewOrchestrator(
    api_key=os.environ.get("GROQ_API_KEY"),
    mongo_uri=os.environ.get("MONGODB_URI"),
    mongo_db=os.environ.get("MONGODB_DB_NAME"),
)


# ── Request / Response Models ──────────────────────────────────────────────

class StartResponse(BaseModel):
    session_id: str
    opening_message: str
    progress: dict


class MessageRequest(BaseModel):
    text: str
    input_mode: str = "text"   # "text" | "voice" — voice means it came from /transcribe


class MessageResponse(BaseModel):
    reply: str
    is_complete: bool
    progress: dict


class SessionResponse(BaseModel):
    session_id: str
    is_complete: bool
    progress: dict
    profile: Optional[dict] = None


class TranscribeResponse(BaseModel):
    text: str


# ── Routes ────────────────────────────────────────────────────────────────

@app.post("/sessions", response_model=StartResponse)
async def start_session():
    """Create a new interview session and return Ayla's first question."""
    session, opening = orchestrator.start_session()
    return StartResponse(
        session_id=session.session_id,
        opening_message=opening,
        progress=get_progress(session),
    )


@app.post("/sessions/{session_id}/transcribe", response_model=TranscribeResponse)
async def transcribe(session_id: str, audio: UploadFile = File(...)):
    """
    Upload a recorded voice answer (webm/mp3/wav/m4a). Returns the raw transcript
    so the frontend can show it to the user for confirmation/edit before sending
    it on to /sessions/{id}/messages.
    """
    session = orchestrator.store.load(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")

    text = orchestrator.transcribe_audio(audio_bytes, filename=audio.filename or "audio.webm")
    return TranscribeResponse(text=text)


@app.post("/sessions/{session_id}/messages", response_model=MessageResponse)
async def send_message(session_id: str, body: MessageRequest):
    """Send a user's raw answer (typed, or transcribed via /transcribe) and get Ayla's next reply."""
    session = orchestrator.store.load(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.is_complete:
        raise HTTPException(status_code=400, detail="Interview already complete")

    reply, is_done = orchestrator.send_message(session, body.text, input_mode=body.input_mode)
    return MessageResponse(
        reply=reply,
        is_complete=is_done,
        progress=get_progress(session),
    )


@app.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    """Retrieve session state and progress."""
    session = orchestrator.store.load(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionResponse(
        session_id=session.session_id,
        is_complete=session.is_complete,
        progress=get_progress(session),
        profile=session.profile if session.is_complete else None,
    )


@app.get("/sessions/{session_id}/profile")
async def get_profile(session_id: str):
    """Return the flat mentee profile. Only available after interview is complete."""
    session = orchestrator.store.load(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.is_complete or not session.profile:
        raise HTTPException(status_code=400, detail="Interview not yet complete")
    return session.profile


@app.get("/export/mentees.csv")
async def export_mentees_csv():
    """Download every completed mentee profile as a single CSV, columns matching the DB schema."""
    csv_text = orchestrator.store.export_csv()
    return StreamingResponse(
        io.StringIO(csv_text),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=mentee_profiles.csv"},
    )


@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}