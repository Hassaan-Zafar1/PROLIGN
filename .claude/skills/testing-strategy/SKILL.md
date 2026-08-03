---
name: testing-strategy
description: How to decide whether a ProLign test belongs at the unit, API/integration, AI-service, or E2E level, and where to put it. Load before writing any test so it lands at the right level instead of duplicating coverage across layers.
---

# ProLign testing strategy

Full plan: `qa/TEST_PLAN.md`. This skill is the quick decision process; read the plan for
reporting, coverage gates, and CI/CD details.

## Classification rule

Test at the **lowest level** that can actually exercise the behavior:

| If the scenario needs... | Level | Tool | Load skill |
|---|---|---|---|
| Nothing but the function's inputs/outputs — no DB, no HTTP, no browser | Unit | Vitest (+ RTL for components) | `vitest` |
| A real Express route, middleware chain, or cross-collection DB effect | API / integration | Vitest + Supertest | `supertest` |
| A FastAPI route on AI_interviewer or Rag_Chatbot | AI service | pytest + TestClient | `pytest` |
| A complete user journey across a real browser + running backend | E2E | Playwright | `playwright` |

Do not duplicate the same scenario at every level. A validation rule tested once at the
unit level does not also need its own E2E test — E2E should cover *that the journey works
end-to-end*, not re-verify every field-level rule already covered below it.

## Before writing a test

1. Check `qa/specifications/` for an existing spec covering this feature (if none exists
   for a non-trivial feature, consider whether one should be written first — see
   `qa/TEST_PLAN.md` §7).
2. Check `qa/test_cases_testrail_import.csv` for an existing test case ID to link the new
   automated test back to.
3. Grep the relevant `*.test.js(x)` / `tests/test_*.py` / `e2e/tests/*.spec.js` files for
   an existing test on the same module — extend it rather than starting a new file, unless
   the module genuinely has no test file yet.
4. Every new or changed backend/AI route needs at least one test. Every bug fix needs a
   regression test at the level where the bug actually manifested (see `qa/TEST_PLAN.md`
   §6's risk register for examples already done this way).

## Coverage gates (already configured, not aspirational)

`frontend/vitest.config.js`, `backend/vitest.config.js`, and both Python services'
`pytest.ini` all enforce an 80% statement/line threshold (`coverage.thresholds` /
`--cov-fail-under=80`). Running the suite when coverage is below that **fails the run** —
this is intentional; do not lower the threshold to make a run pass. If a specific file is
genuinely untestable (e.g. one-off scripts), add it to that config's `coverage.exclude` /
`.coveragerc` `omit`, not by writing meaningless assertions to inflate the number.
