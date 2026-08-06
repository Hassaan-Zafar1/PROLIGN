# Phase 0 harness-verification smoke test — proves pytest + FastAPI's
# TestClient can drive the real app (in-process ASGI, no real port bound, so
# the port-8000 collision with Rag_Chatbot doesn't affect this) before Phase 5
# adds the full per-route suite covering all 10 routes.
from fastapi.testclient import TestClient
from main import ROUTE_PREFIX, app

# base_url carries the router prefix so the assertions below can keep using
# bare paths like "/health": httpx joins a relative request path onto the
# base_url's path, yielding /interviewer/health. Without this every test would
# have to hardcode the prefix.
client = TestClient(app, base_url=f"http://testserver{ROUTE_PREFIX}")


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
