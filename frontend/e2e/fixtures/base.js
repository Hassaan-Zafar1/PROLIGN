// Shared fixtures — extends Playwright's own `test`/`expect` so every spec
// imports from here instead of '@playwright/test' directly. One fixture per
// page object; specs destructure whichever they need instead of constructing
// page objects themselves.
import { test as base, expect } from '@playwright/test';
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
});

export { expect };
