---
name: supertest
description: Supertest + Vitest conventions for testing the ProLign Express backend's real routes/middleware — auth setup, test database, request/response assertions. Load when writing or editing any backend/**/*.test.js file that hits an actual route.
---

# Supertest conventions (ProLign backend)

## Import the app, never start a real server

`backend/server.js` exports `app` as its default export specifically for this — importing
it does **not** connect to the dev database or bind `env.PORT` (that only happens when
`server.js` is run directly, guarded by a `process.argv[1] === fileURLToPath(import.meta.url)`
check). Supertest binds its own ephemeral port per request internally.

```js
import request from 'supertest';
import app from '../server.js'; // adjust relative path to wherever the test file lives
```

## File placement — co-located next to the route file

`backend/routes/auth.test.js` sits next to `backend/routes/auth.js`. One test file per
route file is the default; split further only if a route file's test file gets unwieldy.

## Test database — always `mongodb-memory-server`, never the real dev DB

```js
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  // Reset state between tests so one test's data can't leak into another.
  const collections = mongoose.connection.collections;
  for (const key in collections) await collections[key].deleteMany({});
});
```

Never import `config/database.js`'s `connectDB()` in a test — it's for the real dev/prod
connection and reads `env.MONGO_URI`.

## Getting an authenticated request

**Fast path** (when auth is just a precondition, not what's under test) — create a user
directly and sign a token the same way `authService.js`'s `signAccess` does:

```js
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';

const user = await User.create({ email: 'test@example.com', password: 'Pass123!', role: 'mentee', isEmailVerified: true });
const token = jwt.sign({ id: user._id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

const res = await request(app).get('/api/interview').set('Authorization', `Bearer ${token}`);
```

**Full-flow path** (when testing registration/OTP/login themselves): go through the real
`POST /auth/register` → read the OTP off the created User doc's `otp.code` field directly
in the test (no real email is sent in tests) → `POST /auth/verify-otp`.

## What to assert

- HTTP status code first, then response body shape (`res.body.success`, `res.body.data`/
  `res.body.message` per the standard envelope used across all routes).
- For guarded routes, always test **both** the 200/201 happy path and the negative cases:
  no token → 401, wrong role → 403, acting on someone else's resource → 403, duplicate
  create → 409 (most collections have a unique index backing this).
- For anything this session's bug list flags as fixed (see `qa/TEST_PLAN.md` §6), the
  regression case is the negative case that used to fail — e.g. reviews/availability
  `GET` must succeed for a request with **no** `Authorization` header at all (guest read),
  while `POST`/`PATCH`/`DELETE` on those same routes must still 401 without one.

## Coverage

`npm run test:coverage` in `backend/` runs `vitest run --coverage`. `server.js` itself is
included in the coverage measurement (it's genuinely exercised by every Supertest request
through its middleware/route-mounting chain) — see `backend/vitest.config.js`'s
`coverage.exclude` for what's deliberately left out (scripts, DB wiring, the separate
Python services that happen to live under `backend/`).
