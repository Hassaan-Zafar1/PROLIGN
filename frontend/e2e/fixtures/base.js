// Shared fixtures — extends Playwright's own `test`/`expect` so every spec
// imports from here instead of '@playwright/test' directly. One fixture per
// page object; specs destructure whichever they need instead of constructing
// page objects themselves.
//
// `test` is built on playwright-bdd's wrapper (not '@playwright/test' directly)
// so that `createBdd(test)` below can generate Given/When/Then bound to these
// same fixtures — step definitions destructure fixtures exactly like the old
// test bodies did. `expect` is untouched, still straight from '@playwright/test'.
import { test as base, createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { LandingPage } from '../pages/LandingPage.js';
import { LoginPage } from '../pages/LoginPage.js';
import { MenteeRegistrationPage } from '../pages/MenteeRegistrationPage.js';
import { MentorRegistrationPage } from '../pages/MentorRegistrationPage.js';
import { OtpPage } from '../pages/OtpPage.js';
import { MentorDiscoveryPage } from '../pages/MentorDiscoveryPage.js';
import { MentorProfilePage } from '../pages/MentorProfilePage.js';
import { BookingPage } from '../pages/BookingPage.js';
import { AdminDashboardPage } from '../pages/AdminDashboardPage.js';
import { MenteeDashboardPage } from '../pages/MenteeDashboardPage.js';
import { MentorDashboardPage } from '../pages/MentorDashboardPage.js';
import { testUsers } from '../data/users.js';
import * as api from './apiHelpers.js';

export const test = base.extend({
  landingPage: async ({ page }, use) => { await use(new LandingPage(page)); },
  loginPage: async ({ page }, use) => { await use(new LoginPage(page)); },
  menteeRegistrationPage: async ({ page }, use) => { await use(new MenteeRegistrationPage(page)); },
  mentorRegistrationPage: async ({ page }, use) => { await use(new MentorRegistrationPage(page)); },
  otpPage: async ({ page }, use) => { await use(new OtpPage(page)); },
  mentorDiscoveryPage: async ({ page }, use) => { await use(new MentorDiscoveryPage(page)); },
  mentorProfilePage: async ({ page }, use) => { await use(new MentorProfilePage(page)); },
  bookingPage: async ({ page }, use) => { await use(new BookingPage(page)); },
  adminDashboardPage: async ({ page }, use) => { await use(new AdminDashboardPage(page)); },
  menteeDashboardPage: async ({ page }, use) => { await use(new MenteeDashboardPage(page)); },
  mentorDashboardPage: async ({ page }, use) => { await use(new MentorDashboardPage(page)); },
  testUsers: async ({}, use) => { await use(testUsers); },
  api: async ({}, use) => { await use(api); },
  // Per-scenario scratch space for BDD step definitions to pass state between
  // Given/When/Then (e.g. the account a "Given a verified mentor account
  // exists" step just created). A plain module-level variable would be shared
  // — and racy — across concurrently-running scenarios under fullyParallel;
  // a fixture is re-created fresh per test, giving each scenario the same
  // isolation the original tests got for free from their local `const` closures.
  world: async ({}, use) => { await use({}); },
});

export const { Given, When, Then } = createBdd(test);
export { expect };
