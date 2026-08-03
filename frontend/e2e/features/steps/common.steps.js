// Steps shared by ≥2 feature files — account creation and self-service login
// are the same action/meaning everywhere they appear, so they're written once
// here rather than duplicated with slightly different wording per feature.
// Feature-specific steps (including the admin-management login variants with
// their own hardcoded credentials) stay local to their own <name>.steps.js.
import { Given, When } from '../../fixtures/base.js';

Given('a verified mentor account exists', async ({ world, testUsers, api }) => {
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

Given('a verified mentee account exists', async ({ world, testUsers, api }) => {
  world.mentee = testUsers.mentee();
  await api.registerAndVerify({
    email: world.mentee.email,
    password: world.mentee.password,
    role: 'mentee',
    name: world.mentee.name,
  });
});

When('the mentor logs in', async ({ page, loginPage, world }) => {
  await loginPage.goto();
  await loginPage.login(world.mentor.email, world.mentor.password);
});

When('the mentee logs in', async ({ page, loginPage, world }) => {
  await loginPage.goto();
  await loginPage.login(world.mentee.email, world.mentee.password);
});

// Identical action in both mentee-signup.feature and mentor-signup.feature:
// the app carries the new user's id via sessionStorage (not the URL) into the
// OTP page — read it the same way the app does, then fetch the OTP through
// the dev-only side channel (real OTPs are only ever readable as a SHA-256
// hash in Mongo).
When('the OTP is fetched via the dev-only test channel and submitted', async ({ page, otpPage, api }) => {
  const userId = await page.evaluate(() => sessionStorage.getItem('otpUserId'));
  const otp = await api.apiGetLastOtp(userId);
  await otpPage.verify(otp);
});
