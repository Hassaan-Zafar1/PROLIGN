import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Generous — some routes (CV parsing, mongodb-memory-server startup)
    // genuinely take longer than Vitest's 5s default.
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
