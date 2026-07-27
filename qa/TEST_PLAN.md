# ProLign — Test Plan

## 1. Scope

ProLign is a mentor-mentee matching platform spanning four independently-runnable services:

| Layer | Stack | Entry point | Port |
|---|---|---|---|
| Frontend | React 19 + Vite | `frontend/` (`npm run dev`) | 5173 |
| Backend API | Node/Express + MongoDB | `backend/` (`npm run dev`) | 5000 |
| AI Interviewer | Python/FastAPI ("Ayla") | `backend/AI_interviewer/main.py` | 8000 |
| RAG Chatbot | Python/FastAPI | `backend/Rag_Chatbot/app/main.py` | 8001 |

`Mentor_Mentee_Match/` is not a fifth service — it is a library imported in-process by the
AI Interviewer's matching routes, and is exercised indirectly through those.

This plan covers all four services above. Out of scope: the Expo/React Native mobile
client (no test tooling in place for it yet).

## 2. Test Strategy

| Level | Tool | Scope | Purpose |
|---|---|---|---|
| Unit / component | Vitest + React Testing Library | Frontend utilities, presentational components, hooks | Fast, isolated coverage of pure logic and UI building blocks |
| API (integration) | Vitest + Supertest | Backend Express routes | Route contracts, authentication/role rules, validation, cross-collection side-effects |
| AI services (integration) | pytest + FastAPI `TestClient` | AI Interviewer and RAG Chatbot | Route contracts for both Python services, run in-process without requiring a live LLM or Slack connection |
| End-to-end | Playwright | Full user journeys across a real browser and running backend | The only layer that verifies the frontend and backend work correctly together |

Coverage follows a standard test pyramid: broad, fast unit/component coverage at the base;
focused integration coverage per collection/service; a small, deliberately curated set of
end-to-end journeys at the top covering the platform's critical paths, not every page.

## 3. Environments

- **Local development** (table above). The frontend, backend, AI Interviewer, and RAG
  Chatbot each run independently; Playwright's configuration auto-starts the frontend dev
  server, while the backend, MongoDB, and the two Python services are started separately.
- Backend API tests run against an in-process, in-memory database
  (`mongodb-memory-server`) rather than the development database.
- AI Interviewer and RAG Chatbot are both FastAPI services; by default they would both
  listen on port 8000. To avoid a conflict, RAG Chatbot is run on **8001**
  (`uvicorn main:app --reload --port 8001`, from `backend/Rag_Chatbot/app/`).

## 4. Tooling

| Tool | Location | Purpose |
|---|---|---|
| Vitest + React Testing Library | `frontend/` | Unit/component tests |
| Playwright | `frontend/` | End-to-end tests |
| Vitest + Supertest | `backend/` | Backend API tests |
| pytest + httpx | `backend/AI_interviewer/`, `backend/Rag_Chatbot/app/` | AI service tests |

All four are installed and configured, each with a passing verification test confirming
the harness runs correctly end-to-end.

## 5. Entry / Exit Criteria

**Entry** — before a test cycle begins:
- All four services start cleanly from a fresh checkout.
- No unresolved build errors in any service.

**Exit** — before a feature or release is considered test-complete:
- All automated suites (frontend unit, backend API, AI services, end-to-end) pass.
- No open high-priority (P1/P2) bugs against the feature.
- New or changed endpoints have at least one automated test and one corresponding test
  case in the test case register.

## 6. Risk Register

Highest-risk areas identified so far, each backed by an automated regression test:

| Area | Risk | Status |
|---|---|---|
| Guest browsing | Guests viewing or booking a mentor could get stuck in a reload loop due to an authentication check on public-facing endpoints | Resolved |
| Mentee onboarding | The mentee interview completion step called a backend endpoint that did not exist, silently breaking the onboarding-to-dashboard handoff | Resolved |
| Mentor CV parsing | CV text extraction did not reliably capture bio, education, and certification data from LinkedIn PDF exports | Resolved |
| RAG Chatbot service | The chatbot service could not start due to a configuration file error | Resolved |
| Service ports | AI Interviewer and RAG Chatbot ports could conflict by default | Resolved — documented in §3 |
| Rate limiting | Backend rate limiting is configured but not currently applied | Open |

## 7. Deliverables

| Deliverable | Location |
|---|---|
| Test plan | `qa/TEST_PLAN.md` |
| Test cases | `qa/test_cases_testrail_import.csv` |
| Automated end-to-end tests | `frontend/e2e/` |
| Automated API tests | `backend/routes/*.test.js` |
| Automated AI service tests | `backend/AI_interviewer/tests/`, `backend/Rag_Chatbot/app/tests/` |
| Bug reports | `qa/bugs_jira_import.csv` |
