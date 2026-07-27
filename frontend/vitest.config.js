import { defineConfig } from 'vite';

export default defineConfig({
    test: {
        environment: "jsdom",
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
    },
});