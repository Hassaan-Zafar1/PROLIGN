// Shared fixtures for the Supertest API suite — every helper drives the REAL
// HTTP routes (not service functions directly) so these tests exercise the
// exact same code path a real client would, consistent with the E2E suite's
// philosophy. OTP is read via the dev-only in-memory store (otpService.js's
// getDevOTP) rather than a mocked email — NODE_ENV is "test" here (set by
// globalSetup.js), so the same non-production code path E2E relies on applies.
import request from "supertest";
import app from "../server.js";
import { getDevOTP } from "../services/otpService.js";

let counter = 0;
export function uniqueEmail(prefix = "user") {
  counter += 1;
  return `${prefix}.${Date.now()}.${counter}@example.com`;
}

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

// Registers + verifies a mentee or mentor through the real endpoints, returns
// { userId, accessToken, user }.
export async function registerAndVerify({ role, email, password = "TestPass123!", name = "Test User", ...rest }) {
  const registerRes = await request(app).post("/api/auth/register").send({ email, password, role, name, ...rest });
  if (registerRes.status !== 201) {
    throw new Error(`registerAndVerify: register failed ${registerRes.status} ${JSON.stringify(registerRes.body)}`);
  }
  const userId = registerRes.body.userId;
  const otp = getDevOTP(userId);
  const verifyRes = await request(app).post("/api/auth/verify-otp").send({ userId, otp });
  if (verifyRes.status !== 200) {
    throw new Error(`registerAndVerify: verify failed ${verifyRes.status} ${JSON.stringify(verifyRes.body)}`);
  }
  return { userId, accessToken: verifyRes.body.accessToken, user: verifyRes.body.user };
}

export async function createMentee(overrides = {}) {
  return registerAndVerify({
    role: "mentee",
    email: uniqueEmail("mentee"),
    name: "Test Mentee",
    ...overrides,
  });
}

export async function createMentor(overrides = {}) {
  return registerAndVerify({
    role: "mentor",
    email: uniqueEmail("mentor"),
    name: "Test Mentor",
    linkedinUrl: "https://www.linkedin.com/in/test-mentor/",
    hourlyRate: 50,
    ...overrides,
  });
}

// Uses the dev-only seed-admin side channel (mounted only when
// NODE_ENV !== "production" — see routes/testHelpers.js) to get a real admin
// account, then logs in through the real endpoint.
export async function createAdmin(overrides = {}) {
  const email = overrides.email || uniqueEmail("admin");
  const password = overrides.password || "AdminPass123!";
  const name = overrides.name || "Test Admin";

  const seedRes = await request(app).post("/api/test/seed-admin").send({ email, password, name });
  if (seedRes.status !== 200) {
    throw new Error(`createAdmin: seed failed ${seedRes.status} ${JSON.stringify(seedRes.body)}`);
  }
  const loginRes = await request(app).post("/api/auth/login").send({ email, password });
  if (loginRes.status !== 200) {
    throw new Error(`createAdmin: login failed ${loginRes.status} ${JSON.stringify(loginRes.body)}`);
  }
  return { accessToken: loginRes.body.accessToken, user: loginRes.body.user };
}

export { app };
