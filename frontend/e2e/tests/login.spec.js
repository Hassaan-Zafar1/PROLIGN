import { test, expect } from '../fixtures/base.js';

test.describe('Login and logout, all three roles', () => {
  test('mentee can log in and is routed to the interview (profile not yet complete)', async ({ page, loginPage, testUsers, api }) => {
    const mentee = testUsers.mentee();
    await api.registerAndVerify({ email: mentee.email, password: mentee.password, role: 'mentee', name: mentee.name });

    await loginPage.goto();
    await loginPage.login(mentee.email, mentee.password);
    // A fresh mentee has isProfileComplete=false, so homeRouteKeyForUser sends
    // them to /interview, not the dashboard — that's correct app behavior
    // (see routeConfig.js), not a login failure.
    await expect(page).toHaveURL(/\/interview/);
  });

  test('mentor can log in and reach their dashboard', async ({ page, loginPage, testUsers, api }) => {
    const mentor = testUsers.mentor();
    await api.registerAndVerify({
      email: mentor.email, password: mentor.password, role: 'mentor', name: mentor.name,
      linkedinUrl: mentor.linkedIn, hourlyRate: Number(mentor.hourlyRate),
    });

    await loginPage.goto();
    await loginPage.login(mentor.email, mentor.password);
    // Mentors have no profile-completeness gate — straight to the dashboard.
    await expect(page).toHaveURL(/\/mentor\/dashboard/);
  });

  test('admin can log in and reach the admin dashboard', async ({ page, loginPage }) => {
    // Seeded by global-setup.js before the suite runs.
    await loginPage.goto();
    await loginPage.login('e2e-admin@prolign.test', 'E2eAdmin@12345');
    await expect(page).toHaveURL(/\/admin/);
  });

  test('logout returns to a public page and clears the session', async ({ page, loginPage, testUsers, api }) => {
    const mentor = testUsers.mentor(); // mentor login has no profile-completeness redirect to work around
    await api.registerAndVerify({
      email: mentor.email, password: mentor.password, role: 'mentor', name: mentor.name,
      linkedinUrl: mentor.linkedIn, hourlyRate: Number(mentor.hourlyRate),
    });

    await loginPage.goto();
    await loginPage.login(mentor.email, mentor.password);
    await expect(page).toHaveURL(/\/mentor\/dashboard/);

    await page.getByRole('button', { name: 'Logout' }).click();
    // A generous timeout here — logout awaits a real POST /auth/logout call
    // before navigating, and the default 5s assertion timeout has flaked
    // under real (remote-DB) network latency.
    await expect(page).not.toHaveURL(/\/mentor\/dashboard/, { timeout: 10000 });

    // Session must actually be cleared — revisiting the dashboard directly
    // should bounce back to a public page, not silently stay authenticated.
    await page.goto('/mentor/dashboard');
    await expect(page).not.toHaveURL(/\/mentor\/dashboard/);
  });
});
