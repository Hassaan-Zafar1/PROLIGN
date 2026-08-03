import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Generous — some routes (CV parsing, mongodb-memory-server startup)
    // genuinely take longer than Vitest's 5s default.
    testTimeout: 20000,
    hookTimeout: 30000,
    // One shared in-memory MongoDB instance backs every test file (see
    // test/globalSetup.js). Each file wipes all collections in its own
    // afterEach (test/setup.js) — running files in parallel would let one
    // file's wipe race another file's in-flight assertions, so parallelism
    // is disabled across files (tests within a file still run in order
    // regardless).
    fileParallelism: false,
    globalSetup: './test/globalSetup.js',
    setupFiles: ['./test/setup.js'],
    reporters: ['default', 'junit'],
    outputFile: { junit: './reports/api-junit.xml' },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './reports/coverage',
      exclude: [
        // server.js itself IS measured (Supertest exercises its middleware/route
        // mounting) — only genuinely untestable-by-this-suite paths are excluded:
        // one-off admin scripts, DB connection wiring (bypassed via
        // mongodb-memory-server in tests), and the separate Python services that
        // happen to live under backend/ but aren't part of this Vitest run.
        'node_modules/**', '**/*.test.js', 'config/**', 'scripts/**',
        'AI_interviewer/**', 'Rag_Chatbot/**', 'Mentor_Mentee_Match/**',
        'chatbot/**', 'vitest.config.js', 'test/**',
        // Dev/test-only side channel (never mounted in production) — this is
        // test infrastructure itself, not app business logic under test.
        'services/testHelperService.js', 'controllers/testHelperController.js',
        'routes/testHelpers.js',
      ],
      // Gate: a build/PR should not proceed if coverage falls below this.
      // Starting target — see qa/TEST_PLAN.md §6 for current actual status
      // (this gate will fail until the Phase 4 API test suite is written).
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
});
