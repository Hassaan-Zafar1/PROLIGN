import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, authHeader, createMentor, createMentee } from "./test/helpers.js";
import AvailabilitySlot from "./models/AvailabilitySlot.js";

// TC-AVAIL-001 .. 008 (qa/test_cases_testrail_import.csv). TC-AVAIL-001 also
// doubles as TC-REGRESSION-002 (guest browsing must never 401).
function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

describe("Availability", () => {
  describe("GET /api/availability", () => {
    it("TC-AVAIL-001: a guest can browse a mentor's availability without logging in (regression)", async () => {
      const mentor = await createMentor();
      await request(app).post("/api/availability").set(authHeader(mentor.accessToken)).send({
        date: tomorrow(), startTime: "10:00", endTime: "10:30",
      });

      const res = await request(app).get("/api/availability").query({ mentorId: mentor.userId, status: "available" });
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("TC-AVAIL-002: a mentor can view their own availability with no mentorId param", async () => {
      const mentor = await createMentor();
      await request(app).post("/api/availability").set(authHeader(mentor.accessToken)).send({
        date: tomorrow(), startTime: "11:00", endTime: "11:30",
      });

      const res = await request(app).get("/api/availability").set(authHeader(mentor.accessToken));
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(String(res.body.data[0].mentorId)).toBe(String(mentor.userId));
    });

    it("rejects a guest with no mentorId and no session", async () => {
      const res = await request(app).get("/api/availability");
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/login required/i);
    });
  });

  describe("POST /api/availability", () => {
    it("TC-AVAIL-003: creates a one-off availability slot", async () => {
      const mentor = await createMentor();
      const res = await request(app).post("/api/availability").set(authHeader(mentor.accessToken)).send({
        date: tomorrow(), startTime: "14:00", endTime: "14:30",
      });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("available");
      expect(res.body.data.startTime).toBe("14:00");
    });

    it("TC-AVAIL-004: rejects creating a slot in the past", async () => {
      const mentor = await createMentor();
      const past = new Date();
      past.setDate(past.getDate() - 1);
      const res = await request(app).post("/api/availability").set(authHeader(mentor.accessToken)).send({
        date: past.toISOString().slice(0, 10), startTime: "09:00", endTime: "09:30",
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/past/i);
    });

    it("TC-AVAIL-005: rejects creating a slot that overlaps an existing one", async () => {
      const mentor = await createMentor();
      const date = tomorrow();
      await request(app).post("/api/availability").set(authHeader(mentor.accessToken)).send({ date, startTime: "10:00", endTime: "10:30" });

      const res = await request(app).post("/api/availability").set(authHeader(mentor.accessToken)).send({ date, startTime: "10:00", endTime: "10:45" });
      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already have a slot/i);
    });

    it("TC-AVAIL-006: rejects a guest attempting to create a slot", async () => {
      const res = await request(app).post("/api/availability").send({ date: tomorrow(), startTime: "09:00", endTime: "09:30" });
      expect(res.status).toBe(401);
    });

    it("rejects a mentee attempting to create a slot", async () => {
      const mentee = await createMentee();
      const res = await request(app).post("/api/availability").set(authHeader(mentee.accessToken)).send({
        date: tomorrow(), startTime: "09:00", endTime: "09:30",
      });
      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/availability/:id", () => {
    it("TC-AVAIL-007: rejects editing a slot that is already booked", async () => {
      const mentor = await createMentor();
      const createRes = await request(app).post("/api/availability").set(authHeader(mentor.accessToken)).send({
        date: tomorrow(), startTime: "15:00", endTime: "15:30",
      });
      await AvailabilitySlot.findByIdAndUpdate(createRes.body.data._id, { status: "booked" });

      const res = await request(app).patch(`/api/availability/${createRes.body.data._id}`).set(authHeader(mentor.accessToken)).send({ startTime: "16:00", endTime: "16:30" });
      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/booked/i);
    });
  });

  describe("DELETE /api/availability/:id", () => {
    it("TC-AVAIL-008: rejects deleting a slot that belongs to a different mentor", async () => {
      const mentorA = await createMentor();
      const mentorB = await createMentor();
      const createRes = await request(app).post("/api/availability").set(authHeader(mentorA.accessToken)).send({
        date: tomorrow(), startTime: "17:00", endTime: "17:30",
      });

      const res = await request(app).delete(`/api/availability/${createRes.body.data._id}`).set(authHeader(mentorB.accessToken));
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not your slot/i);
    });
  });
});
