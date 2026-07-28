import { test, expect } from '../fixtures/base.js';

// Regression coverage for TC-REGRESSION-001/002/003 (qa/test_cases_testrail_import.csv):
// a guest clicking View/Book used to get stuck in an infinite reload loop —
// GET /reviews and GET /availability were fully auth-gated, and the axios
// interceptor reloaded the page on *any* 401, even a guest's who never had a
// token to refresh in the first place. If either regression reappears, this
// test times out waiting for the next page to render, rather than passing.
test.describe('Guest browsing (no login)', () => {
  test('guest can browse mentors, view a profile, and reach booking without looping', async ({
    page, mentorDiscoveryPage, mentorProfilePage, api, testUsers,
  }) => {
    // Seed one mentor so Find Mentors always has at least one card, regardless
    // of whatever else is already in the dev database.
    const mentor = testUsers.mentor();
    await api.registerAndVerify({
      email: mentor.email,
      password: mentor.password,
      role: 'mentor',
      name: mentor.name,
      linkedinUrl: mentor.linkedIn,
      hourlyRate: Number(mentor.hourlyRate),
    });

    // Genuinely no authentication in this browser context — a real guest.
    await mentorDiscoveryPage.goto();
    await expect(mentorDiscoveryPage.firstCard()).toBeVisible();

    await mentorDiscoveryPage.viewFirstMentor();
    await expect(page).toHaveURL(/\/mentor\/[^/]+$/);
    // This is the actual regression check: GET /reviews?mentorId= fires here
    // unauthenticated. If it 401s and the interceptor reloads, this button
    // never becomes visible/clickable and the test times out instead of
    // reaching the assertion below.
    await mentorProfilePage.bookSession();
    await expect(page).toHaveURL(/\/book\/[^/]+$/);

    // Same regression on the booking page — GET /availability?mentorId=
    // fires here, also unauthenticated.
    await expect(page.getByRole('button', { name: 'Continue to Payment' })).toBeVisible();
  });
});
