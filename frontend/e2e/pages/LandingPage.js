// Page Object Model: one class per user-facing page. Holds locators + page-
// specific actions only — test files hold the scenario, data, and assertions
// (see e2e/tests/smoke.spec.js). This keeps raw selectors out of test files
// and in exactly one place per page, so a markup change means editing one
// file, not every spec that touches that page.
export class LandingPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/');
  }
}
