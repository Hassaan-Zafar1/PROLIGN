"""
ProLign AI Interviewer — FastAPI entrypoint (N-tier layout)

Run:
  pip install -r requirements.txt
  uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router
from core.error_handlers import register_exception_handlers

app = FastAPI(
    title="ProLign AI Voice Interviewer",
    description="AI-powered voice/text mentee assessment interview API",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)
app.include_router(router)
