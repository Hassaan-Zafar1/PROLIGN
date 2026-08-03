import { Given, When, Then, expect } from '../../fixtures/base.js';

Then('they should be routed to the interview, since their profile isn\'t complete yet', async ({ page }) => {
  // A fresh mentee has isProfileComplete=false, so homeRouteKeyForUser sends
  // them to /interview, not the dashboard — that's correct app behavior (see
  // routeConfig.js), not a login failure.
  await expect(page).toHaveURL(/\/interview/);
});

Then('they should reach the mentor dashboard', async ({ page }) => {
  // Mentors have no profile-completeness gate — straight to the dashboard.
  await expect(page).toHaveURL(/\/mentor\/dashboard/);
});

Given('the seeded E2E admin account', async () => {
  // Seeded by global-setup.js before the suite runs — nothing to do here.
});

When('the admin logs in', async ({ page, loginPage }) => {
  await loginPage.goto();
  await loginPage.login('e2e-admin@prolign.test', 'E2eAdmin@12345');
});

Then('they should reach the admin dashboard', async ({ page }) => {
  await expect(page).toHaveURL(/\/admin/);
});

When('they log out', async ({ page }) => {
  await page.getByRole('button', { name: 'Logout' }).click();
});

Then('they should be redirected away from the mentor dashboard', async ({ page }) => {
  // A generous timeout here — logout awaits a real POST /auth/logout call
  // before navigating, and the default 5s assertion timeout has flaked under
  // real (remote-DB) network latency.
  await expect(page).not.toHaveURL(/\/mentor\/dashboard/, { timeout: 10000 });
});

Then('revisiting the mentor dashboard directly should also redirect away', async ({ page }) => {
  // Session must actually be cleared — revisiting the dashboard directly
  // should bounce back to a public page, not silently stay authenticated.
  await page.goto('/mentor/dashboard');
  await expect(page).not.toHaveURL(/\/mentor\/dashboard/);
});
