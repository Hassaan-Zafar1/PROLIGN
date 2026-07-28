import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, authHeader, createMentor, createMentee, createAdmin } from "./test/helpers.js";

// TC-PAY-001 .. 006 (qa/test_cases_testrail_import.csv). Stripe itself isn't
// wired up yet (see paymentService.js's own comment) — createPaymentIntent
// and the webhook are out of scope here since they'd need a real/mocked
// Stripe secret key, which isn't configured in this environment.
function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function bookedSession(mentor, mentee) {
  const slotRes = await request(app).post("/api/availability").set(authHeader(mentor.accessToken)).send({
    date: tomorrow(), startTime: "10:00", endTime: "10:30",
  });
  const sessionRes = await request(app).post("/api/sessions").set(authHeader(mentee.accessToken)).send({
    mentorId: mentor.userId, slotId: slotRes.body.data._id, sessionType: "mock_interview",
  });
  return sessionRes.body.data._id;
}

describe("Payments", () => {
  describe("POST /api/payments", () => {
    it("TC-PAY-001: the booking mentee creates a payment for their own session", async () => {
      const mentor = await createMentor();
      const mentee = await createMentee();
      const sessionId = await bookedSession(mentor, mentee);

      const res = await request(app).post("/api/payments").set(authHeader(mentee.accessToken)).send({ sessionId, grossAmount: 100 });
      expect(res.status).toBe(201);
      expect(res.body.data.grossAmount).toBe(100);
      expect(res.body.data.platformCommission).toBe(15);
      expect(res.body.data.mentorEarnings).toBe(85);
    });

    it("TC-PAY-002: a different mentee cannot pay for someone else's session", async () => {
      const mentor = await createMentor();
      const mentee = await createMentee();
      const otherMentee = await createMentee();
      const sessionId = await bookedSession(mentor, mentee);

      const res = await request(app).post("/api/payments").set(authHeader(otherMentee.accessToken)).send({ sessionId, grossAmount: 100 });
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/only the booking mentee/i);
    });

    it("TC-PAY-003: rejects a duplicate payment for the same session", async () => {
      const mentor = await createMentor();
      const mentee = await createMentee();
      const sessionId = await bookedSession(mentor, mentee);
      await request(app).post("/api/payments").set(authHeader(mentee.accessToken)).send({ sessionId, grossAmount: 100 });

      const res = await request(app).post("/api/payments").set(authHeader(mentee.accessToken)).send({ sessionId, grossAmount: 100 });
      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  describe("PATCH /api/payments/:id", () => {
    it("TC-PAY-004: rejects a non-admin updating payout status", async () => {
      const mentor = await createMentor();
      const mentee = await createMentee();
      const sessionId = await bookedSession(mentor, mentee);
      const payRes = await request(app).post("/api/payments").set(authHeader(mentee.accessToken)).send({ sessionId, grossAmount: 100 });

      const res = await request(app).patch(`/api/payments/${payRes.body.data._id}`).set(authHeader(mentee.accessToken)).send({ payoutStatus: "processing" });
      expect(res.status).toBe(403);
    });

    it("TC-PAY-005: an admin updates payout status", async () => {
      const mentor = await createMentor();
      const mentee = await createMentee();
      const admin = await createAdmin();
      const sessionId = await bookedSession(mentor, mentee);
      const payRes = await request(app).post("/api/payments").set(authHeader(mentee.accessToken)).send({ sessionId, grossAmount: 100 });

      const res = await request(app).patch(`/api/payments/${payRes.body.data._id}`).set(authHeader(admin.accessToken)).send({ payoutStatus: "processing" });
      expect(res.status).toBe(200);
      expect(res.body.data.payoutStatus).toBe("processing");
      expect(res.body.data.payoutInitiatedAt).toBeTruthy();
    });
  });

  describe("GET /api/payments", () => {
    it("TC-PAY-006: a participant only sees payments where they're the mentee or mentor", async () => {
      const mentor = await createMentor();
      const mentee = await createMentee();
      const otherMentor = await createMentor();
      const otherMentee = await createMentee();
      const sessionId1 = await bookedSession(mentor, mentee);
      const sessionId2 = await bookedSession(otherMentor, otherMentee);
      await request(app).post("/api/payments").set(authHeader(mentee.accessToken)).send({ sessionId: sessionId1, grossAmount: 100 });
      await request(app).post("/api/payments").set(authHeader(otherMentee.accessToken)).send({ sessionId: sessionId2, grossAmount: 200 });

      const res = await request(app).get("/api/payments").set(authHeader(mentee.accessToken));
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].grossAmount).toBe(100);
    });
  });
});
