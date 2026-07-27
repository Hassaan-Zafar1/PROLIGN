import { defineConfig, devices } from '@playwright/test';

// Separate from vitest.config.js on purpose: Playwright drives a real browser
// against the running app (frontend + backend + Mongo, and for AI-dependent
// flows the Python services too), unlike Vitest's jsdom unit/component tests.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Auto-starts the Vite dev server for local runs; in CI, start it (and the
  // backend) yourself first and set PLAYWRIGHT_SKIP_WEBSERVER=1 if preferred.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
