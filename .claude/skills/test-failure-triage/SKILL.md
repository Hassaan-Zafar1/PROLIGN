---
name: test-failure-triage
description: How to triage a ProLign test-suite failure — classify it BUG vs FLAKY with concrete evidence, track flakiness over time, and file genuine bugs to Jira (project PRO). Load whenever any test run (Vitest/pytest/Playwright) reports one or more failures.
---

# Test-failure triage → Jira (ProLign)

Turns ad-hoc failure investigation into a repeatable procedure. Only file tickets for
confirmed bugs (or persistently-flaky tests, Step 7) — a flaky one-off gets logged locally,
not ticketed, so a Jira ticket always means something needs fixing.

## Step 0 — find the reports for whichever layers actually ran

```
frontend/reports/e2e-junit.xml               Playwright (E2E)
frontend/reports/unit-junit.xml              Vitest (frontend unit)
backend/reports/api-junit.xml                Vitest + Supertest (backend API)
backend/AI_interviewer/reports/junit.xml     pytest (AI Interviewer)
backend/Rag_Chatbot/app/reports/junit.xml    pytest (RAG Chatbot)
```

Don't assume all five ran — only parse the ones from this invocation. Treat `failures` and
`errors` in `<testsuites>` identically (both mean "did not pass"). If an entire suite fails
identically (webServer never came up, Mongo `ECONNREFUSED` everywhere) that's an
**environment problem**, not a test failure — report it separately and stop; never feed it
into BUG/FLAKY classification or `qa/flaky_tests.json`.

## Step 1 — enumerate every failing `<testcase>`

Record `classname`, `name`, the `<failure>`/`<error>` `message`/`type`, and the full CDATA
body (assertion diff + stack trace). Always available, every layer.

## Step 2 — gather layer-specific evidence

- **Playwright only** — read that testcase's `<system-out>` `[[ATTACHMENT|...]]` lines
  (paths relative to `frontend/`). Priority order:
  1. `error-context.md` — **the single most important artifact**: the error message, an
     ARIA/accessibility-tree snapshot of the page at the moment of failure, and the test
     source with the failing line marked `>`. Step 3 is built on this snapshot.
  2. `test-failed-1.png` (screenshot — not present on every failure, e.g. a hung
     webServer/teardown timeout produces none).
  3. `video.webm` (not always present either).
  4. `trace.zip` (view with `npx playwright show-trace <path>`).
- **Vitest** — that testcase's `<system-out>`/`<system-err>` really does capture the app's
  own `console.log`/`console.error` during the test (confirmed live in
  `backend/reports/api-junit.xml`) — use it as real log evidence.
- **pytest** — neither service's `pytest.ini` sets `junit_logging`, so stdout isn't
  captured; only the traceback in `<failure>` is available. This is a known limitation —
  don't try to work around it, just note it in the ticket if evidence is thin.

## Step 3 — classify BUG vs FLAKY

1. A thrown app exception / 5xx / wrong-shaped response is a strong BUG signal on its own —
   don't run the rest of this procedure just to "confirm" an already-obvious app-side error.
2. **E2E only** — read the ARIA snapshot from `error-context.md`:
   - Genuinely wrong state (error banner, crashed/blank page, wrong data displayed) → leans **BUG**.
   - A normal-looking page mid-async-step (e.g. a submit button still disabled with a
     loading spinner) → leans **FLAKY**.
   - Neither clearly wrong nor clearly loading → **ambiguous**. Don't force a verdict — weight
     step 4 more heavily, and if still unresolved, file as BUG with an explicit
     low-confidence note. Never silently drop an ambiguous failure as "probably flaky."
3. Cross-check against contention sources already identified in this codebase before
   concluding flaky:
   - `backend/services/emailService.js`'s `sendOTPEmail()` does a real, blocking SMTP send
     inside every `/auth/register` call (not mocked; dev only swallows the *error*, never
     skips or defers the send).
   - `frontend/playwright.config.js` runs `fullyParallel: true` with `retries: 0` locally —
     concurrent specs registering/logging in around the same time contend for
     bcrypt+SMTP+Mongo on one local backend.
   - The dev `User` collection keeps growing — most E2E specs (unlike `admin.spec.js`, which
     deletes what it creates) never clean up their test accounts, so unpaginated queries like
     `backend/services/adminService.js`'s `listUsers()` and login get slower run over run.
   - A failure downstream of any of these (a registration/login/admin-list assertion with a
     fixed timeout) is a real, already-diagnosed contention source, not a coincidence.
