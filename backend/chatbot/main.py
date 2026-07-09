"""FastAPI application for the ProLign RAG chatbot backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import complaint_handler
import embedder
import intent_classifier
import memory
import rag_chain
from config import settings
from schemas import ChatRequest, ChatResponse
import vector_search


app = FastAPI(title="ProLign RAG Chatbot Backend")

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


@app.get("/")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "ProLign RAG Chatbot Backend"}


@app.get("/history/{session_id}")
async def get_history(session_id: str) -> dict:
    """Return last 7 days of conversation history for a session."""
    history = await memory.load_history(session_id, limit=200, days=7)
    return {"messages": history}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Handle one chatbot message."""
    await memory.save_message(request.session_id, "user", request.message)

    intent = await intent_classifier.classify(request.message)

    if intent == "COMPLAINT":
        await complaint_handler.escalate(request.session_id, request.message)
        reply = (
            "I'm sorry to hear you're experiencing an issue. Your complaint has "
            "been escalated to our support team and a team member will follow up "
            "with you shortly."
        )
        await memory.save_message(request.session_id, "assistant", reply, intent="COMPLAINT")
        return ChatResponse(reply=reply, intent="COMPLAINT")

    if intent == "VOILENCE":
        await complaint_handler.escalate(request.session_id, request.message)
        reply = (
            "I want to help you, but I need us to keep this conversation respectful. "
            "Please let me know what issue you are facing so we can solve it together."
        )
        await memory.save_message(request.session_id, "assistant", reply, intent="VOILENCE")
        return ChatResponse(reply=reply, intent="VOILENCE")

    if intent == "SUMMARY":
        history = await memory.load_history(request.session_id, limit=50)
        reply = await rag_chain.summarise(history)
        await memory.save_message(request.session_id, "assistant", reply, intent="SUMMARY")
        return ChatResponse(reply=reply, intent="SUMMARY")

    embedding = await embedder.embed(request.message)
    context_chunks = await vector_search.search(embedding, top_k=3)
    reply = await rag_chain.answer(request.session_id, request.message, context_chunks)
    if not reply:
        reply = "I don't have information on that yet, but you can reach our support team."
    await memory.save_message(request.session_id, "assistant", reply, intent="FAQ")
    return ChatResponse(reply=reply, intent="FAQ")