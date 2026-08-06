# Phase 0 harness-verification smoke test — proves pytest + FastAPI's
# TestClient can drive the real app before Phase 5 adds the full per-route
# suite covering all 3 routes (GET /, GET /history/{session_id}, POST /chat).
from fastapi.testclient import TestClient
from main import ROUTE_PREFIX, app

# base_url carries the router prefix so the assertions below can keep using
# bare paths like "/": httpx joins a relative request path onto the base_url's
# path, yielding /rag/. Without this every test would have to hardcode it.
client = TestClient(app, base_url=f"http://testserver{ROUTE_PREFIX}")


def test_health_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
