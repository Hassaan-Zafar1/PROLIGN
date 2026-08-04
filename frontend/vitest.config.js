import { defineConfig } from 'vite';

export default defineConfig({
    test: {
        environment: "jsdom",
        setupFiles: ['./src/test/setup.js'],
        // Vitest's default include glob (**/*.spec.js) would otherwise also
        // pick up frontend/e2e/*.spec.js — those are Playwright specs (a
        // different test runner, driving a real browser via playwright.config.js),
        // not Vitest ones, and fail with a confusing "did not expect test() to
        // be called here" error if Vitest tries to execute them. Setting
        // `exclude` replaces Vitest's own default list rather than merging with
        // it, so the standard defaults are repeated here alongside e2e/.
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/cypress/**',
            '**/e2e/**',
            '**/.{idea,git,cache,output,temp}/**',
            '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        ],
        // Console summary always; JUnit XML additionally for CI to consume.
        reporters: ['default', 'junit'],
        outputFile: { junit: './reports/unit-junit.xml' },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov', 'json-summary'],
            reportsDirectory: './reports/coverage',
            exclude: [
                'node_modules/**', 'e2e/**', 'src/**/*.test.{js,jsx}',
                'src/main.jsx', 'src/config/**', 'vite.config.js', 'vitest.config.js',
                'playwright.config.js',
            ],
            // Gate: a build/PR should not proceed if coverage falls below this.
            // Starting target — see qa/TEST_PLAN.md §6 for current actual status
            // (this gate will fail until the Phase 2+ test suites are written).
            thresholds: {
                statements: 50,
                branches: 50,
                functions: 50,
                lines: 50,
            },
        },
    },
});
