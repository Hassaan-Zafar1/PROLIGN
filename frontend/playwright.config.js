import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

// Gherkin .feature files + step definitions get compiled into plain Playwright
// spec files here (via `bddgen`) before the runner ever sees them — testDir
// points at that generated output, not the .feature files themselves.
const testDir = defineBddConfig({
  features: 'e2e/features/**/*.feature',
  // fixtures/base.js is where createBdd(test) is actually called — including
  // it here lets playwright-bdd auto-detect the custom test/fixtures export
  // (current versions no longer need the separate importTestFrom option).
  steps: ['e2e/features/steps/**/*.js', 'e2e/fixtures/base.js'],
  outputDir: 'e2e/.features-gen',
});

// Separate from vitest.config.js on purpose: Playwright drives a real browser
// against the running app (frontend + backend + Mongo, and for AI-dependent
// flows the Python services too), unlike Vitest's jsdom unit/component tests.
export default defineConfig({
  testDir,
  globalSetup: './e2e/global-setup.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 1 retry in CI only — matches qa/TEST_PLAN.md's retry policy. A test that
  // fails once then passes on retry is flagged as potentially flaky (see the
  // HTML/JUnit report's retry annotations), not silently treated as green.
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['html', { outputFolder: './reports/e2e-html', open: 'never' }],
    ['junit', { outputFile: './reports/e2e-junit.xml' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
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
