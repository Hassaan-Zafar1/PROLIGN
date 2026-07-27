# Phase 0 harness-verification smoke test — proves pytest + FastAPI's
# TestClient can drive the real app before Phase 5 adds the full per-route
# suite covering all 3 routes (GET /, GET /history/{session_id}, POST /chat).
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
