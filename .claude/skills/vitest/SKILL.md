---
name: vitest
description: Vitest conventions for both the frontend (jsdom + React Testing Library) and backend (node environment) in ProLign. Load when writing or editing any *.test.js/*.test.jsx file.
---

# Vitest conventions (ProLign)

Two separate Vitest configs, two separate purposes — don't mix them up:

| | `frontend/vitest.config.js` | `backend/vitest.config.js` |
|---|---|---|
| Environment | `jsdom` | `node` |
| Tests | Pure utils, hooks, components | Route/service unit logic (not full API — that's `supertest` skill) |
| Globals | `globals: true` — no need to `import { describe, it, expect }` | same |

## File placement — co-located, not a mirrored `__tests__/` tree

`ComponentName.test.jsx` / `moduleName.test.js` sits **in the same folder** as the file it
tests. Vitest auto-discovers `*.test.js(x)` anywhere; no path config needed.

```
src/utils/mentorLevel.js
src/utils/mentorLevel.test.js       ← same folder
src/components/common/Button.jsx
src/components/common/Button.test.jsx
```

`frontend/e2e/**` is explicitly excluded from Vitest's glob (see the `exclude` array in
`frontend/vitest.config.js`) — those are Playwright specs, a different runner entirely.
Never add a `*.spec.js` file outside `e2e/` expecting Vitest to skip it; the exclude is
scoped to that folder path, not the `.spec.` naming.

## What to test at this level (frontend)

Priority order (see `qa/TEST_PLAN.md`): pure utils (`flattenProfile.js`, `mentorLevel.js`,
`profileCompletion.js` — zero mocking) → browser-API utils (`tokenManager.js` needs no
mock, jsdom provides `localStorage`; `errorHandler.js` needs `vi.mock('react-toastify')`)
→ common components (`src/components/common/*`, render + `@testing-library/user-event`)
→ services (mock `src/config/api.js`'s axios instance with `vi.mock('../config/api')`;
`uploadService.js` uses raw `fetch`, mock `global.fetch` instead) → hooks (RTL's built-in
`renderHook`, no separate package needed).

## What to test at this level (backend)

Pure service-function logic that doesn't need a real Express request/response cycle —
e.g. a service function's business-rule branches given different inputs. If the test
needs to go through actual HTTP (status codes, middleware, auth headers), that's the
`supertest` skill instead, not this one.

## Coverage

`npm run test:coverage` in either `frontend/` or `backend/` runs `vitest run --coverage`
(provider `v8`). Reports land in `<service>/reports/coverage/` (HTML + lcov +
json-summary). The `coverage.thresholds` block in each config enforces the gate — see
`testing-strategy` skill for what to do if a file is genuinely untestable rather than
lowering the number.

## Mocking

- `vi.mock('module/path')` + `vi.fn()` — standard Vitest mocking, no extra library needed.
- Frontend: mock `react-toastify`'s `toast` for anything importing `errorHandler.js`.
- Backend: mock Mongoose model methods directly when testing a service function in
  isolation (`vi.spyOn(SomeModel, 'findOne').mockResolvedValue(...)`) rather than hitting
  `mongodb-memory-server` — save that for the Supertest layer where a real DB round-trip
  is the point.
