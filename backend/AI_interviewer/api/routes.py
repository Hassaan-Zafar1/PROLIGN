"""HTTP routes (presentation layer) for the AI Interviewer + matching API.

Deliberately thin: validate input, delegate to services, shape the
response. No Mongo/Groq calls, no business logic here.
"""

from __future__ import annotations

import io
import sys
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from domain.models import get_progress
from schemas.interview import (
    MessageRequest,
    MessageResponse,
    SessionResponse,
    StartResponse,
    TranscribeResponse,
)
from services import interview_service

# mm_services (Mentor_Mentee_Match's matching service) lives in the sibling
# Mentor_Mentee_Match folder - named distinctly from our own `services`
# package to avoid a sys.modules name collision (both folders otherwise use
# the same package name, and Python would silently resolve to the wrong one
# once `services` is already imported from AI_interviewer).
BACKEND_ROOT = Path(__file__).resolve().parents[2]
sys.path.append(str(BACKEND_ROOT / "Mentor_Mentee_Match"))
from mm_services import matching_service  # noqa: E402

router = APIRouter()


@router.post("/sessions", response_model=StartResponse)
async def start_session():
    """Create a new interview session and return Ayla's first question."""
    session, opening = interview_service.start_session()
    return StartResponse(
        session_id=session.session_id,
        opening_message=opening,
        progress=get_progress(session),
    )


@router.post("/sessions/{session_id}/transcribe", response_model=TranscribeResponse)
async def transcribe(session_id: str, audio: UploadFile = File(...)):
    """Upload a recorded voice answer, get back the raw transcript for
    frontend confirmation before sending it on to /messages."""
    session = interview_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")

    text = interview_service.transcribe_audio(audio_bytes, filename=audio.filename or "audio.webm")
    return TranscribeResponse(text=text)


@router.post("/sessions/{session_id}/messages", response_model=MessageResponse)
async def send_message(session_id: str, body: MessageRequest):
    """Send a user's raw answer and get Ayla's next reply."""
    try:
        reply, is_done, session = interview_service.send_message(
            session_id, body.text, input_mode=body.input_mode
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    return MessageResponse(reply=reply, is_complete=is_done, progress=get_progress(session))


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    """Retrieve session state and progress."""
    session = interview_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionResponse(
        session_id=session.session_id,
        is_complete=session.is_complete,
        progress=get_progress(session),
        mentee_id=session.mentee_id,
        profile=session.profile if session.is_complete else None,
    )


@router.get("/sessions/{session_id}/profile")
async def get_profile(session_id: str):
    """Return the flat, cleaned mentee profile. Only available once complete."""
    session = interview_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.is_complete or not session.profile:
        raise HTTPException(status_code=400, detail="Interview not yet complete")
    return session.profile


@router.get("/match/{session_id}")
async def match_by_session_id(session_id: str, top_k: int = 5):
    """Match directly on a completed interview's session_id - useful from
    anywhere that only has that id (e.g. a saved link), without an active
    Python interview session object in memory."""
    try:
        return matching_service.match_mentee(session_id, top_k=top_k)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/sessions/{session_id}/matches")
async def get_matches(session_id: str, top_k: int = 5):
    """Run mentor matching against this session's own cleaned profile in
    mentee_profiles and return ranked mentors + skill-gap recommendations.
    Works immediately once the interview is complete - no linking step
    required."""
    session = interview_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.is_complete:
        raise HTTPException(status_code=400, detail="Interview not yet complete.")

    try:
        return matching_service.match_mentee(session.session_id, top_k=top_k)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/export/mentees.csv")
async def export_mentees_csv():
    """Download every completed mentee profile as a single CSV."""
    csv_text = interview_service.export_csv()
    return StreamingResponse(
        io.StringIO(csv_text),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=mentee_profiles.csv"},
    )


@router.get("/health")
async def health():
    return {"status": "ok", "version": "3.0.0"}

@router.post("/sessions/{session_id}/exit")
async def exit_session(session_id: str):
    """Let the mentee exit the interview before completion."""
    session = interview_service.exit_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "session_id": session.session_id,
        "is_abandoned": session.is_abandoned,
        "message": "Interview exited. You can restart anytime from your dashboard.",
    }