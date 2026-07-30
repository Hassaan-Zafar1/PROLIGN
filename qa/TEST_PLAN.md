# ProLign — QA Test Strategy and Automation Plan

## 1. Purpose

This document defines the testing strategy, automation architecture, reporting, coverage,
and CI/CD plan for ProLign. It establishes:

- What gets tested at which level, and with which tool
- How results are reported for each test level, independently
- The metrics used to call a test run "passed"
- Enforced code coverage thresholds and what blocks a build
- The Playwright automation architecture (structure, retries, failure handling)
- The intended CI/CD trigger schedule
- How Claude Code is guided to generate and classify tests consistently

## 2. Scope

ProLign spans four independently-runnable services:

| Layer | Stack | Entry point | Port |
|---|---|---|---|
| Frontend | React 19 + Vite | `frontend/` (`npm run dev`) | 5173 |
| Backend API | Node/Express + MongoDB | `backend/` (`npm run dev`) | 5000 |
| AI Interviewer | Python/FastAPI ("Ayla") | `backend/AI_interviewer/main.py` | 8000 |
| RAG Chatbot | Python/FastAPI | `backend/Rag_Chatbot/app/main.py` | 8001 |

`Mentor_Mentee_Match/` is not a fifth service — it is a library imported in-process by the
AI Interviewer's matching routes, and is exercised indirectly through those.

**Out of scope:** the Expo/React Native mobile client (no test tooling in place for it yet).

## 3. Test Strategy

```
              ┌───────────────────────┐
              │   End-to-End (E2E)    │   Playwright — small, critical journeys only
              └───────────┬───────────┘
                          │
              ┌───────────▼───────────┐
              │  API / AI Integration │   Supertest (Node) + pytest/TestClient (Python)
              └───────────┬───────────┘
                          │
              ┌───────────▼───────────┐
              │   Unit / Component    │   Vitest + React Testing Library
              └───────────────────────┘
```

Most tests should exist at the Unit and Integration levels — they are faster, more
isolated, and cheaper to maintain. E2E is reserved for full user journeys where the thing
actually being verified is that the frontend and backend work correctly *together*
(exactly the class of bug the guest-browsing fix in §12 was) — not for re-testing
validation rules or component rendering already covered lower down.

| Level | Tool | Where | Purpose |
|---|---|---|---|
| Unit / component | Vitest + React Testing Library | `frontend/src/**/*.test.jsx` (co-located) | Pure utilities, hooks, presentational components |
| Backend API | Vitest + Supertest | `backend/**/*.test.js` (co-located) | Route contracts, auth/role rules, validation, cross-collection effects |
| AI services | pytest + FastAPI `TestClient` | `backend/AI_interviewer/tests/`, `backend/Rag_Chatbot/app/tests/` | Route contracts for both Python services, without live LLM/Slack calls |
| End-to-end | Playwright (via `playwright-bdd`, Gherkin) | `frontend/e2e/features/` | Full user journeys across a real browser and running backend |

### Test classification rule

A scenario is tested at the **lowest level that can actually exercise it**:

| Scenario needs... | Level |
|---|---|
| Nothing but inputs/outputs — no DB, no HTTP, no browser | Unit |
| A real Express route/middleware or cross-collection DB effect | Backend API |
| A FastAPI route on AI Interviewer or RAG Chatbot | AI service |
| A complete journey across a real browser + running backend | E2E |

The same scenario is not duplicated across every level. This rule, plus the current tool
locations, is captured for Claude Code in `.claude/skills/testing-strategy/SKILL.md` (§10).

## 4. Environments

- **Local development** — table in §2. Playwright auto-starts the frontend dev server;
  the backend, MongoDB, and both Python services are started separately.
- Backend API tests run against an in-process, in-memory database
  (`mongodb-memory-server`) — never the development database.
- AI Interviewer and RAG Chatbot are both FastAPI services; RAG Chatbot runs on 8001 to
  avoid the port conflict both would have by default on 8000.

## 5. Test Automation Architecture

### 5.1 Frontend unit/component — Vitest + React Testing Library
Co-located `*.test.jsx` files. Config: `frontend/vitest.config.js`. Details and mocking
conventions: `.claude/skills/vitest/SKILL.md`.

### 5.2 Backend API — Vitest + Supertest
Co-located `*.test.js` files next to each route file, driving the real Express `app`
in-process (`backend/server.js` exports `app` separately from starting the server).
Config: `backend/vitest.config.js`. Details: `.claude/skills/supertest/SKILL.md`.

