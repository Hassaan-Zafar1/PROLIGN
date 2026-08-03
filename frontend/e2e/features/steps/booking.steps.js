import { Given, When, Then, expect } from '../../fixtures/base.js';

Given('a mentor with an available slot tomorrow at 10:00 AM exists', async ({ world, testUsers, api }) => {
  world.mentor = testUsers.mentor();
  const mentorAuth = await api.registerAndVerify({
    email: world.mentor.email,
    password: world.mentor.password,
    role: 'mentor',
    name: world.mentor.name,
    linkedinUrl: world.mentor.linkedIn,
    hourlyRate: Number(world.mentor.hourlyRate),
  });
  // A concrete one-off slot for tomorrow, so the booking calendar always has
  // something available regardless of when this scenario happens to run.
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const y = tomorrow.getFullYear();
  const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const d = String(tomorrow.getDate()).padStart(2, '0');
  await api.apiCreateAvailabilitySlot(mentorAuth.accessToken, {
    date: `${y}-${m}-${d}`, startTime: '10:00', endTime: '10:30',
  });
});

Then('the mentee should land on the interview page', async ({ page }) => {
  // Must wait for the app's own post-login redirect before navigating away —
  // the token is written to localStorage by an async response handler, and
  // navigating away (a full page navigation) too early aborts that handler
  // mid-flight, so the token never gets saved. A fresh mentee is routed to
  // /interview (profile incomplete) — that's fine, Find Mentors and booking
  // are public routes reachable regardless.
  await expect(page).toHaveURL(/\/interview/);
});

When('the mentee searches for that mentor on the Find Mentors page', async ({ page, mentorDiscoveryPage, world }) => {
  await mentorDiscoveryPage.goto();
  // Filter by name so this scenario only ever interacts with the mentor it
  // just created, not some other run's leftover card.
  await page.getByPlaceholder('Search mentors...').fill(world.mentor.name);
});

Then('the mentor\'s card should be visible', async ({ page, world }) => {
  world.card = page.locator('article').filter({ hasText: world.mentor.name });
  await expect(world.card).toBeVisible();
});

When('the mentee clicks Book on the mentor\'s card', async ({ world }) => {
  await world.card.getByRole('button', { name: 'Book' }).click();
});

Then('the mentee should reach the booking page', async ({ page }) => {
  await expect(page).toHaveURL(/\/book\/[^/]+$/);
});

When('the mentee selects the available time slot', async ({ page }) => {
  // "Continue to Payment" is never disabled — clicking it without an
  // explicitly-selected slot just opens a "Select a Time Slot" modal instead
  // of proceeding. The calendar auto-jumps to the seeded slot's date, but the
  // time slot itself still needs an explicit click.
  const slotButton = page
    .getByRole('button', { name: /\d{1,2}:\d{2}\s?(AM|PM)\s*-\s*\d{1,2}:\d{2}\s?(AM|PM)/i })
    .first();
  await expect(slotButton).toBeVisible();
  await slotButton.click();
});

When('the mentee continues to payment', async ({ page }) => {
  await page.getByRole('button', { name: 'Continue to Payment' }).click();
});

Then('the Stripe payment step should be reached', async ({ page }) => {
  // This is the real boundary: POST /sessions succeeded and the UI advanced
  // into the Stripe payment step. Generous timeout — this is a real network
  // round trip to a remote dev database, which has flaked under load late in
  // a long serial run.
  await expect(page.getByRole('button', { name: /^Pay \$/ })).toBeVisible({ timeout: 15000 });
});
