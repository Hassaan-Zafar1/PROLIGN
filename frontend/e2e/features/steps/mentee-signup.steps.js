import { Given, When, Then, expect } from '../../fixtures/base.js';

Given('a new mentee fills out the registration form', async ({ world, testUsers, menteeRegistrationPage }) => {
  world.mentee = testUsers.mentee();
  await menteeRegistrationPage.goto();
});

When('they submit the registration form', async ({ menteeRegistrationPage, world }) => {
  await menteeRegistrationPage.register({
    name: world.mentee.name,
    email: world.mentee.email,
    password: world.mentee.password,
  });
});

Then('they should be taken to the OTP verification page', async ({ page }) => {
  // Generous timeout: registration awaits a real, blocking SMTP send
  // (services/emailService.js) on every /auth/register call — under
  // fullyParallel local runs, concurrent registrations from other specs
  // contend for it and have flaked past the default 5000ms here before.
  await expect(page).toHaveURL(/\/verify-otp/, { timeout: 10000 });
});

Then('they should be routed to the interview page', async ({ page }) => {
  // A freshly-verified mentee is routed straight to the interview (no
  // profile-building screen like mentors get) — must wait for that redirect
  // (and the token write it carries) before reading localStorage. Generous
  // timeout: this follows a real POST /auth/verify-otp round trip against a
  // remote dev database, which has flaked under load elsewhere.
  await expect(page).toHaveURL(/\/interview/, { timeout: 10000 });
});

When('a completed interview profile is seeded and linked to their account', async ({ page, api }) => {
  const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
  const sessionId = await api.apiSeedMenteeProfile({});
  await api.apiLinkInterview(accessToken, sessionId);
});

When('they go to their dashboard', async ({ menteeDashboardPage }) => {
  await menteeDashboardPage.goto();
});

Then('their populated profile should be visible', async ({ menteeDashboardPage }) => {
  // The "Your Profile" section only renders once university/degree/etc. are
  // set — proof the interview-link flow actually populated real data, not
  // just that the dashboard rendered at all.
  await expect(menteeDashboardPage.profileHeading).toBeVisible();
});
