import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, authHeader, createMentee } from "./test/helpers.js";

// TC-CHAT-001 .. 004 (qa/test_cases_testrail_import.csv).
describe("Chat", () => {
  describe("GET /api/chat", () => {
    it("TC-CHAT-001: fetches a conversation thread ordered oldest to newest", async () => {
      const { accessToken } = await createMentee();
      const conversationId = "conv-1";
      await request(app).post("/api/chat").set(authHeader(accessToken)).send({ conversationId, role: "user", content: "First" });
      await request(app).post("/api/chat").set(authHeader(accessToken)).send({ conversationId, role: "assistant", content: "Second" });

      const res = await request(app).get("/api/chat").query({ conversationId }).set(authHeader(accessToken));
      expect(res.status).toBe(200);
      expect(res.body.data.map((m) => m.content)).toEqual(["First", "Second"]);
    });
  });

  describe("POST /api/chat", () => {
    it("TC-CHAT-002: posts a chat message with the userId auto-set", async () => {
      const { accessToken, userId } = await createMentee();
      const res = await request(app).post("/api/chat").set(authHeader(accessToken)).send({ conversationId: "conv-2", role: "user", content: "Hello" });
      expect(res.status).toBe(201);
      expect(String(res.body.data.userId)).toBe(String(userId));
    });

    it("rejects an invalid role", async () => {
      const { accessToken } = await createMentee();
      const res = await request(app).post("/api/chat").set(authHeader(accessToken)).send({ conversationId: "conv-3", role: "system", content: "Hello" });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/role must be/i);
    });
  });

  describe("PATCH /api/chat/:id", () => {
    it("TC-CHAT-003: rejects editing a message that does not belong to the caller", async () => {
      const owner = await createMentee();
      const stranger = await createMentee();
      const createRes = await request(app).post("/api/chat").set(authHeader(owner.accessToken)).send({ conversationId: "conv-4", role: "user", content: "Mine" });

      const res = await request(app).patch(`/api/chat/${createRes.body.data._id}`).set(authHeader(stranger.accessToken)).send({ content: "Edited" });
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not your message/i);
    });
  });

  describe("DELETE /api/chat/:id", () => {
    it("TC-CHAT-004: deletes the caller's own chat message", async () => {
      const { accessToken } = await createMentee();
      const createRes = await request(app).post("/api/chat").set(authHeader(accessToken)).send({ conversationId: "conv-5", role: "user", content: "Delete me" });

      const res = await request(app).delete(`/api/chat/${createRes.body.data._id}`).set(authHeader(accessToken));
      expect(res.status).toBe(200);

      const getRes = await request(app).get(`/api/chat/${createRes.body.data._id}`).set(authHeader(accessToken));
      expect(getRes.status).toBe(404);
    });
  });
});
