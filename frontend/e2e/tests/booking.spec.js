import { test, expect } from '../fixtures/base.js';

// Covers TC-BOOKING (qa/test_cases_testrail_import.csv): a logged-in mentee
// browses a mentor's real availability and books a session through to the
// payment step. Stripe's own hosted card UI is out of scope — this suite only
// owns the app logic up through the real POST /sessions call.
test.describe('Booking a session (logged-in mentee)', () => {
  test('mentee can browse a mentor\'s availability and book a session', async ({
    page, loginPage, mentorDiscoveryPage, testUsers, api,
  }) => {
    const mentor = testUsers.mentor();
    const mentorAuth = await api.registerAndVerify({
      email: mentor.email, password: mentor.password, role: 'mentor', name: mentor.name,
      linkedinUrl: mentor.linkedIn, hourlyRate: Number(mentor.hourlyRate),
    });

    // A concrete one-off slot for tomorrow, so the booking calendar always has
    // something available regardless of when this spec happens to run.
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const d = String(tomorrow.getDate()).padStart(2, '0');
    await api.apiCreateAvailabilitySlot(mentorAuth.accessToken, {
      date: `${y}-${m}-${d}`, startTime: '10:00', endTime: '10:30',
    });

    const mentee = testUsers.mentee();
    await api.registerAndVerify({ email: mentee.email, password: mentee.password, role: 'mentee', name: mentee.name });

    await loginPage.goto();
    await loginPage.login(mentee.email, mentee.password);
    // Must wait for the app's own post-login redirect before navigating away
    // — the token is written to localStorage by an async response handler,
    // and calling mentorDiscoveryPage.goto() (a full page navigation) too
    // early aborts that handler mid-flight, so the token never gets saved.
    // A fresh mentee is routed to /interview (profile incomplete) — that's
    // fine, Find Mentors and booking are public routes reachable regardless.
    await expect(page).toHaveURL(/\/interview/);

    await mentorDiscoveryPage.goto();
    // Filter by name so this test only ever interacts with the mentor it just
    // created, not some other run's leftover card.
    await page.getByPlaceholder('Search mentors...').fill(mentor.name);
    const card = page.locator('article').filter({ hasText: mentor.name });
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'Book' }).click();

    await expect(page).toHaveURL(/\/book\/[^/]+$/);
    // "Continue to Payment" is never disabled — clicking it without an
    // explicitly-selected slot just opens a "Select a Time Slot" modal
    // instead of proceeding. The calendar auto-jumps to the seeded slot's
    // date, but the time slot itself still needs an explicit click.
    const slotButton = page.getByRole('button', { name: /\d{1,2}:\d{2}\s?(AM|PM)\s*-\s*\d{1,2}:\d{2}\s?(AM|PM)/i }).first();
    await expect(slotButton).toBeVisible();
    await slotButton.click();
    await page.getByRole('button', { name: 'Continue to Payment' }).click();

    // This is the real boundary: POST /sessions succeeded and the UI advanced
    // into the Stripe payment step. Generous timeout — this is a real network
    // round trip to a remote dev database, which has flaked under load late
    // in a long serial run.
    await expect(page.getByRole('button', { name: /^Pay \$/ })).toBeVisible({ timeout: 15000 });
  });
});