4. Re-run the specific failing file in isolation (never the full parallel suite), 1–2 times:
   - Playwright: `cd frontend && npx playwright test e2e/tests/<file>.spec.js --repeat-each=2`
   - Vitest: `npx vitest run <path>.test.js` — invoke twice manually (no repeat plugin installed)
   - pytest: `python -m pytest tests/test_x.py::Class::test_name` — invoke twice manually
   - Passes reliably alone → corroborates FLAKY.
   - Fails again (same or a different, non-timeout-shaped error) → overrides a flaky hunch —
     it's a BUG that was hiding behind apparent load contention.
5. Combine via this table:

   | Error type | E2E snapshot | Known contention | Isolated re-run | Verdict |
   |---|---|---|---|---|
   | Thrown exception / 5xx / wrong data | n/a or leans bug | n/a | optional | **BUG** |
   | Timeout | leans flaky | matches | passes alone | **FLAKY** |
   | Timeout | leans flaky | matches | fails alone too | **BUG** (was hiding a real regression) |
   | Timeout | leans bug | no match | fails alone | **BUG** |
   | Timeout | ambiguous | no match | passes alone | **FLAKY**, low confidence |
   | Timeout | ambiguous | no match | fails alone, unclear | **BUG**, low confidence — file it anyway |

## Step 4 — flaky tracking (`qa/flaky_tests.json`)

Tracked in git, keyed by `"<test file path>::<full test name>"`:

```json
{
  "tests": {
    "frontend/e2e/tests/mentee-signup.spec.js::mentee can register, verify email, and see an interview-linked profile on the dashboard": {
      "layer": "e2e",
      "occurrences": [
        { "date": "2026-07-29", "runType": "local", "errorType": "expect.toHaveURL",
          "errorMessage": "Expected /\\/verify-otp/ ... Timeout: 10000ms",
          "classification": "flaky", "isolatedRerun": "passed 2/2" }
      ],
      "jiraTicket": null
    }
  }
}
```

Append one `occurrences` entry per FLAKY classification (BUG classifications skip this and
go straight to Jira, Step 6). **Escalation** (per `qa/TEST_PLAN.md` §9 — a test failing 3+
times intermittently within a week should be marked flaky and tracked as a defect): if
trailing-7-day occurrences for a test reach ≥3 and `jiraTicket` is still `null`, file a
ticket anyway (Step 7) even though no single occurrence alone was a BUG. Once `jiraTicket`
is set, stop escalating — add a comment to the existing ticket on further occurrences
instead of filing a duplicate. Once CI's `retries: 1` is active
(`.github/workflows/ci.yml`, currently a scaffold), a fail-then-pass-on-retry is a free
weaker signal — feed it in as `runType: "ci-retry"`, additive to this procedure, not instead
of it.

This skill never runs git commands — leave `qa/flaky_tests.json` modified on disk like any
other working-tree change; committing it is part of whatever commit happens next, not
something this skill does unilaterally.

## Step 5 — duplicate-prevention before filing

```
searchJiraIssuesUsingJql:
  cloudId: https://prolign.atlassian.net
  jql: project = PRO AND labels = "test-file-<slugified-file-name>" AND labels = "bug"
```

Slugify the test *file*, not the full test name (e.g. `mentee-signup.spec.js` →
`test-file-mentee-signup-spec-js`) — file-level is the right dedup granularity. Compare
matches semantically, not by string match, before deciding.

**A matched ticket in Done/Resolved/Closed status is a regression, not a duplicate** —
reopen it (`transitionJiraIssue`, after `getTransitionsForJiraIssue` to find the right
transition id) or comment-then-transition. Never silently skip as "already filed," and never
file a fresh duplicate alongside a still-relevant closed one either.

## Step 6 — file the Jira ticket (BUG case)

Use the connected Atlassian MCP tools directly (`createJiraIssue`, verified schema):

- `cloudId`: `https://prolign.atlassian.net`, `projectKey`: `PRO`, `issueTypeName`: `Bug`
- `summary`: the defect in user-facing terms, matching the existing PRO-2..PRO-39 ticket
  style (e.g. "Broken avatar images in Admin views for users with no profile photo") — never
  "test X failed." The test name/file belongs in the description, not the title.
