import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, authHeader, createMentor, createMentee, createAdmin } from "./test/helpers.js";
import MentorProfile from "./models/MentorProfile.js";

// TC-REVIEW-001 .. 008 (qa/test_cases_testrail_import.csv). TC-REVIEW-001
// doubles as TC-REGRESSION-001 (guest browsing must never 401).
function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function bookAndCompleteSession(mentor, mentee) {
  const slotRes = await request(app).post("/api/availability").set(authHeader(mentor.accessToken)).send({
    date: tomorrow(), startTime: "10:00", endTime: "10:30",
  });
  const sessionRes = await request(app).post("/api/sessions").set(authHeader(mentee.accessToken)).send({
    mentorId: mentor.userId, slotId: slotRes.body.data._id, sessionType: "mock_interview",
  });
  const sessionId = sessionRes.body.data._id;
  await request(app).patch(`/api/sessions/${sessionId}`).set(authHeader(mentor.accessToken)).send({ status: "confirmed" });
  await request(app).patch(`/api/sessions/${sessionId}`).set(authHeader(mentor.accessToken)).send({ status: "completed" });
  return sessionId;
}

async function bookPendingSession(mentor, mentee) {
  const slotRes = await request(app).post("/api/availability").set(authHeader(mentor.accessToken)).send({
    date: tomorrow(), startTime: "11:00", endTime: "11:30",
  });
  const sessionRes = await request(app).post("/api/sessions").set(authHeader(mentee.accessToken)).send({
    mentorId: mentor.userId, slotId: slotRes.body.data._id, sessionType: "mock_interview",
  });
  return sessionRes.body.data._id;
}

describe("Reviews", () => {
  describe("GET /api/reviews", () => {
    it("TC-REVIEW-001: a guest can browse a mentor's visible reviews without logging in (regression)", async () => {
      const mentor = await createMentor();
      const mentee = await createMentee();
      const sessionId = await bookAndCompleteSession(mentor, mentee);
      await request(app).post("/api/reviews").set(authHeader(mentee.accessToken)).send({ sessionId, rating: 5, reviewText: "Great session" });

      const res = await request(app).get("/api/reviews").query({ mentorId: mentor.userId });
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].reviewText).toBe("Great session");
    });

    it("TC-REVIEW-007: rejects a guest fetching their own reviews with no mentorId filter", async () => {
      const res = await request(app).get("/api/reviews").query({ mine: "true" });
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/login required/i);
    });
  });

  describe("POST /api/reviews", () => {
    it("TC-REVIEW-002: a mentee reviews a completed session, updating the mentor's rating stats", async () => {
      const mentor = await createMentor();
      const mentee = await createMentee();
      const sessionId = await bookAndCompleteSession(mentor, mentee);

      const res = await request(app).post("/api/reviews").set(authHeader(mentee.accessToken)).send({ sessionId, rating: 4 });
      expect(res.status).toBe(201);

      const profile = await MentorProfile.findOne({ userId: mentor.userId });
      expect(profile.totalReviews).toBe(1);
      expect(profile.averageRating).toBe(4);
    });

    it("TC-REVIEW-003: rejects reviewing a session that is not completed", async () => {
      const mentor = await createMentor();
      const mentee = await createMentee();
      const sessionId = await bookPendingSession(mentor, mentee);

      const res = await request(app).post("/api/reviews").set(authHeader(mentee.accessToken)).send({ sessionId, rating: 5 });
      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/completed session/i);
    });

    it("TC-REVIEW-004: rejects a duplicate review for the same session", async () => {
      const mentor = await createMentor();
      const mentee = await createMentee();
      const sessionId = await bookAndCompleteSession(mentor, mentee);
      await request(app).post("/api/reviews").set(authHeader(mentee.accessToken)).send({ sessionId, rating: 5 });

      const res = await request(app).post("/api/reviews").set(authHeader(mentee.accessToken)).send({ sessionId, rating: 3 });
      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already reviewed/i);
    });

    it("TC-REVIEW-008: an anonymous review hides the reviewer's identity when listed", async () => {
      const mentor = await createMentor();
      const mentee = await createMentee();
      const sessionId = await bookAndCompleteSession(mentor, mentee);
      await request(app).post("/api/reviews").set(authHeader(mentee.accessToken)).send({ sessionId, rating: 5, isAnonymous: true });

      const res = await request(app).get("/api/reviews").query({ mentorId: mentor.userId });
      expect(res.body.data[0].menteeId).toBeNull();
    });
  });

  describe("PATCH /api/reviews/:id", () => {
    it("TC-REVIEW-005: the reviewed mentor posts a reply", async () => {
      const mentor = await createMentor();
      const mentee = await createMentee();
      const sessionId = await bookAndCompleteSession(mentor, mentee);
      const reviewRes = await request(app).post("/api/reviews").set(authHeader(mentee.accessToken)).send({ sessionId, rating: 5 });

      const res = await request(app).patch(`/api/reviews/${reviewRes.body.data._id}`).set(authHeader(mentor.accessToken)).send({ mentorReply: "Thank you!" });
      expect(res.status).toBe(200);
      expect(res.body.data.mentorReply.text).toBe("Thank you!");
      expect(res.body.data.mentorReply.repliedAt).toBeTruthy();
    });

    it("TC-REVIEW-006: rejects a non-admin attempting to moderate a review", async () => {
      const mentor = await createMentor();
      const mentee = await createMentee();
      const sessionId = await bookAndCompleteSession(mentor, mentee);
      const reviewRes = await request(app).post("/api/reviews").set(authHeader(mentee.accessToken)).send({ sessionId, rating: 5 });

      const res = await request(app).patch(`/api/reviews/${reviewRes.body.data._id}`).set(authHeader(mentor.accessToken)).send({ isVisible: false });
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/only an admin can moderate/i);
    });

    it("an admin can moderate a review", async () => {
      const mentor = await createMentor();
      const mentee = await createMentee();
      const admin = await createAdmin();
      const sessionId = await bookAndCompleteSession(mentor, mentee);
      const reviewRes = await request(app).post("/api/reviews").set(authHeader(mentee.accessToken)).send({ sessionId, rating: 1, reviewText: "spam" });

      const res = await request(app).patch(`/api/reviews/${reviewRes.body.data._id}`).set(authHeader(admin.accessToken)).send({ isVisible: false, flagged: true, flagReason: "spam" });
      expect(res.status).toBe(200);
      expect(res.body.data.isVisible).toBe(false);
      expect(res.body.data.flagged).toBe(true);
    });
  });
});
