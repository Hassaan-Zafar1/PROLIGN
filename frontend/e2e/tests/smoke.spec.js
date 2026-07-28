import { test, expect } from '../fixtures/base.js';

// Phase 0 harness-verification smoke test — proves Playwright (config,
// webServer auto-start, browser install, POM/fixture wiring) works before
// Phase 3 adds the real prioritized user-journey specs (auth, mentor
// discovery, booking, admin) under this same tests/ folder.
test('landing page loads', async ({ landingPage, page }) => {
  await landingPage.goto();
  await expect(page).toHaveTitle(/ProLign/);
});
