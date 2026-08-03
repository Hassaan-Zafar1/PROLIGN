// Extends Vitest's `expect` with jest-dom matchers (toBeInTheDocument,
// toHaveClass, toBeDisabled, etc.) for every test file — wired in once here
// via vitest.config.js's setupFiles instead of importing it per test file.
import '@testing-library/jest-dom/vitest';

// React Testing Library auto-unmounts after each test under Jest (via its
// own environment detection), but NOT under Vitest — without this, every
// render() in a file piles up in the same jsdom document, and the second
// test in any component test file starts finding 2+ matches for what should
// be a single element.
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
