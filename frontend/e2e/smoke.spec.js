import { test, expect } from '@playwright/test';

// Phase 0 harness-verification smoke test — proves Playwright is wired up
// correctly (config, webServer auto-start, browser install) before Phase 3
// adds the real prioritized user-journey specs.
test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/ProLign/);
});
