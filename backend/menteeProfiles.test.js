import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, authHeader, createMentee, createAdmin, createMentor } from "./test/helpers.js";
import MenteeProfileFlat from "./models/Mentee_Profiles.js";

// TC-MEPROFILE-001 .. 004 (qa/test_cases_testrail_import.csv).
let seedCounter = 0;
async function linkedMenteeProfile(mentee, fields = {}) {
  seedCounter += 1;
  const sessionId = `mep-session-${Date.now()}-${seedCounter}`;
  const doc = new MenteeProfileFlat({
    _id: sessionId, session_id: sessionId,
    university: "Test University", degree: "BS CS", ...fields,
  });
  await doc.save({ validateBeforeSave: false });
  await request(app).post("/api/interview").set(authHeader(mentee.accessToken)).send({ sessionId });
  return sessionId;
}

describe("Mentee Profile CRUD (/api/mentee-profiles)", () => {
  describe("GET /api/mentee-profiles", () => {
    it("TC-MEPROFILE-001: rejects a non-admin listing all mentee profiles", async () => {
      const { accessToken } = await createMentee();
      const res = await request(app).get("/api/mentee-profiles").set(authHeader(accessToken));
      expect(res.status).toBe(403);
    });

    it("an admin can list all mentee profiles", async () => {
      const admin = await createAdmin();
      const mentee = await createMentee();
      await linkedMenteeProfile(mentee);
      const res = await request(app).get("/api/mentee-profiles").set(authHeader(admin.accessToken));
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe("GET /api/mentee-profiles/me", () => {
    it("TC-MEPROFILE-002: fetches the caller's own mentee profile", async () => {
      const mentee = await createMentee();
      const sessionId = await linkedMenteeProfile(mentee);
      const res = await request(app).get("/api/mentee-profiles/me").set(authHeader(mentee.accessToken));
      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(sessionId);
    });

    it("404s when the mentee has not linked an interview yet", async () => {
      const { accessToken } = await createMentee();
      const res = await request(app).get("/api/mentee-profiles/me").set(authHeader(accessToken));
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/complete the interview first/i);
    });
  });

  describe("GET /api/mentee-profiles/:id", () => {
    it("TC-MEPROFILE-003: fetches by string session_id with no ObjectId-format 400 (regression)", async () => {
      const mentee = await createMentee();
      const sessionId = await linkedMenteeProfile(mentee);
      const res = await request(app).get(`/api/mentee-profiles/${sessionId}`).set(authHeader(mentee.accessToken));
      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(sessionId);
    });

    it("rejects a different mentee viewing someone else's profile by session_id", async () => {
      const mentee = await createMentee();
      const stranger = await createMentee();
      const sessionId = await linkedMenteeProfile(mentee);

      const res = await request(app).get(`/api/mentee-profiles/${sessionId}`).set(authHeader(stranger.accessToken));
      expect(res.status).toBe(403);
    });

    it("allows an admin to view any mentee's profile by session_id", async () => {
      const mentee = await createMentee();
      const admin = await createAdmin();
      const sessionId = await linkedMenteeProfile(mentee);

      const res = await request(app).get(`/api/mentee-profiles/${sessionId}`).set(authHeader(admin.accessToken));
      expect(res.status).toBe(200);
    });
  });

  describe("PATCH /api/mentee-profiles/me", () => {
    it("updates owner-editable fields only", async () => {
      const mentee = await createMentee();
      await linkedMenteeProfile(mentee);
      const res = await request(app).patch("/api/mentee-profiles/me").set(authHeader(mentee.accessToken)).send({
        university: "New University", session_id: "should-be-ignored",
      });
      expect(res.status).toBe(200);
      expect(res.body.data.university).toBe("New University");
    });

    it("restricts updating to mentees/admins", async () => {
      const { accessToken } = await createMentor();
      const res = await request(app).patch("/api/mentee-profiles/me").set(authHeader(accessToken)).send({ university: "X" });
      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/mentee-profiles/:id", () => {
    it("TC-MEPROFILE-004: rejects a non-admin deleting a mentee profile", async () => {
      const mentee = await createMentee();
      const sessionId = await linkedMenteeProfile(mentee);
      const res = await request(app).delete(`/api/mentee-profiles/${sessionId}`).set(authHeader(mentee.accessToken));
      expect(res.status).toBe(403);
    });

    it("allows an admin to delete a mentee profile", async () => {
      const mentee = await createMentee();
      const admin = await createAdmin();
      const sessionId = await linkedMenteeProfile(mentee);
      const res = await request(app).delete(`/api/mentee-profiles/${sessionId}`).set(authHeader(admin.accessToken));
      expect(res.status).toBe(200);
      expect(await MenteeProfileFlat.findById(sessionId)).toBeNull();
    });
  });
});