- `description` (`contentFormat: "markdown"`, a plain string — no need to hand-roll ADF),
  sections in this order:
  1. One-paragraph description of the defect.
  2. **Steps to Reproduce** — from the test's own steps (the ARIA snapshot's test-source
     block gives this almost verbatim for E2E) plus the failing assertion.
  3. **Expected**
  4. **Actual**
  5. **Evidence** — for E2E, list each attached file with a one-line note on what it shows
     (attached via the follow-up step below, not linked as a local path); for Vitest/pytest,
     inline the relevant log/traceback excerpt directly since there's nothing to attach.
  6. **Source** — `classname`/file:line, layer (E2E / Frontend unit / Backend API /
     AI Interviewer / RAG Chatbot).
  7. **Classification rationale** — one line citing which Step-3 signal(s) led to BUG (e.g.
     "isolated re-run failed identically 2/2 outside full-suite contention") so a human can
     trust an auto-filed ticket without redoing the analysis.
- `additional_fields.priority`: `{ "name": "Highest"|"High"|"Medium"|"Low" }` — map
  Critical→Highest, same as `qa/scripts/create_jira_tickets.mjs`; default Medium unless the
  failure crashes a full critical-path E2E journey or is a thrown 5xx/security-relevant
  error (→ High/Critical), or is purely cosmetic (→ Low).
- `additional_fields.labels`: `["bug", "<component>", "<severity>", "test-file-<slug>", "qa-auto-filed"]`
  — `component` ∈ `frontend`/`backend-api`/`ai-service`/`database`, attributed to where the
  **root cause** lives, not which layer's test caught it (an E2E test catching a backend 500
  gets `backend-api`, not `frontend` — that's the whole point of the E2E layer, per
  `qa/TEST_PLAN.md` §3). Add `"flaky"` only on Step-7 escalation tickets, never on a genuine
  bug ticket — this is what keeps the two populations distinguishable even though both are
  issue type Bug.

**Attachments** — the Atlassian MCP tool set has no attachment-upload tool, so this is a
two-call sequence:
1. `createJiraIssue` → returns the new key, e.g. `PRO-45`.
2. Resolve the artifact paths from Step 2's `[[ATTACHMENT|...]]` lines to real filesystem
   paths, then:
   ```
   node qa/scripts/attach_jira_files.mjs PRO-45 \
     "frontend/test-results/<folder>/test-failed-1.png" \
     "frontend/test-results/<folder>/video.webm" \
     "frontend/test-results/<folder>/error-context.md" \
     "frontend/test-results/<folder>/trace.zip"
   ```
   This script reuses `qa/scripts/.env.jira`'s credentials (same pattern as
   `create_jira_tickets.mjs`) and reports per-file success/failure — check its output, don't
   assume "ticket created" means "evidence attached" (Jira's attachment size cap can reject
   a large video/trace silently-ish).
3. Optionally `addCommentToJiraIssue` captioning what was attached (Jira doesn't
   auto-caption uploads).
4. Vitest/pytest failures with no binary artifacts skip step 2 entirely — the log excerpt is
   already inline in the description.

## Step 7 — persistent-flakiness escalation

When Step 4's trailing-7-day count hits ≥3 for a test still `jiraTicket: null`, file using
the same Step 6 structure, but:
- Summary framed as recurring flakiness, not a one-off defect (e.g. "`admin.spec.js`'s
  member-detail check has flaked 3× this week — needs an owner").
- **Steps to Reproduce** replaced with an occurrence table pulled straight from
  `qa/flaky_tests.json` (date, error type/message, classification per occurrence).
- Add the `flaky` label in addition to `bug` + component + `qa-auto-filed`.
- Leave Assignee unset with a one-line note ("needs an owner assigned per
  `qa/TEST_PLAN.md` §9") rather than guessing one.
- Write the returned key back into `qa/flaky_tests.json`'s `jiraTicket` field for that test.

## Edge cases

- **Jira unreachable mid-run**: don't abort the whole triage pass. Queue the fully-built
  ticket payload + resolved artifact paths to
  `qa/pending_jira_tickets/<timestamp>-<slug>.json` and keep processing the remaining
  failures. Flush this queue first on the next invocation, before handling new failures.
- **Multiple failures in one run share a root cause** (e.g. several specs failing together
  from the same Mongo-growth contention): file one ticket and `createIssueLink` "relates to"
  the rest, rather than N near-identical tickets.
- **Component label requires attributing root cause, not test layer** — getting this wrong
  misfiles exactly the cross-layer bugs E2E exists to catch.
