"""HTTP routes (presentation layer).

Deliberately thin: validate input via pydantic, delegate to the agent /
services, shape the response. No business logic, no DB calls, no HTTP calls
to third parties live here.
"""

from fastapi import APIRouter

from agent import orchestrator
from core.exceptions import AppError
from schemas.chat import ChatRequest, ChatResponse
from services import conversation_service

router = APIRouter()


@router.get("/")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "ProLign RAG Chatbot Backend"}


@router.get("/history/{session_id}")
async def get_history(session_id: str) -> dict:
    """Return last 7 days of conversation history for a session."""
    history = await conversation_service.load_history(session_id, limit=200, days=7)
    return {"messages": history}


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Handle one chatbot message via the tool-calling agent."""
    await conversation_service.save_message(request.session_id, "user", request.message)

    intent, reply = await orchestrator.route(request.session_id, request.message, request.email)

    # By this point the user-facing reply is final - and for escalations,
    # Slack has already been notified and the escalation record already
    # saved (both happen inside orchestrator.route()). Logging this reply
    # to conversation history is bookkeeping, not something the user should
    # ever lose their response over. If it fails, log it and move on rather
    # than letting the whole HTTP response die - that's what was producing
    # "No response received." even though the escalation itself succeeded.
    try:
        await conversation_service.save_message(request.session_id, "assistant", reply, intent=intent)
    except AppError:
        pass

    return ChatResponse(reply=reply, intent=intent)