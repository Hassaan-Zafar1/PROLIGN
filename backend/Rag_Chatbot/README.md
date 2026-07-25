# ProLign RAG Chatbot Backend — N-Tier + Agentic Refactor

## What changed and why

The original backend worked, but had three things mixed together that make a
codebase hard to extend safely:

1. Every module raised `fastapi.HTTPException` itself, with its own status
   code and wording.
2. Every outbound call (Groq, Slack) hand-rolled its own `httpx.AsyncClient`,
   duplicating timeout/error handling three times.
3. `main.py` called `intent_classifier.classify()` to get a bare string
   (`"FAQ"`, `"COMPLAINT"`, ...) and then branched with `if/else`, manually
   invoking the right module in each branch.

This refactor addresses all three, and reorganizes the whole thing into
clean N-tier layers.

## Layers (top to bottom)

```
app/
  main.py                      Wiring only: CORS, exception handler, router
  api/
    routes.py                  Presentation layer — thin HTTP controllers
  agent/
    orchestrator.py            Agentic intent routing (see below)
    tools.py                   Tool schemas + registry ("selector" for which
                                capability handles a message)
  services/                    Business logic layer
    faq_service.py             RAG answer generation
    complaint_service.py       Slack escalation (complaints + abuse)
    summary_service.py         Conversation summarization
    conversation_service.py    Memory read/write orchestration
  selector/                    Read-only DB queries, no business logic
    conversation_selector.py
    faq_selector.py
  repositories/                Write-only DB operations
    conversation_repository.py
  clients/                     One class per external service, built on
                                the common HTTP base class
    groq_client.py
    slack_client.py
  core/
    http_client.py             BaseHTTPClient — ALL outbound HTTP goes
                                through this one class
    exceptions.py              Common exception hierarchy (AppError and
                                subclasses)
    error_handlers.py          Single FastAPI handler that turns any
                                AppError into a JSON response
    config.py                  Settings (unchanged behavior)
    database.py                Mongo client singleton (unchanged behavior)
    embedder.py                sentence-transformers embedding (unchanged
                                behavior, now raises EmbeddingError)
  schemas/
    chat.py                    Pydantic request/response models
```

**Note on the `selector/` package name:** it's singular (`selector`, not
`selectors`) on purpose — a plural `selectors/` package shadows Python's own
stdlib `selectors` module (used deep inside `asyncio`/`anyio`) and breaks the
entire app at import time. This was actually caught by running the app
during this refactor — if you rename it back to plural, everything breaks
in a very confusing way.

## Errors: one hierarchy, one place that knows about HTTP

`core/exceptions.py` defines:

- `AppError` — base class, has `status_code` + `detail`
- `ExternalServiceError` — Groq/Slack/any outbound call failed
- `DatabaseError` — a Mongo read or write failed
- `EmbeddingError` — local embedding generation failed
- `ValidationError` — bad input FastAPI/pydantic didn't already catch
- `AgentError` — the tool-calling agent failed to route or dispatch

Every layer raises one of these. `core/error_handlers.py` registers a single
`@app.exception_handler(AppError)` in `main.py`, so no service, selector, or
client ever needs to know a status code — they just raise the right typed
error and it's translated consistently.

## Service calls: one base class, subclassed per integration

`core/http_client.py` defines `BaseHTTPClient`, which owns:

- timeout defaults
- header merging
- `raise_for_status()` handling
- JSON parsing
- translating any transport failure into `ExternalServiceError`

`clients/groq_client.py` and `clients/slack_client.py` both subclass it and
add only what's specific to that service (auth headers, the one method they
need). Adding a new integration (e.g. email, SMS) means subclassing
`BaseHTTPClient` again — no copy-pasted `httpx` boilerplate.

## The agent: intent classification collapsed into tool calling

**Before:** `intent_classifier.classify(message)` asked Groq to reply with a
single word, then `main.py` used `if intent == "COMPLAINT": ...` etc. to
manually call the right module.

**After:** `agent/tools.py` defines a small toolbelt:

| Tool | Fires for |
|---|---|
| `answer_faq` | Platform questions (default/fallback) |
| `escalate_complaint` | Real service problems |
| `handle_abusive_message` | Hostility/insults unrelated to a real issue |
| `summarize_conversation` | Explicit recap requests |

`agent/orchestrator.py` sends these tool schemas to Groq's chat-completions
endpoint (`tool_choice="auto"`) along with the user's message. Groq's model
picks one tool; the orchestrator dispatches directly to that tool's handler
(a service function) and returns `(intent_label, reply)`. Classification and
action happen in a single agent turn instead of two separate steps.

`api/routes.py`'s `/chat` handler is now just:

```python
await conversation_service.save_message(request.session_id, "user", request.message)
intent, reply = await orchestrator.route(request.session_id, request.message)
await conversation_service.save_message(request.session_id, "assistant", reply, intent=intent)
return ChatResponse(reply=reply, intent=intent)
```

`intent_classifier.py` is superseded by `agent/orchestrator.py` +
`agent/tools.py` and was not carried over.

### If you want to add a new intent later

1. Write a service function `your_service.do_thing(session_id, message) -> str`.
2. Add a tool schema + registry entry in `agent/tools.py`.
3. Nothing else changes — `orchestrator.route()` and `api/routes.py` are
   already generic over the registry.

## Verified

- Every file passes `python -m py_compile`.
- The full app (`main.py` → `api.routes` → `agent.orchestrator` →
  `agent.tools` → `services.*` → `selector`/`repositories` → `clients.*` →
  `core.*`) was actually imported end-to-end with `fastapi`, `motor`, and
  `sentence-transformers` installed, using dummy env vars — it loads and
  mounts `/`, `/history/{session_id}`, and `/chat` without errors.
- Not run against a live MongoDB/Groq/Slack, since no real credentials or
  network access to those services were available in this environment —
  set real values in `.env` (see `config.py` for the required variable
  names) and run `uvicorn main:app --reload` from inside `app/`.

## Setup

```bash
cd app
pip install -r ../requirements.txt
# create app/.env with GROQ_API_KEY, MONGO_URI, SLACK_WEBHOOK_URL,
# SLACK_COMPLAINT_WEBHOOK_URL (see core/config.py for optional overrides)
uvicorn main:app --reload
```
