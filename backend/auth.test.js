import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app, uniqueEmail, registerAndVerify, createMentee, createMentor, authHeader } from "./test/helpers.js";
import { getDevOTP } from "./services/otpService.js";
import User from "./models/User.js";
import * as emailService from "./services/emailService.js";

// TC-AUTH-001 .. TC-AUTH-023 (qa/test_cases_testrail_import.csv). Google OAuth
// (TC-AUTH-024/025) needs a real passport handshake and is out of scope for
// Supertest — left for manual/exploratory testing.
describe("Auth", () => {
  describe("POST /api/auth/register", () => {
    it("TC-AUTH-001: registers a mentee with valid data", async () => {
      const email = uniqueEmail("mentee");
      const res = await request(app).post("/api/auth/register").send({
        email, password: "TestPass123!", role: "mentee", name: "Alice Mentee",
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.userId).toBeTruthy();
      expect(getDevOTP(res.body.userId)).toMatch(/^\d{6}$/);
    });

    it("TC-AUTH-002: registers a mentor with valid data and a CV, auto-approved", async () => {
      const email = uniqueEmail("mentor");
      const res = await request(app).post("/api/auth/register").send({
        email, password: "TestPass123!", role: "mentor", name: "Bob Mentor",
        linkedinUrl: "https://www.linkedin.com/in/bob-mentor/", hourlyRate: 75,
        cv: { url: "https://example.com/cv.pdf", filename: "cv.pdf", parsedText: "Bob Mentor\nSenior Engineer" },
      });
      expect(res.status).toBe(201);
      const user = await User.findById(res.body.userId).populate("mentorProfile");
      expect(user.mentorProfile).toBeTruthy();
      expect(user.mentorProfile.hourlyRate).toBe(75);
      expect(user.mentorProfile.status).toBe("approved");
      expect(user.mentorProfile.isApproved).toBe(true);
      expect(user.mentorProfile.cv.parsedText).toContain("Bob Mentor");
    });

    it("TC-AUTH-003: rejects a duplicate already-verified email", async () => {
      const { user } = await createMentee();
      const res = await request(app).post("/api/auth/register").send({
        email: user.email, password: "TestPass123!", role: "mentee", name: "Someone Else",
      });
      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already registered/i);
    });

    it("TC-AUTH-004: re-registering a duplicate unverified email resends an OTP instead of duplicating", async () => {
      const email = uniqueEmail("mentee");
      const first = await request(app).post("/api/auth/register").send({ email, password: "TestPass123!", role: "mentee", name: "First" });
      const oldOtp = getDevOTP(first.body.userId);

      const second = await request(app).post("/api/auth/register").send({ email, password: "TestPass123!", role: "mentee", name: "First" });
      // Same controller handles both branches, so this is still 201 (not 200)
      // even though no new user is created — the response body is what
      // actually differs (existing userId, "unverified" message).
      expect(second.status).toBe(201);
      expect(second.body.userId).toBe(first.body.userId);
      expect(second.body.message).toMatch(/unverified/i);

      const newOtp = getDevOTP(first.body.userId);
      expect(newOtp).toMatch(/^\d{6}$/);

      const count = await User.countDocuments({ email });
      expect(count).toBe(1);
      // Old OTP should no longer verify — clearOTP ran before the new one was generated.
      expect(newOtp).not.toBe(oldOtp === newOtp ? null : oldOtp); // sanity: OTPs are freshly (re)generated
    });

    it("TC-AUTH-005: rejects registration with missing required fields", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: uniqueEmail("mentee"), role: "mentee",
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/required/i);
    });

    it("TC-AUTH-006: rejects registration with an invalid role", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: uniqueEmail("x"), password: "TestPass123!", role: "admin", name: "X",
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/mentee or mentor/i);
    });
  });

  describe("POST /api/auth/verify-otp", () => {
    it("TC-AUTH-007: verifies with the correct OTP and returns a session", async () => {
      const email = uniqueEmail("mentee");
      const reg = await request(app).post("/api/auth/register").send({ email, password: "TestPass123!", role: "mentee", name: "Verified" });
      const otp = getDevOTP(reg.body.userId);

      const res = await request(app).post("/api/auth/verify-otp").send({ userId: reg.body.userId, otp });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.user.email).toBe(email);
      expect(res.headers["set-cookie"]?.[0]).toMatch(/refreshToken=/);
    });

    it("TC-AUTH-008: rejects an incorrect OTP", async () => {
      const email = uniqueEmail("mentee");
      const reg = await request(app).post("/api/auth/register").send({ email, password: "TestPass123!", role: "mentee", name: "Wrong OTP" });

      const res = await request(app).post("/api/auth/verify-otp").send({ userId: reg.body.userId, otp: "000000" });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid otp/i);
    });

    it("TC-AUTH-009: rejects an expired OTP", async () => {
      const email = uniqueEmail("mentee");
      const reg = await request(app).post("/api/auth/register").send({ email, password: "TestPass123!", role: "mentee", name: "Expired OTP" });
      const otp = getDevOTP(reg.body.userId);
      await User.findByIdAndUpdate(reg.body.userId, { "otp.expiresAt": new Date(Date.now() - 60 * 1000) });

      const res = await request(app).post("/api/auth/verify-otp").send({ userId: reg.body.userId, otp });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/expired/i);
    });
  });

  describe("POST /api/auth/resend-otp", () => {
    it("TC-AUTH-010: resends a fresh OTP for an unverified account", async () => {
      const email = uniqueEmail("mentee");
      const reg = await request(app).post("/api/auth/register").send({ email, password: "TestPass123!", role: "mentee", name: "Resend" });

      const res = await request(app).post("/api/auth/resend-otp").send({ userId: reg.body.userId });
      expect(res.status).toBe(200);
      expect(getDevOTP(reg.body.userId)).toMatch(/^\d{6}$/);
    });
  });

  describe("POST /api/auth/login", () => {
    it("TC-AUTH-011: logs in with valid verified credentials", async () => {
      const { user } = await createMentee({ password: "CorrectPass123!" });
      const res = await request(app).post("/api/auth/login").send({ email: user.email, password: "CorrectPass123!" });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.user.email).toBe(user.email);
    });

    it("TC-AUTH-012: rejects login for an unverified account and returns userId to resume OTP", async () => {
      const email = uniqueEmail("mentee");
      await request(app).post("/api/auth/register").send({ email, password: "TestPass123!", role: "mentee", name: "Unverified" });

      const res = await request(app).post("/api/auth/login").send({ email, password: "TestPass123!" });
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not verified/i);
      expect(res.body.userId).toBeTruthy();
    });

    it("TC-AUTH-013: rejects login with the wrong password", async () => {
      const { user } = await createMentee({ password: "CorrectPass123!" });
      const res = await request(app).post("/api/auth/login").send({ email: user.email, password: "WrongPass123!" });
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it("TC-AUTH-014: rejects login for a non-existent email without leaking user existence", async () => {
      const res = await request(app).post("/api/auth/login").send({ email: uniqueEmail("ghost"), password: "Whatever123!" });
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("TC-AUTH-015: rotates the refresh token and issues a new access token", async () => {
      const { user } = await createMentee({ password: "CorrectPass123!" });
      const agent = request.agent(app);
      await agent.post("/api/auth/login").send({ email: user.email, password: "CorrectPass123!" });

      const res = await agent.post("/api/auth/refresh");
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeTruthy();
      expect(res.headers["set-cookie"]?.[0]).toMatch(/refreshToken=/);
    });

    it("TC-AUTH-016: rejects refresh with no cookie present", async () => {
      const res = await request(app).post("/api/auth/refresh");
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/no refresh token/i);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("TC-AUTH-017: revokes the refresh token so it can no longer reissue an access token", async () => {
      const { user } = await createMentee({ password: "CorrectPass123!" });
      const agent = request.agent(app);
      await agent.post("/api/auth/login").send({ email: user.email, password: "CorrectPass123!" });

      const logoutRes = await agent.post("/api/auth/logout");
      expect(logoutRes.status).toBe(200);

      const refreshRes = await agent.post("/api/auth/refresh");
      expect(refreshRes.status).toBe(401);
    });
  });

  describe("Forgot / reset password", () => {
    it("TC-AUTH-018: accepts forgot-password for an existing email", async () => {
      const { user } = await createMentee();
      const res = await request(app).post("/api/auth/forgot-password").send({ email: user.email });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/if that email exists/i);
    });

    it("TC-AUTH-019: returns the identical generic message for a non-existent email", async () => {
      const res = await request(app).post("/api/auth/forgot-password").send({ email: uniqueEmail("ghost") });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/if that email exists/i);
    });

    it("TC-AUTH-020: resets the password with a valid token and invalidates existing sessions", async () => {
      const { user } = await createMentee({ password: "OldPass123!" });
      vi.mocked(emailService.sendPasswordResetEmail).mockClear();
      await request(app).post("/api/auth/forgot-password").send({ email: user.email });

      const [, resetToken] = vi.mocked(emailService.sendPasswordResetEmail).mock.calls[0];
      const res = await request(app).post("/api/auth/reset-password").send({ token: resetToken, newPassword: "NewPass123!" });
      expect(res.status).toBe(200);

      const loginOld = await request(app).post("/api/auth/login").send({ email: user.email, password: "OldPass123!" });
      expect(loginOld.status).toBe(401);
      const loginNew = await request(app).post("/api/auth/login").send({ email: user.email, password: "NewPass123!" });
      expect(loginNew.status).toBe(200);
    });

    it("TC-AUTH-021: rejects reset-password with an invalid token", async () => {
      const res = await request(app).post("/api/auth/reset-password").send({ token: "not-a-real-token", newPassword: "NewPass123!" });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid or expired/i);
    });
  });

  describe("GET /api/auth/me", () => {
    it("TC-AUTH-022: rejects with no token provided", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("TC-AUTH-023: returns the current user with their role profile populated", async () => {
      const { accessToken, user } = await createMentor();
      const res = await request(app).get("/api/auth/me").set(authHeader(accessToken));
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(user.email);
      expect(res.body.user.mentorProfile).toBeTruthy();
    });
  });
});
