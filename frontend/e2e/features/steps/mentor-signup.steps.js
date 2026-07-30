import { Given, When, Then, expect } from '../../fixtures/base.js';
import { buildSampleCvPdf } from '../../data/sampleCv.js';

Given('a new mentor fills out the account step of registration', async ({ world, testUsers, mentorRegistrationPage }) => {
  world.mentor = testUsers.mentor();
  await mentorRegistrationPage.goto();
  await mentorRegistrationPage.fillAccountStep({
    name: world.mentor.name,
    email: world.mentor.email,
    password: world.mentor.password,
  });
});

Then('the Professional Information step should be shown', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Professional Information' })).toBeVisible();
});

When('they fill out the professional information step', async ({ mentorRegistrationPage, world }) => {
  await mentorRegistrationPage.fillProfessionalStep({
    linkedIn: world.mentor.linkedIn,
    hourlyRate: world.mentor.hourlyRate,
  });
});

Then('the Profile Setup step should be shown', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Profile Setup' })).toBeVisible();
});

When('they upload their CV', async ({ mentorRegistrationPage }) => {
  await mentorRegistrationPage.uploadCv(buildSampleCvPdf());
});

Then('the Review & Submit step should be shown', async ({ page }) => {
  // Cloudinary CV upload has its own 20s client-side timeout before falling
  // back gracefully — give this step real room instead of the default 5s.
  await expect(page.getByRole('heading', { name: 'Review & Submit' })).toBeVisible({ timeout: 25000 });
});

When('they submit the mentor application', async ({ mentorRegistrationPage }) => {
  await mentorRegistrationPage.submit();
});

Then('they should be redirected to the OTP verification page', async ({ page }) => {
  await expect(page).toHaveURL(/\/verify-otp/);
});

Then('their profile should be built and the mentor dashboard reached', async ({ page, mentorDashboardPage }) => {
  // OTPVerification.jsx routes a freshly-verified mentor into profile
  // building, which runs a real POST to build the profile from the uploaded
  // CV, then auto-advances to the dashboard once done. Generous timeouts
  // here — both are real network round trips against a remote dev database,
  // which has flaked under load elsewhere in this suite.
  await expect(page).toHaveURL(/\/mentor\/onboarding/, { timeout: 10000 });
  await expect(page).toHaveURL(/\/mentor\/dashboard/, { timeout: 20000 });
  // MentorDashboard's "Your Profile" heading (and its Rating row) render
  // unconditionally, proving the dashboard actually rendered post-build.
  await expect(mentorDashboardPage.profileHeading).toBeVisible();
});
