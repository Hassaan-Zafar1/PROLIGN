import { test, expect } from '../fixtures/base.js';

// Covers the mentee onboarding journey (qa/test_cases_testrail_import.csv,
// Mentee Interview + Auth sections): register through the UI, verify email
// via OTP, then land on the dashboard with a profile populated from the
// interview. The real interview is a live, non-deterministic AI conversation
// (Ayla, on the separate Python AI_interviewer service) — driving that
// end-to-end is out of scope here. Instead this seeds a completed interview
// profile via the dev-only side channel and links it through the REAL
// POST /api/interview endpoint (interviewService.submitInterview), exercising
// the actual account-linking code path the app itself depends on.
test.describe('Mentee signup: register -> OTP -> interview link -> dashboard', () => {
  test('mentee can register, verify email, and see an interview-linked profile on the dashboard', async ({
    page, menteeRegistrationPage, otpPage, menteeDashboardPage, testUsers, api,
  }) => {
    const mentee = testUsers.mentee();

    await menteeRegistrationPage.goto();
    await menteeRegistrationPage.register({
      name: mentee.name,
      email: mentee.email,
      password: mentee.password,
    });

    await expect(page).toHaveURL(/\/verify-otp/);
    const userId = await page.evaluate(() => sessionStorage.getItem('otpUserId'));
    const otp = await api.apiGetLastOtp(userId);
    await otpPage.verify(otp);

    // A freshly-verified mentee is routed straight to the interview (no
    // profile-building screen like mentors get) — must wait for that
    // redirect (and the token write it carries) before reading localStorage.
    // Generous timeout: this follows a real POST /auth/verify-otp round trip
    // against a remote dev database, which has flaked under load elsewhere.
    await expect(page).toHaveURL(/\/interview/, { timeout: 10000 });
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));

    const sessionId = await api.apiSeedMenteeProfile({});
    await api.apiLinkInterview(accessToken, sessionId);

    await menteeDashboardPage.goto();
    // The "Your Profile" section only renders once university/degree/etc. are
    // set — proof the interview-link flow actually populated real data, not
    // just that the dashboard rendered at all.
    await expect(menteeDashboardPage.profileHeading).toBeVisible();
  });
});
