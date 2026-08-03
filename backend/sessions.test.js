import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, authHeader, createMentor, createMentee } from "./test/helpers.js";
import AvailabilitySlot from "./models/AvailabilitySlot.js";

// TC-SESSION-001 .. 008 (qa/test_cases_testrail_import.csv).
function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function createSlot(mentor, overrides = {}) {
  const res = await request(app).post("/api/availability").set(authHeader(mentor.accessToken)).send({
    date: tomorrow(), startTime: "10:00", endTime: "10:30", ...overrides,
  });
  return res.body.data._id;
}

async function bookSlot(mentor, mentee, slotId, overrides = {}) {
  return request(app).post("/api/sessions").set(authHeader(mentee.accessToken)).send({
    mentorId: mentor.userId, slotId, sessionType: "mock_interview", ...overrides,
  });
}

describe("Sessions", () => {
  describe("POST /api/sessions", () => {
    it("TC-SESSION-001: books an available slot, atomically claiming it and snapshotting price", async () => {
      const mentor = await createMentor({ hourlyRate: 80 });
      const mentee = await createMentee();
      const slotId = await createSlot(mentor);

      const res = await bookSlot(mentor, mentee, slotId, { agenda: "Career advice" });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("pending");
      expect(res.body.data.priceCharged).toBe(80);

      const slot = await AvailabilitySlot.findById(slotId);
      expect(slot.status).toBe("booked");
    });

    it("TC-SESSION-002: rejects booking a slot that was just booked by someone else", async () => {
      const mentor = await createMentor();
      const menteeA = await createMentee();
      const menteeB = await createMentee();
      const slotId = await createSlot(mentor);

      const first = await bookSlot(mentor, menteeA, slotId);
      expect(first.status).toBe(201);

      const second = await bookSlot(mentor, menteeB, slotId);
      expect(second.status).toBe(409);
      expect(second.body.message).toMatch(/no longer available/i);
    });

    it("TC-SESSION-003: rejects booking a session with oneself", async () => {
      const mentee = await createMentee();
      const res = await request(app).post("/api/sessions").set(authHeader(mentee.accessToken)).send({
        mentorId: mentee.userId, slotId: "000000000000000000000000", sessionType: "mock_interview",
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot book a session with yourself/i);
    });
  });

  describe("PATCH /api/sessions/:id — status transitions", () => {
    it("TC-SESSION-004: the mentor confirms a pending session", async () => {
      const mentor = await createMentor();
      const mentee = await createMentee();
      const slotId = await createSlot(mentor);
      const booked = await bookSlot(mentor, mentee, slotId);

      const res = await request(app).patch(`/api/sessions/${booked.body.data._id}`).set(authHeader(mentor.accessToken)).send({ status: "confirmed" });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("confirmed");
      expect(res.body.data.confirmedAt).toBeTruthy();
    });

    it("TC-SESSION-005: rejects the mentee (not the mentor) confirming the session", async () => {
      const mentor = await createMentor();
      const mentee = await createMentee();
      const slotId = await createSlot(mentor);
      const booked = await bookSlot(mentor, mentee, slotId);

      const res = await request(app).patch(`/api/sessions/${booked.body.data._id}`).set(authHeader(mentee.accessToken)).send({ status: "confirmed" });
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/only the mentor can confirm/i);
    });

    it("TC-SESSION-006: cancelling a confirmed session frees its slot", async () => {
      const mentor = await createMentor();
      const mentee = await createMentee();
      const slotId = await createSlot(mentor);
      const booked = await bookSlot(mentor, mentee, slotId);
      await request(app).patch(`/api/sessions/${booked.body.data._id}`).set(authHeader(mentor.accessToken)).send({ status: "confirmed" });

      const res = await request(app).patch(`/api/sessions/${booked.body.data._id}`).set(authHeader(mentee.accessToken)).send({ status: "cancelled_by_mentee" });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("cancelled_by_mentee");

      const slot = await AvailabilitySlot.findById(slotId);
      expect(slot.status).toBe("available");
      expect(slot.bookedBy).toBeNull();
    });

    it("rejects an unsupported status value", async () => {
      const mentor = await createMentor();
      const mentee = await createMentee();
      const slotId = await createSlot(mentor);
      const booked = await bookSlot(mentor, mentee, slotId);

      const res = await request(app).patch(`/api/sessions/${booked.body.data._id}`).set(authHeader(mentor.accessToken)).send({ status: "made_up_status" });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/unsupported status transition/i);
    });
  });

  describe("GET /api/sessions", () => {
    it("TC-SESSION-007: lists only this mentee's upcoming sessions", async () => {
      const mentor = await createMentor();
      const mentee = await createMentee();
      const otherMentee = await createMentee();
      const slotId1 = await createSlot(mentor, { startTime: "09:00", endTime: "09:30" });
      const slotId2 = await createSlot(mentor, { startTime: "13:00", endTime: "13:30" });
      await bookSlot(mentor, mentee, slotId1);
      await bookSlot(mentor, otherMentee, slotId2);

      const res = await request(app).get("/api/sessions").query({ as: "mentee", when: "upcoming" }).set(authHeader(mentee.accessToken));
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(String(res.body.data[0].menteeId._id ?? res.body.data[0].menteeId.id)).toBe(String(mentee.userId));
    });
  });

  describe("DELETE /api/sessions/:id", () => {
    it("TC-SESSION-008: deleting a session frees its linked slot", async () => {
      const mentor = await createMentor();
      const mentee = await createMentee();
      const slotId = await createSlot(mentor);
      const booked = await bookSlot(mentor, mentee, slotId);

      const res = await request(app).delete(`/api/sessions/${booked.body.data._id}`).set(authHeader(mentee.accessToken));
      expect(res.status).toBe(200);
      const slot = await AvailabilitySlot.findById(slotId);
      expect(slot.status).toBe("available");
    });
  });
});
