---
name: playwright
description: Playwright E2E conventions for ProLign — Page Object Model, fixtures, data-driven test data, retry policy. Load when writing or editing any frontend/e2e/** file.
---

# Playwright conventions (ProLign)

## Folder structure — this is the actual layout, not a suggestion

```
frontend/e2e/
├── tests/       ← *.spec.js files (the scenario, test data, assertions)
├── pages/       ← Page Object classes (locators + page-specific actions)
├── fixtures/    ← base.js extends Playwright's test with custom fixtures
├── data/        ← deterministic test data generators
└── reports/     ← generated (git-ignored), don't hand-edit
```

Config: `frontend/playwright.config.js` (`testDir: './e2e/tests'`). Business-level feature
specs (what to test and why) live separately in `qa/specifications/` — don't confuse those
markdown specs with these executable `.spec.js` files.

## Every test imports from `fixtures/base.js`, never `@playwright/test` directly

```js
import { test, expect } from '../fixtures/base.js';

test('scenario name', async ({ landingPage, page }) => {
  await landingPage.goto();
  await expect(page).toHaveTitle(/ProLign/);
});
```

`fixtures/base.js` extends Playwright's `test` with one fixture per page object (see
`landingPage` there for the existing pattern) plus a `testUsers` fixture backed by
`data/users.js`. When adding a new page object, wire it into `base.js` the same way rather
than constructing it inline inside a test file.

## Page Object Model

One class per user-facing page (`pages/LandingPage.js` is the existing example). A page
object holds **locators and page-specific actions only** — no assertions, no test data.
Test files hold the scenario, the data, and the assertions. This means a markup change
means editing one page object file, not every spec that touches that page.

```js
export class LoginPage {
  constructor(page) { this.page = page; }
  async goto() { await this.page.goto('/login'); }
  async login(email, password) {
    await this.page.fill('#login-email', email);
    await this.page.fill('#login-password', password);
    await this.page.getByRole('button', { name: /login/i }).click();
  }
}
```

## Data-driven testing

`data/*.js` exports data generators, not hardcoded fixtures reused across test runs —
`data/users.js`'s `uniqueEmail()` pattern (timestamp + random suffix) avoids collisions
when the same spec runs repeatedly against a real, persistent dev database. Never assume
a test can rely on data another, unrelated test created.

## Retry policy — already configured, don't change without updating `qa/TEST_PLAN.md`

`retries: process.env.CI ? 1 : 0` in `playwright.config.js`. A test that fails then passes
on retry shows up flagged in the HTML/JUnit report — that's a signal to investigate
flakiness, not something to silently accept. Never add manual retry loops or `waitForTimeout`
sleeps inside a test to paper over flakiness; use Playwright's own auto-waiting
(`expect(locator).toBeVisible()` etc.) instead.

## Failure artifacts (already configured)

`use.screenshot: 'only-on-failure'`, `use.video: 'retain-on-failure'`, `use.trace:
'on-first-retry'`. On a failure, check `frontend/e2e/reports/e2e-html/` for the full trace
viewer before re-running blind.

## Critical-path scope, not exhaustive page coverage

Playwright is the top of the test pyramid — reserve it for full user journeys (signup →
OTP → dashboard, guest browse → book, admin approve/reject) per `qa/TEST_PLAN.md` §2/§7.
Field-level validation, component rendering, and API contract details belong at the
Vitest/Supertest/pytest levels — don't re-test them here just because a page is already
open in the browser.
