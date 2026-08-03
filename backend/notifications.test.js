import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, authHeader, createMentee, createAdmin } from "./test/helpers.js";

// TC-NOTIF-001 .. 005 (qa/test_cases_testrail_import.csv).
describe("Notifications", () => {
  describe("GET /api/notifications", () => {
    it("TC-NOTIF-001: lists own notifications with an unread count", async () => {
      const { accessToken } = await createMentee();
      await request(app).post("/api/notifications").set(authHeader(accessToken)).send({ type: "general", title: "Hi", body: "Welcome" });
      await request(app).post("/api/notifications").set(authHeader(accessToken)).send({ type: "general", title: "Hi again", body: "Second" });

      const res = await request(app).get("/api/notifications").set(authHeader(accessToken));
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.unreadCount).toBe(2);
    });
  });

  describe("POST /api/notifications", () => {
    it("TC-NOTIF-002: creates a notification for the caller", async () => {
      const { accessToken, userId } = await createMentee();
      const res = await request(app).post("/api/notifications").set(authHeader(accessToken)).send({ type: "general", title: "Test", body: "Body text" });
      expect(res.status).toBe(201);
      expect(String(res.body.data.userId)).toBe(String(userId));
    });

    it("ignores an attempt by a non-admin to create a notification for someone else", async () => {
      const mentee = await createMentee();
      const other = await createMentee();
      const res = await request(app).post("/api/notifications").set(authHeader(mentee.accessToken)).send({
        type: "general", title: "Test", body: "Body", userId: other.userId,
      });
      expect(res.status).toBe(201);
      expect(String(res.body.data.userId)).toBe(String(mentee.userId));
    });
  });

  describe("PATCH /api/notifications/read-all", () => {
    it("TC-NOTIF-003: marks all of the caller's notifications as read", async () => {
      const { accessToken } = await createMentee();
      await request(app).post("/api/notifications").set(authHeader(accessToken)).send({ type: "general", title: "A", body: "A" });
      await request(app).post("/api/notifications").set(authHeader(accessToken)).send({ type: "general", title: "B", body: "B" });

      const res = await request(app).patch("/api/notifications/read-all").set(authHeader(accessToken));
      expect(res.status).toBe(200);
      expect(res.body.modified).toBe(2);

      const listRes = await request(app).get("/api/notifications").set(authHeader(accessToken));
      expect(listRes.body.unreadCount).toBe(0);
    });
  });

  describe("PATCH /api/notifications/:id", () => {
    it("TC-NOTIF-004: marks a single notification as read", async () => {
      const { accessToken } = await createMentee();
      const createRes = await request(app).post("/api/notifications").set(authHeader(accessToken)).send({ type: "general", title: "A", body: "A" });

      const res = await request(app).patch(`/api/notifications/${createRes.body.data._id}`).set(authHeader(accessToken)).send({ isRead: true });
      expect(res.status).toBe(200);
      expect(res.body.data.isRead).toBe(true);
      expect(res.body.data.readAt).toBeTruthy();
    });
  });

  describe("DELETE /api/notifications/:id", () => {
    it("TC-NOTIF-005: rejects deleting a notification that does not belong to the caller", async () => {
      const owner = await createMentee();
      const stranger = await createMentee();
      const createRes = await request(app).post("/api/notifications").set(authHeader(owner.accessToken)).send({ type: "general", title: "A", body: "A" });

      const res = await request(app).delete(`/api/notifications/${createRes.body.data._id}`).set(authHeader(stranger.accessToken));
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not your notification/i);
    });

    it("allows an admin to delete any notification", async () => {
      const owner = await createMentee();
      const admin = await createAdmin();
      const createRes = await request(app).post("/api/notifications").set(authHeader(owner.accessToken)).send({ type: "general", title: "A", body: "A" });

      const res = await request(app).delete(`/api/notifications/${createRes.body.data._id}`).set(authHeader(admin.accessToken));
      expect(res.status).toBe(200);
    });
  });
});
