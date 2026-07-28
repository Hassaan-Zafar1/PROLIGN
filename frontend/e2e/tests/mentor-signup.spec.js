import { test, expect } from '../fixtures/base.js';
import { buildSampleCvPdf } from '../data/sampleCv.js';

// Covers the full mentor onboarding journey (qa/test_cases_testrail_import.csv,
// Mentee/Mentor Profile CRUD + Auth sections): register through the UI, verify
// email via OTP, upload a CV, and land on the dashboard with an auto-built
// profile. MentorOnboarding.jsx deliberately holds its "building profile"
// screen for a minimum ~10s (plus a ~2.2s auto-advance) for UX pacing — this
// test's timeout is extended to give that real, unmockable wait room to run.
test.describe('Mentor signup: register -> OTP -> CV build -> dashboard', () => {
  test('mentor can register, verify email, and reach the dashboard with a built profile', async ({
    page, mentorRegistrationPage, otpPage, mentorDashboardPage, testUsers, api,
  }) => {
    test.setTimeout(90000);

    const mentor = testUsers.mentor();

    await mentorRegistrationPage.goto();
    await mentorRegistrationPage.fillAccountStep({ name: mentor.name, email: mentor.email, password: mentor.password });
    await expect(page.getByRole('heading', { name: 'Professional Information' })).toBeVisible();
    await mentorRegistrationPage.fillProfessionalStep({ linkedIn: mentor.linkedIn, hourlyRate: mentor.hourlyRate });
    await expect(page.getByRole('heading', { name: 'Profile Setup' })).toBeVisible();
    await mentorRegistrationPage.uploadCv(buildSampleCvPdf());
    // Cloudinary CV upload has its own 20s client-side timeout before falling
    // back gracefully — give this step real room instead of the default 5s.
    await expect(page.getByRole('heading', { name: 'Review & Submit' })).toBeVisible({ timeout: 25000 });
    await mentorRegistrationPage.submit();

    // The app carries the new user's id via sessionStorage (not the URL) into
    // the OTP page — read it the same way the app does, then fetch the OTP
    // through the dev-only side channel (real OTPs are only ever readable as
    // a SHA-256 hash in Mongo).
    await expect(page).toHaveURL(/\/verify-otp/);
    const userId = await page.evaluate(() => sessionStorage.getItem('otpUserId'));
    const otp = await api.apiGetLastOtp(userId);
    await otpPage.verify(otp);

    // OTPVerification.jsx routes a freshly-verified mentor into profile
    // building, which runs a real POST to build the profile from the
    // uploaded CV, then auto-advances to the dashboard once done. Generous
    // timeouts here — both are real network round trips against a remote
    // dev database, which has flaked under load elsewhere in this suite.
    await expect(page).toHaveURL(/\/mentor\/onboarding/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/mentor\/dashboard/, { timeout: 20000 });

    // MentorDashboard's "Your Profile" heading (and its Rating row) render
    // unconditionally, proving the dashboard actually rendered post-build.
    await expect(mentorDashboardPage.profileHeading).toBeVisible();
  });
});
