# ProLign — Test Plan

## 1. Scope

ProLign is a mentor-mentee matching platform spanning three independently-runnable stacks:

| Layer | Stack | Entry point | Port |
|---|---|---|---|
| Frontend | React 19 + Vite | `frontend/` (`npm run dev`) | 5173 |
| Backend API | Node/Express + MongoDB | `backend/server.js` (`npm start`) | 5000 |
| AI Interviewer | Python/FastAPI ("Ayla") | `backend/AI_interviewer/main.py` | **8000** |
| RAG Chatbot | Python/FastAPI | `backend/Rag_Chatbot/app/main.py` | **8000 by default** ⚠️ |

`Mentor_Mentee_Match/` is **not** a fifth service — it's a library imported in-process by
AI_interviewer's `/match` routes, and is exercised indirectly through those.

This plan covers all four runnable services. Out of scope: the Expo/React Native `App/`
mobile client (no test tooling requested for it this pass).

## 2. Test strategy by layer

| Level | Tool | Where | What it catches |
|---|---|---|---|
| Unit / component | Vitest + React Testing Library | `frontend/src/**/*.test.jsx` (co-located) | Pure utils, presentational components, hooks — fast, no network |
| Backend API (integration) | Vitest + Supertest | `backend/**/*.test.js` (co-located, drives the real Express `app` in-process) | Route contracts, auth/role guards, validation, cross-collection side-effects |
| AI service (integration) | pytest + FastAPI `TestClient` | `backend/AI_interviewer/tests/`, `backend/Rag_Chatbot/app/tests/` | Route contracts for both Python services, in-process (no real port, no LLM/Slack calls once mocked) |
| End-to-end | Playwright | `frontend/e2e/*.spec.js` | Full user journeys across a real browser + running backend — the only layer that catches integration gaps between frontend and backend (exactly the class of bug this session's `guest infinite-loop` fix was) |

Pyramid intent: broad, fast unit/component coverage at the bottom; a focused set of
API/integration tests per collection; a small number of *critical-path* E2E specs at the
top (not exhaustive page-by-page coverage — that's what the lower layers are for).

## 3. Environments

- **Local dev, as above.** Playwright's `webServer` config auto-starts the frontend dev
  server; the backend, MongoDB, and Python services must be started separately (backend
  connects to the real dev DB per `MONGO_URI`; backend API tests use an in-process app with
  `mongodb-memory-server`, not the dev DB).
- **⚠️ Port collision (found this session, on the bug list):** AI_interviewer and
  Rag_Chatbot both default to port 8000. Both must be running simultaneously for full E2E
  coverage (the mentee-interview flow talks to AI_interviewer; the chatbot widget talks to
  Rag_Chatbot). **Fix**: run Rag_Chatbot on 8001 (`uvicorn main:app --port 8001` from
  `backend/Rag_Chatbot/app/`) until this is properly parameterized; update the frontend's
  `VITE_INTERVIEWER_API_URL`/chatbot base-URL env vars accordingly if Rag_Chatbot's port changes.
- pytest tests use FastAPI's `TestClient` (in-process ASGI) — the port collision does not
  block those, only real multi-service manual/E2E runs.

## 4. Tooling matrix (installed this pass — see Phase 0)

| Tool | Installed in | Config | Status |
|---|---|---|---|
| Vitest + RTL | `frontend/` | `frontend/vitest.config.js` | Present since prior pass; `e2e/` explicitly excluded to avoid colliding with Playwright's glob |
| Playwright | `frontend/` | `frontend/playwright.config.js` | New — smoke spec passing |
| Vitest + Supertest + mongodb-memory-server | `backend/` | `backend/vitest.config.js` | New — `server.js` now exports `app` separately from `startServer()` so tests can import it without binding a real port/DB |
| pytest + httpx | `backend/AI_interviewer/venv`, `backend/Rag_Chatbot/app/venv` | per-service `conftest.py` | New — both have a passing smoke test; note both services have slow (60–90s) cold-start test runs due to `sentence-transformers`/`torch` imports pulled in transitively |

## 5. Entry / exit criteria

**Entry** (before a test pass is considered ready to run):
- Backend, frontend, and both Python services start cleanly from a fresh checkout
  (`npm install` / `pip install -r requirements.txt` in each, `.env` populated).
- No unresolved merge conflicts or syntax errors in any service (see §6 — one was found
  and fixed this session in `Rag_Chatbot/app/core/config.py`).

**Exit** (before calling a test cycle "done" for a feature):
- All automated suites (Vitest ×2, pytest ×2, Playwright) green.
- No `P1`/`P2` bugs open against the feature in the Jira-import list (`qa/bugs_jira_import.csv`).
- New/changed endpoints have at least one corresponding Supertest case and one TestRail row.

## 6. Risk register (seeded from bugs actually found this session)

These are the highest-risk regression areas — each should have an explicit automated test
(Playwright, Supertest, or pytest) locking the fix in, not just a manual TestRail case:

| Area | Bug | Status |
|---|---|---|
| Guest browsing | Guest clicking View/Book on a mentor card looped forever (401 → failed refresh → page reload → repeat) because `GET /reviews`/`GET /availability` were fully auth-gated and the axios interceptor reloaded on *any* 401, even a guest's | **Fixed** — `optionalAuth` middleware + interceptor now only retries/reloads when a token actually existed |
| Mentee onboarding | `POST /api/interview/complete-ai` (called by the frontend after the AI interview) was a **route that never existed** — 404, silently breaking the entire mentee onboarding→dashboard handoff | **Fixed** — frontend now calls the real `POST /api/interview` link endpoint |
| Mentor CV parsing | Browser PDF text extraction flattened each page to ~one line, breaking LinkedIn-PDF section detection (bio/education/certifications); a regex bug and a same-line-only heuristic also broke company/education extraction once line breaks were fixed | **Fixed** — see `cvExtractionService.js` |
| Rag_Chatbot | `core/config.py` had an **unresolved git merge conflict committed as source** — the service could not even import | **Fixed** this session (Phase 0) |
| Env/ports | AI_interviewer + Rag_Chatbot both default to port 8000 | **Open** — see §3 |
| Rate limiting | `server.js` defines `globalLimiter` but never applies it via `app.use()` — rate limiting is silently inert | **Open** — found during Phase 0, not yet fixed |
| Documentation drift | `how_to_test_using_postman.txt` (existing manual QA guide) documents the **pre-refactor** mentee interview contract (`POST /interview` with `{answers:[...]}`); the real endpoint now requires `{sessionId, linkedinUrl}`. Also documents `profileVisibility` as a boolean in `PATCH /user/profile`, but the schema is an enum (`public`/`members`/`private`) | **Open** — needs updating, on the bug list |

## 7. Deliverables map

| Deliverable | File |
|---|---|
| Test plan | `qa/TEST_PLAN.md` (this file) |
| Test cases (TestRail import) | `qa/test_cases_testrail_import.csv` (Phase 2) |
| Automated E2E | `frontend/e2e/*.spec.js` (Phase 3) |
| Automated API tests | `backend/routes/*.test.js` (Phase 4) |
| Automated AI tests | `AI_interviewer/tests/`, `Rag_Chatbot/app/tests/` (Phase 5) |
| Bugs (Jira import) | `qa/bugs_jira_import.csv` (Phase 6) |
