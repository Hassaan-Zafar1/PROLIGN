"""FastAPI application entrypoint for the ProLign RAG chatbot backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router
from core.config import settings
from core.error_handlers import register_exception_handlers

# Every route is mounted under /rag (see include_router below) because the
# deployed topology puts an ALB in front of all four services on one hostname,
# and an ALB routes by path prefix but cannot rewrite it — a request for
# /rag/chat arrives at this app still spelled /rag/chat. Owning the prefix here
# keeps the service reachable behind the ALB and identical locally.
ROUTE_PREFIX = "/rag"

app = FastAPI(
    title="ProLign RAG Chatbot Backend",
    docs_url=f"{ROUTE_PREFIX}/docs",
    openapi_url=f"{ROUTE_PREFIX}/openapi.json",
)

allowed_origins = {
    settings.frontend_origin,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)
app.include_router(router, prefix=ROUTE_PREFIX)