### 5.3 AI services — pytest + FastAPI TestClient
`tests/test_*.py` per service, in-process (no real port — the 8000/8001 split doesn't
affect these). Config: each service's `pytest.ini` + `.coveragerc`. Details:
`.claude/skills/pytest/SKILL.md`.

### 5.4 End-to-end — Playwright, expressed as BDD (Gherkin + step definitions)

Structure (implemented, not aspirational):

```
frontend/e2e/
├── features/       *.feature — Gherkin scenarios (business-readable, non-engineers can review)
│   └── steps/      Given/When/Then step definitions — the technical glue
├── .features-gen/  generated by `bddgen` — plain Playwright specs, never hand-edited
├── pages/          Page Object classes — locators + page-specific actions only
├── fixtures/       base.js extends playwright-bdd's `test` with custom fixtures
├── data/           deterministic, collision-safe test data generators
└── reports/        generated — HTML + JUnit + screenshots/video/traces on failure
```

- Built on **`playwright-bdd`**, not a separate Cucumber runner — `bddgen` compiles
  `.feature` + step files into ordinary Playwright spec files, then `playwright test` runs
  those exactly as before. Every reporter/retry/parallelism/artifact setting below is
  unaffected; `npm run test:e2e` already runs `bddgen && playwright test`.
- **Page Object Model**: one class per page, holding locators and actions only — unchanged
  by the Gherkin conversion. Step definitions import `{ Given, When, Then, expect }` from
  `fixtures/base.js` (never `@playwright/test`/`playwright-bdd` directly) and destructure
  fixtures exactly like a plain Playwright test body would.
- **Data-driven**: `data/*.js` exports generators (e.g. `uniqueEmail()`), not static
  fixtures reused across runs, so repeated runs against a real dev database never collide.
- Config: `frontend/playwright.config.js`'s `defineBddConfig()`. Details:
  `.claude/skills/playwright/SKILL.md`.

## 6. Reporting

Each test level produces its own independent report — none are merged silently, so a
failure in one layer is never hidden by success in another.

| Level | Format | Location |
|---|---|---|
| Frontend unit | Console + JUnit XML + coverage (HTML/lcov) | `frontend/reports/` |
| Backend API | Console + JUnit XML + coverage (HTML/lcov) | `backend/reports/` |
| AI services | Console + JUnit XML + coverage (HTML/XML) | `backend/AI_interviewer/reports/`, `backend/Rag_Chatbot/app/reports/` |
| E2E | HTML report + JUnit XML + screenshots/video/traces on failure | `frontend/e2e/reports/` (previously `frontend/reports/e2e-*`) |

Each report includes, at minimum: total tests, passed/failed/skipped counts, pass rate,
duration, and — for coverage-enabled runs — statement/branch/function/line percentages
against the threshold. JUnit XML from every level is what a future CI pipeline consumes to
render its own summary (§10); nothing here depends on a specific CI vendor.

A **consolidated summary** combining all four reports is a natural addition once CI is
active (a single "did everything pass" view for a release decision) — not yet built, since
there is no CI run to consolidate from today. Format only, not real data:

```
ProLign QA Summary  (illustrative format — populated once CI is running)
─────────────────────────────────────────
Frontend unit      <pass/fail>   <n>/<n>
Backend API        <pass/fail>   <n>/<n>
AI services         <pass/fail>   <n>/<n>
E2E                 <pass/fail>   <n>/<n>
Coverage: frontend <n>% · backend <n>% · AI services <n>%
Open P1/P2 bugs: <n>
Release decision: <PASS/BLOCKED>
```

## 7. Pass/Fail Metrics and Quality Gates

**Pass rate** — the standard metric reported at every level:

```
Pass Rate = Passed / (Passed + Failed) × 100
```

Skipped tests are excluded from the denominator — they count as neither pass nor fail, and
a growing skip count is itself a signal worth investigating.

**Mandatory quality gate** — a build/PR must satisfy all of the following, or it is
blocked:

- All unit tests pass (0 failures — no partial-credit threshold for this level).
- All backend API and AI-service tests pass.
- All critical-path E2E tests pass.
- Code coverage meets the threshold (below).
- No open P1/P2 defect against the changed area.

