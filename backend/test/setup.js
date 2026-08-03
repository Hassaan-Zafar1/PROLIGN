import { beforeAll, afterAll, afterEach, vi } from "vitest";
import mongoose from "mongoose";

// Every test file gets its own connect/disconnect against the SAME
// in-memory Mongo instance (its URI was written to process.env.MONGO_URI by
// globalSetup.js before any test file loaded). fileParallelism is disabled
// in vitest.config.js specifically so the collection-wipe in afterEach below
// can never race against another file's in-flight test.
beforeAll(async () => {
  const { connectDB } = await import("../config/database.js");
  await connectDB();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  const { disconnectDB } = await import("../config/database.js");
  await disconnectDB();
});

// Never let a test send a real email — emailService.js otherwise fires a
// genuine SMTP send on every register/forgot-password call, which is slow,
// flaky, and would spam the real inbox configured in .env.
vi.mock("../services/emailService.js", () => ({
  sendOTPEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));
