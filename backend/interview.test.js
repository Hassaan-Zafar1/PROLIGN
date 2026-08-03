import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, authHeader, createMentee, createMentor } from "./test/helpers.js";
import MenteeProfileFlat from "./models/Mentee_Profiles.js";
import User from "./models/User.js";

// TC-INTERVIEW-003 .. 006, 008, 009 (qa/test_cases_testrail_import.csv). The
// interview itself (TC-INTERVIEW-001/002, Python AI_interviewer) and the
// frontend-call-site regression (TC-INTERVIEW-007) are out of scope here —
// this suite only covers Node's POST /api/interview link step.
let seedCounter = 0;
async function seedUnlinkedProfile(fields = {}) {
  seedCounter += 1;
  const sessionId = `test-session-${Date.now()}-${seedCounter}`;
  const doc = new MenteeProfileFlat({
    _id: sessionId,
    session_id: sessionId,
    full_name: "Test Mentee",
    university: "Test University",
    degree: "BS Computer Science",
    experience_level: "beginner",
    domain_interest: "Software Engineering",
    target_role: "Software Engineer",
    ...fields,
  });
  await doc.save({ validateBeforeSave: false });
  return sessionId;
}

describe("Interview linking", () => {
  describe("POST /api/interview", () => {
    it("TC-INTERVIEW-003: links a completed, unlinked session to the logged-in mentee", async () => {
      const { accessToken, userId } = await createMentee();
      const sessionId = await seedUnlinkedProfile();

      const res = await request(app).post("/api/interview").set(authHeader(accessToken)).send({ sessionId });
      expect(res.status).toBe(200);
      expect(res.body.user.isProfileComplete).toBe(true);
      expect(res.body.menteeProfile.userId).toBe(String(userId));

      const profile = await MenteeProfileFlat.findById(sessionId);
      expect(String(profile.userId)).toBe(String(userId));
      const user = await User.findById(userId);
      expect(user.isProfileComplete).toBe(true);
      expect(user.onboardingStep).toBe("complete");
    });

    it("TC-INTERVIEW-004: rejects a missing sessionId", async () => {
      const { accessToken } = await createMentee();
      const res = await request(app).post("/api/interview").set(authHeader(accessToken)).send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/sessionId is required/i);
    });

    it("TC-INTERVIEW-005: rejects a sessionId that does not exist", async () => {
      const { accessToken } = await createMentee();
      const res = await request(app).post("/api/interview").set(authHeader(accessToken)).send({ sessionId: "does-not-exist" });
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it("TC-INTERVIEW-006: rejects linking a session already linked to a different account", async () => {
      const menteeA = await createMentee();
      const menteeB = await createMentee();
      const sessionId = await seedUnlinkedProfile();
      await request(app).post("/api/interview").set(authHeader(menteeA.accessToken)).send({ sessionId });

      const res = await request(app).post("/api/interview").set(authHeader(menteeB.accessToken)).send({ sessionId });
      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already linked to a different account/i);
    });

    it("TC-INTERVIEW-009: falls back to the signup LinkedIn URL when none is passed to the link call", async () => {
      const { accessToken, userId } = await createMentee({ linkedinUrl: "https://www.linkedin.com/in/signup-mentee/" });
      const sessionId = await seedUnlinkedProfile();

      await request(app).post("/api/interview").set(authHeader(accessToken)).send({ sessionId });
      const profile = await MenteeProfileFlat.findById(sessionId);
      expect(profile.linkedinUrl).toBe("https://www.linkedin.com/in/signup-mentee/");
      void userId;
    });

    it("restricts linking to mentees only", async () => {
      const { accessToken } = await createMentor();
      const sessionId = await seedUnlinkedProfile();
      const res = await request(app).post("/api/interview").set(authHeader(accessToken)).send({ sessionId });
      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/interview", () => {
    it("TC-INTERVIEW-008: fetches the caller's own linked interview profile", async () => {
      const { accessToken, userId } = await createMentee();
      const sessionId = await seedUnlinkedProfile();
      await request(app).post("/api/interview").set(authHeader(accessToken)).send({ sessionId });

      const res = await request(app).get("/api/interview").set(authHeader(accessToken));
      expect(res.status).toBe(200);
      expect(res.body.profile._id).toBe(sessionId);
      void userId;
    });

    it("returns a null profile when the mentee has not linked an interview yet", async () => {
      const { accessToken } = await createMentee();
      const res = await request(app).get("/api/interview").set(authHeader(accessToken));
      expect(res.status).toBe(200);
      expect(res.body.profile).toBeNull();
    });
  });
});
