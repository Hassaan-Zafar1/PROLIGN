import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, authHeader, createMentor, createMentee } from "./test/helpers.js";
import { buildSampleCvPdf } from "./test/sampleCv.js";

// TC-MENTOR-001 .. 008, TC-CV-001 (qa/test_cases_testrail_import.csv).
describe("Mentor discovery + profile building", () => {
  describe("GET /api/mentors", () => {
    it("TC-MENTOR-001: a guest can browse the approved mentor directory", async () => {
      await createMentor();
      const res = await request(app).get("/api/mentors");
      expect(res.status).toBe(200);
      expect(res.body.mentors.length).toBe(1);
      expect(res.body.mentors[0].cv).toBeUndefined(); // sensitive field never leaks
    });

    it("TC-MENTOR-002: filters and sorts the mentor list", async () => {
      await createMentor({ name: "Alice Aardvark", hourlyRate: 30 });
      await createMentor({ name: "Bob Beetle", hourlyRate: 90 });

      const res = await request(app).get("/api/mentors").query({ sort: "priceHigh" });
      expect(res.status).toBe(200);
      expect(res.body.mentors[0].hourlyRate).toBe(90);
    });
  });

  describe("GET /api/mentors/recommended", () => {
    it("TC-MENTOR-003: returns recommended mentors", async () => {
      await createMentor();
      const res = await request(app).get("/api/mentors/recommended").query({ limit: 5 });
      expect(res.status).toBe(200);
      expect(res.body.strategy).toBe("all_mentors_v0");
      expect(res.body.mentors.length).toBe(1);
    });
  });

  describe("GET /api/mentors/:id", () => {
    it("TC-MENTOR-004: a guest can view a single public mentor profile", async () => {
      const mentor = await createMentor();
      const res = await request(app).get(`/api/mentors/${mentor.userId}`);
      expect(res.status).toBe(200);
      expect(String(res.body.mentor.id)).toBe(String(mentor.userId));
    });

    it("TC-MENTOR-005: 404s for a valid-but-nonexistent mentor id", async () => {
      const res = await request(app).get("/api/mentors/000000000000000000000000");
      expect(res.status).toBe(404);
    });

    it("rejects a malformed mentor id", async () => {
      const res = await request(app).get("/api/mentors/not-an-object-id");
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/mentors/profile/build", () => {
    it("TC-MENTOR-006 / TC-CV-001: builds a mentor profile from CV-parsed text, extracting skills", async () => {
      const mentor = await createMentor();
      const MentorProfile = (await import("./models/MentorProfile.js")).default;
      await MentorProfile.findOneAndUpdate({ userId: mentor.userId }, {
        "cv.parsedText": "Jane Doe\nSenior Software Engineer\nExperience\nStripe Inc.\nTop Skills\nReact\nNode.js\nAWS",
      });

      const res = await request(app).post("/api/mentors/profile/build").set(authHeader(mentor.accessToken));
      expect(res.status).toBe(200);
      expect(res.body.user.isProfileComplete).toBe(true);
      expect(res.body.mentorProfile.skills.length).toBeGreaterThan(0);
    });

    it("TC-MENTOR-007: rejects a non-mentor building a mentor profile", async () => {
      const { accessToken } = await createMentee();
      const res = await request(app).post("/api/mentors/profile/build").set(authHeader(accessToken));
      expect(res.status).toBe(403);
    });

    it("never throws even when there's no CV at all", async () => {
      const mentor = await createMentor();
      const res = await request(app).post("/api/mentors/profile/build").set(authHeader(mentor.accessToken));
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/mentors/:mentorId/cv", () => {
    it("TC-MENTOR-008: uploads and parses a CV file for the caller's own profile", async () => {
      const mentor = await createMentor();
      const res = await request(app)
        .post(`/api/mentors/${mentor.userId}/cv`)
        .set(authHeader(mentor.accessToken))
        .attach("cv", buildSampleCvPdf(), "cv.pdf");

      // This route breaks the app-wide {success, ...} convention — no
      // `success` key at all on success.
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("CV parsed and profile updated.");
      expect(res.body.profile.cv.filename).toBe("cv.pdf");
    });

    it("rejects a mentor uploading a CV to someone else's profile", async () => {
      const mentorA = await createMentor();
      const mentorB = await createMentor();
      const res = await request(app)
        .post(`/api/mentors/${mentorB.userId}/cv`)
        .set(authHeader(mentorA.accessToken))
        .attach("cv", buildSampleCvPdf(), "cv.pdf");

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/your own profile/i);
    });

    it("rejects a request with no file", async () => {
      const mentor = await createMentor();
      const res = await request(app).post(`/api/mentors/${mentor.userId}/cv`).set(authHeader(mentor.accessToken));
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/no cv file uploaded/i);
    });
  });
});
