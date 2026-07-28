import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, authHeader, createMentor, createMentee } from "./test/helpers.js";
import MentorProfile from "./models/MentorProfile.js";

// TC-MPROFILE-001 .. 004 (qa/test_cases_testrail_import.csv), plus a couple of
// extra cases documenting real gaps found while reading mentorService.js —
// flagged clearly below rather than silently treated as "coverage".
describe("Mentor Profile CRUD (/api/mentor-profiles)", () => {
  describe("GET /api/mentor-profiles/me", () => {
    it("TC-MPROFILE-001: fetches (and auto-creates) the caller's own mentor profile", async () => {
      const mentor = await createMentor();
      const res = await request(app).get("/api/mentor-profiles/me").set(authHeader(mentor.accessToken));
      expect(res.status).toBe(200);
      expect(String(res.body.profile.userId)).toBe(String(mentor.userId));
    });
  });

  describe("PATCH /api/mentor-profiles/me", () => {
    it("TC-MPROFILE-002: updates owner-editable profile fields", async () => {
      const mentor = await createMentor();
      const res = await request(app).patch("/api/mentor-profiles/me").set(authHeader(mentor.accessToken)).send({
        bio: "Updated bio", skills: ["React", "Node.js"], hourlyRate: 90,
      });
      expect(res.status).toBe(200);
      expect(res.body.profile.bio).toBe("Updated bio");
      expect(res.body.profile.hourlyRate).toBe(90);
    });

    it("TC-MPROFILE-003: silently ignores an attempt to self-approve via the profile endpoint", async () => {
      const mentor = await createMentor();
      await MentorProfile.findOneAndUpdate({ userId: mentor.userId }, { status: "pending", isApproved: false });

      const res = await request(app).patch("/api/mentor-profiles/me").set(authHeader(mentor.accessToken)).send({ status: "approved" });
      expect(res.status).toBe(200);

      const profile = await MentorProfile.findOne({ userId: mentor.userId });
      expect(profile.status).toBe("pending"); // unchanged — "status" isn't in SELF_EDITABLE_FIELDS
    });
  });

  describe("GET /api/mentor-profiles/:id", () => {
    // TC-MPROFILE-004 as specified in qa/test_cases_testrail_import.csv expects
    // a 403 "This profile is not public" for a pending/rejected profile viewed
    // by a non-owner, non-admin. mentorService.getMentorProfile() has NO
    // status/visibility check at all — this documents the ACTUAL (lenient)
    // current behavior as a known gap, not the originally-intended one. This
    // is a real finding for the Phase 6 bug list, not a passing implementation
    // of TC-MPROFILE-004.
    it("KNOWN GAP (TC-MPROFILE-004 not actually enforced): a stranger can currently view a pending mentor's profile by id", async () => {
      const mentor = await createMentor();
      await MentorProfile.findOneAndUpdate({ userId: mentor.userId }, { status: "pending" });
      const profileId = (await MentorProfile.findOne({ userId: mentor.userId }))._id;
      const stranger = await createMentee();

      const res = await request(app).get(`/api/mentor-profiles/${profileId}`).set(authHeader(stranger.accessToken));
      // Documents current behavior (200), NOT the CSV's intended 403 — flagged for the bug hunt.
      expect(res.status).toBe(200);
    });
  });

  describe("Extra findings — no field whitelist / no ownership check (not in original CSV)", () => {
    it("KNOWN GAP: a mentor can self-escalate status via POST /api/mentor-profiles (no field whitelist)", async () => {
      const mentee = await createMentee();
      // mentee has no mentor profile yet — POST is restrictTo(mentor, admin), so
      // register a second account as a mentor without letting registration's
      // auto-create run first: delete the auto-created profile, then POST fresh.
      const mentor2 = await createMentor();
      await MentorProfile.deleteOne({ userId: mentor2.userId });

      const res = await request(app).post("/api/mentor-profiles").set(authHeader(mentor2.accessToken)).send({ status: "approved", averageRating: 5 });
      expect(res.status).toBe(201);
      expect(res.body.profile.status).toBe("approved"); // forced default of "pending" is overridden by the spread
      void mentee;
    });

    it("KNOWN GAP: any mentor can PATCH another mentor's profile by id (no ownership check)", async () => {
      const mentorA = await createMentor();
      const mentorB = await createMentor();
      const profileId = (await MentorProfile.findOne({ userId: mentorA.userId }))._id;

      const res = await request(app).patch(`/api/mentor-profiles/${profileId}`).set(authHeader(mentorB.accessToken)).send({ bio: "Hijacked" });
      expect(res.status).toBe(200);
      expect(res.body.profile.bio).toBe("Hijacked");
    });
  });

  describe("DELETE /api/mentor-profiles/:id", () => {
    it("restricts deletion to admins", async () => {
      const mentor = await createMentor();
      const profileId = (await MentorProfile.findOne({ userId: mentor.userId }))._id;
      const res = await request(app).delete(`/api/mentor-profiles/${profileId}`).set(authHeader(mentor.accessToken));
      expect(res.status).toBe(403);
    });
  });
});
