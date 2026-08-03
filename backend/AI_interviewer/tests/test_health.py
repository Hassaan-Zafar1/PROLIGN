# Phase 0 harness-verification smoke test — proves pytest + FastAPI's
# TestClient can drive the real app (in-process ASGI, no real port bound, so
# the port-8000 collision with Rag_Chatbot doesn't affect this) before Phase 5
# adds the full per-route suite covering all 10 routes.
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
