// Runs once before the whole Playwright suite. Ensures a dedicated E2E admin
// account exists (idempotent upsert via the dev-only test-helper endpoint —
// see backend/routes/testHelpers.js) so the admin journey doesn't depend on
// someone having manually run backend/scripts/createAdmin.js first, and never
// touches whatever real admin@prolign.com account a developer may have.
//
// Assumes the backend is already running (per qa/TEST_PLAN.md — Playwright's
// webServer only auto-starts the frontend). If the backend isn't up, this
// warns rather than failing the whole run; the admin spec itself will fail
// with a clear connection error instead.
async function globalSetup() {
  const apiBase = process.env.E2E_API_BASE_URL || 'http://localhost:5000/api';
  try {
    const res = await fetch(`${apiBase}/test/seed-admin`, { method: 'POST' });
    if (!res.ok) {
      console.warn(`[global-setup] seed-admin returned ${res.status} — admin E2E tests may fail.`);
    }
  } catch (err) {
    console.warn(`[global-setup] Could not reach the backend at ${apiBase} to seed the admin account (${err.message}). Make sure the backend is running before the admin E2E spec runs.`);
  }
}

export default globalSetup;