A high pass **percentage** is not sufficient — one failing mandatory test blocks the
build regardless of how many others passed. This is enforced today by each tool's own
exit code (a threshold miss or a failed assertion both produce a non-zero exit), and will
be enforced at the CI-pipeline level once §10 is activated.

## 8. Code Coverage Strategy

| Layer | Tool | Config |
|---|---|---|
| Frontend | Vitest (`@vitest/coverage-v8`) | `frontend/vitest.config.js` → `test.coverage` |
| Backend | Vitest (`@vitest/coverage-v8`) | `backend/vitest.config.js` → `test.coverage` |
| AI Interviewer | pytest-cov | `backend/AI_interviewer/pytest.ini` + `.coveragerc` |
| RAG Chatbot | pytest-cov | `backend/Rag_Chatbot/app/pytest.ini` + `.coveragerc` |

**Threshold (enforced, not aspirational): 80% statements/lines/functions, 70% branches.**
Every config above already fails its run when coverage drops below this — this is real,
verified behavior, not a documented intention. `npm run test:coverage` in `frontend/` or
`backend/`, and plain `pytest` in either Python service's root, all currently **fail** for
exactly this reason:

| Service | Current coverage (measured) | Gate result |
|---|---|---|
| Frontend | 0% (no test files exist yet) | FAIL — no tests found |
| Backend | 17.6% statements / 3.0% branches | FAIL |
| AI Interviewer | 28.6% | FAIL |
| RAG Chatbot | 50.6% | FAIL |

This is the honest current state, not a placeholder — coverage will rise as the test
suites in each service's `tests/`/`*.test.js` locations are built out. **A coverage
exception (lowering a threshold, or excluding a file) requires explicit review** — the
`testing-strategy` skill instructs Claude Code never to pad coverage with meaningless
assertions to hit the number.

**Update — Phases 4/5/7 complete:**

| Service | Current coverage (measured) | Gate result |
|---|---|---|
| Frontend (pure utils + `components/common/`, 18 test files) | 90.1% stmts / 89.1% branch / 98.3% func / 91.7% lines | **PASS** |
| Backend | 73.0% stmts / 57.7% branch / 78.8% func / 78.6% lines | FAIL — Stripe payment code + Google OAuth uncovered (both need real/mocked external services not yet wired up; deliberate scope decision, not an oversight) |
| AI Interviewer | 90% | **PASS** |
| RAG Chatbot | 86% | **PASS** |

The frontend number above is scoped to the 13 source files that actually have unit
tests (pure `utils/` + `routes/routeConfig.js` + the 12 shared `components/common/`
primitives) — page-level components (MentorDashboard, Booking, AdminDashboard, etc.)
have no *unit*-level coverage by design, since they call real APIs and compose many
child components; they're covered by the Playwright E2E suite instead, not this gate.

## 9. Retry and Flaky Test Policy

| Environment | Retries |
|---|---|
| Local development | 0 |
| CI | 1 |

Configured today in `frontend/playwright.config.js` (`retries: process.env.CI ? 1 : 0`).
A test that fails once and passes on retry is flagged in the HTML/JUnit report as
**potentially flaky** — retries surface flakiness for investigation, they do not silently
mask it. A test failing 3+ times intermittently within a week should be marked flaky,
assigned an owner, and tracked as a defect — not left on permanent retry.

## 10. Failure and Fallback Strategy

```
Test failure
    → Retry once (CI only)
        → Pass  → flagged as potentially flaky, investigate
        → Fail  → capture artifacts (screenshot, video, trace, logs)
                → block the PR/build
```

If a test cannot execute at all because a required service (backend, database, an AI
service) is unavailable, that is reported as an **environment/infrastructure failure**,
distinct from a functional test failure — it must never be silently recorded as a pass.

**Playwright failure artifacts** (configured in `playwright.config.js`): screenshot on
failure, video retained on failure, trace on first retry — all land in
`frontend/e2e/reports/e2e-html/`.

## 11. CI/CD Strategy

No CI pipeline is active yet — `.github/workflows/ci.yml` is a **scaffold**, ready to
enable once repository secrets (`MONGO_URI`, `JWT_SECRET`, `GROQ_API_KEY`, etc.) are
configured in GitHub. It defines four jobs (frontend unit, backend API, AI services ×2,
E2E) and the intended trigger schedule:

| Trigger | Runs |
|---|---|
| Pull request into `main` | Frontend unit + backend API + AI services + coverage gates + E2E |
| Push to `main` | Same full suite, post-merge |
| Nightly (02:00 UTC) | Same full suite, independent of whether anything changed |

