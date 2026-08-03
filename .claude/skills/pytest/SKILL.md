---
name: pytest
description: pytest + FastAPI TestClient conventions for ProLign's two Python services (AI_interviewer, Rag_Chatbot) — file placement, mocking external dependencies, coverage. Load when writing or editing any tests/test_*.py file under backend/AI_interviewer/ or backend/Rag_Chatbot/app/.
---

# pytest conventions (ProLign AI services)

Two independent FastAPI services, each with its own venv and its own `tests/` folder —
there is no shared Python test config between them.

| | AI_interviewer | Rag_Chatbot |
|---|---|---|
| App root | `backend/AI_interviewer/` | `backend/Rag_Chatbot/app/` |
| Entry point | `main.py` (`from main import app`) | `main.py` (`from main import app`) |
| venv | `venv/Scripts/python.exe` (Windows) | `venv/Scripts/python.exe` (Windows) |
| Tests | `tests/test_*.py` | `tests/test_*.py` |
| Run | `./venv/Scripts/python.exe -m pytest` from the app root | same, from `app/` |

## Why `conftest.py` exists at the app root (not just under `tests/`)

`tests/test_*.py` needs `from main import app`, but `main.py` lives one directory up.
pytest only auto-adds a directory to `sys.path` if it contains (or a parent of the test
file contains) a `conftest.py` with no `__init__.py` chain. The empty `conftest.py` at
each service's root exists specifically so this import resolves — don't delete it, and
don't add an `__init__.py` next to it (that would change pytest's path-insertion rules).

## TestClient — in-process, no real port

```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_something():
    response = client.get("/health")
    assert response.status_code == 200
```

This never binds a real network port, so the AI_interviewer/Rag_Chatbot port-8000 overlap
(see `qa/TEST_PLAN.md` §3) does not affect these tests at all — both services' test suites
can run at the same time with no conflict.

## Mocking external dependencies — never hit the real thing in a test

Both services call out to Groq (LLM) and MongoDB; Rag_Chatbot also calls a Slack webhook.
None of these should be live in a test run:

```python
from unittest.mock import patch

def test_chat_endpoint(monkeypatch):
    monkeypatch.setattr("services.some_module.call_groq", lambda *a, **k: {"reply": "mocked"})
    ...
```

Use `monkeypatch` (a built-in pytest fixture) or `unittest.mock.patch` — no extra mocking
library is installed or needed. For MongoDB specifically: patch at the repository/selector
layer (each service's N-tier layout already separates `repositories/`/`selector/` from
`services/`, so patch the collection-access function, not pymongo/motor internals
directly). If a test genuinely needs real Mongo behavior (e.g. verifying an upsert), that's
a case for a dedicated integration test using a real or in-memory Mongo instance — flag it
explicitly as such rather than silently making a "unit" test slow and flaky.

## Coverage — already configured as a hard gate

Each service has its own `pytest.ini` (`--cov=. --cov-fail-under=80`, JUnit + HTML +
XML reports to `reports/`) and `.coveragerc` (omits `venv/`, `tests/`, `conftest.py`,
`reports/`). Running `pytest` from the app root enforces this automatically — a run
exits non-zero if coverage is below 80%, same as the JS side's Vitest thresholds. See the
`testing-strategy` skill for what to do about genuinely untestable files (extend the
`.coveragerc` omit list, don't write meaningless assertions).

## Known slow startup

Both services' test runs take 60–90s just to import, because `api/routes.py` pulls in the
matching-service chain (`sentence-transformers`/`torch`) even for tests that never touch
matching. This is expected — don't assume a hang.
