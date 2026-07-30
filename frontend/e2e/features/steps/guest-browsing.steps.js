import { Given, When, Then, expect } from '../../fixtures/base.js';

Given('a mentor is available to browse', async ({ world, testUsers, api }) => {
  // Seed one mentor so Find Mentors always has at least one card, regardless
  // of whatever else is already in the dev database.
  world.mentor = testUsers.mentor();
  await api.registerAndVerify({
    email: world.mentor.email,
    password: world.mentor.password,
    role: 'mentor',
    name: world.mentor.name,
    linkedinUrl: world.mentor.linkedIn,
    hourlyRate: Number(world.mentor.hourlyRate),
  });
});

When('I browse Find Mentors as a guest, with no authentication', async ({ mentorDiscoveryPage }) => {
  // Genuinely no authentication in this browser context — a real guest.
  await mentorDiscoveryPage.goto();
});

Then('at least one mentor card should be visible', async ({ mentorDiscoveryPage }) => {
  await expect(mentorDiscoveryPage.firstCard()).toBeVisible();
});

When('the guest views the first mentor\'s profile', async ({ mentorDiscoveryPage }) => {
  await mentorDiscoveryPage.viewFirstMentor();
});

Then('the guest should reach the mentor\'s profile page', async ({ page }) => {
  await expect(page).toHaveURL(/\/mentor\/[^/]+$/);
});

When('the guest starts booking a session with that mentor', async ({ mentorProfilePage }) => {
  // This is the actual regression check: GET /reviews?mentorId= fires here
  // unauthenticated. If it 401s and the interceptor reloads, this button
  // never becomes visible/clickable and the scenario times out instead of
  // reaching the assertion below.
  await mentorProfilePage.bookSession();
});

Then('the guest should reach the booking page without looping', async ({ page }) => {
  await expect(page).toHaveURL(/\/book\/[^/]+$/);
  // Same regression on the booking page — GET /availability?mentorId= fires
  // here, also unauthenticated.
  await expect(page.getByRole('button', { name: 'Continue to Payment' })).toBeVisible();
});