Every job uploads its reports (§6) as CI artifacts regardless of pass/fail, so a failure
is always debuggable from the CI run itself.

## 12. Risk Register

The authoritative, full bug list (38 items: 8 resolved, 30 open) is filed live
in Jira — project **PRO** (`prolign.atlassian.net`), tickets **PRO-2..PRO-39**,
created directly via Jira's REST API (source data: `qa/bugs_jira_import.csv`).
It was compiled from bugs found and fixed while writing Phases 3–5 (E2E/API/AI
test suites) plus a dedicated 3-angle code-review pass (frontend, backend API,
database/schema) across the whole codebase. This table summarizes it; see the
CSV or the Jira tickets themselves for full repro steps on every row.

**Four Critical-severity findings need attention before the others:**

| Area | Risk | Status |
|---|---|---|
| Secrets | Real production MongoDB Atlas credentials are hardcoded as a fallback default in `AI_interviewer/core/config.py` and committed to git history | Open |
| Payments | `POST /api/payments` accepts a client-supplied amount and status with no verification, letting any mentee record a fake "captured" payment without Stripe ever being involved | Open |
| Payments | `POST /api/sessions` accepts a client-supplied `priceCharged` that overrides the mentor's real price (including 0 or negative) — this value later drives the actual Stripe charge | Open |
| Mentee data | `POST /api/interview/complete-ai` writes to field names that don't exist on the `Mentee_Profiles` schema — Mongoose silently drops them, discarding most of the submitted interview data | Open |

**High-severity (10) and Medium/Low (16) findings** span all three categories
the QA deliverable calls for — UI (e.g. Analytics page crash, broken dashboard
date math), API (e.g. Google login 500 for OAuth-only accounts, a double-
booking race condition), and database (e.g. conflicting Node/Python index
definitions on the same collection, no cascade cleanup on user deletion) —
full detail in the CSV.

**Already resolved this session** (for traceability): guest infinite reload
loop, broken mentee interview→dashboard link, CV-parsing multi-line/education
corruption, dead title/industry mapping, RAG Chatbot config merge-conflict
startup failure, AI/RAG Chatbot port-8000 collision, CV upload 500 (pdfjs-dist
`Buffer`/`Uint8Array`), AI_interviewer CSV export crash.

| Area | Risk | Status |
|---|---|---|
| Rate limiting | Backend rate limiting is configured but not currently applied | Open |

Every resolved regression above should have (or already has) an automated test locking
the fix in at the level where it manifested, not just a manual test case.

## 13. Claude Code Testing Skills

Project-specific guidance so test generation stays consistent regardless of who (or what)
writes the next test:

| Skill | Covers |
|---|---|
| `.claude/skills/testing-strategy/SKILL.md` | Classification rule, where to check for existing specs/cases before writing a new test |
| `.claude/skills/vitest/SKILL.md` | Frontend + backend unit conventions, mocking, coverage |
| `.claude/skills/supertest/SKILL.md` | Backend API test setup, auth, test database, negative-case checklist |
| `.claude/skills/playwright/SKILL.md` | POM, fixtures, data-driven data, retry/artifact conventions |
| `.claude/skills/pytest/SKILL.md` | AI service TestClient setup, mocking Groq/Mongo/Slack, coverage |

## 14. Deliverables

| Deliverable | Location |
|---|---|
| Test plan | `qa/TEST_PLAN.md` |
| Test cases | `qa/test_cases_testrail_import.csv` |
| Automated end-to-end tests | `frontend/e2e/` |
| Automated API tests | `backend/routes/*.test.js` |
| Automated AI service tests | `backend/AI_interviewer/tests/`, `backend/Rag_Chatbot/app/tests/` |
| Bug reports | Live in Jira (project PRO, PRO-2..PRO-39); source CSV: `qa/bugs_jira_import.csv` |
| CI/CD scaffold | `.github/workflows/ci.yml` |
| Claude Code testing skills | `.claude/skills/` |

## 15. Future Improvements

- Activate the CI scaffold (configure secrets, confirm the pipeline runs green end-to-end).
- Consolidated QA dashboard once CI produces real, repeated data to summarize.
- Automatic TestRail sync (Jira is now automated via direct API creation; TestRail is currently manual CSV import).
- Visual regression, API contract, and load/performance testing.
- Mobile app test automation.
