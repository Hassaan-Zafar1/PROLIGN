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

# Every route is mounted under /interviewer (see include_router below) because
# the deployed topology puts an ALB in front of all four services on one
# hostname, and an ALB routes by path prefix but cannot rewrite it — a request
# for /interviewer/sessions arrives here still spelled /interviewer/sessions.
# Owning the prefix here keeps the service reachable behind the ALB and
# identical locally.
ROUTE_PREFIX = "/interviewer"

app = FastAPI(
    title="ProLign AI Voice Interviewer",
    description="AI-powered voice/text mentee assessment interview API",
    version="3.0.0",
    docs_url=f"{ROUTE_PREFIX}/docs",
    openapi_url=f"{ROUTE_PREFIX}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)
app.include_router(router, prefix=ROUTE_PREFIX)
