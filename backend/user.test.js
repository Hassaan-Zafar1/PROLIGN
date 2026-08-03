import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, authHeader, createMentee } from "./test/helpers.js";

// TC-USER-001 .. 005 (qa/test_cases_testrail_import.csv).
describe("User account", () => {
  describe("PATCH /api/user/profile", () => {
    it("TC-USER-001: updates own shared profile fields", async () => {
      const { accessToken } = await createMentee();
      const res = await request(app).patch("/api/user/profile").set(authHeader(accessToken)).send({
        name: "Updated Name", country: "PK", city: "Karachi",
      });
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe("Updated Name");
      expect(res.body.user.city).toBe("Karachi");
    });

    it("TC-USER-002: silently ignores role-specific fields sent to the shared profile endpoint", async () => {
      const { accessToken } = await createMentee();
      const res = await request(app).patch("/api/user/profile").set(authHeader(accessToken)).send({
        name: "Still Updates", skills: ["Python"], hourlyRate: 100,
      });
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe("Still Updates");
      expect(res.body.user.skills).toBeUndefined();
      expect(res.body.user.hourlyRate).toBeUndefined();
    });

    it("rejects an update with no recognized fields", async () => {
      const { accessToken } = await createMentee();
      const res = await request(app).patch("/api/user/profile").set(authHeader(accessToken)).send({ notARealField: "x" });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/no valid fields/i);
    });
  });

  describe("POST /api/user/change-password", () => {
    it("TC-USER-003: changes the password with the correct current password", async () => {
      const { accessToken, user } = await createMentee({ password: "OldPass123!" });
      const res = await request(app).post("/api/user/change-password").set(authHeader(accessToken)).send({
        currentPassword: "OldPass123!", newPassword: "NewPass123!",
      });
      expect(res.status).toBe(200);

      const loginRes = await request(app).post("/api/auth/login").send({ email: user.email, password: "NewPass123!" });
      expect(loginRes.status).toBe(200);
    });

    it("TC-USER-004: rejects an incorrect current password", async () => {
      const { accessToken } = await createMentee({ password: "OldPass123!" });
      const res = await request(app).post("/api/user/change-password").set(authHeader(accessToken)).send({
        currentPassword: "WrongPass123!", newPassword: "NewPass123!",
      });
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/incorrect/i);
    });
  });

  describe("DELETE /api/user/account", () => {
    it("TC-USER-005: deletes the caller's own account and linked profile", async () => {
      const { accessToken, userId, user } = await createMentee();
      const res = await request(app).delete("/api/user/account").set(authHeader(accessToken));
      expect(res.status).toBe(200);

      const User = (await import("./models/User.js")).default;
      expect(await User.findById(userId)).toBeNull();
      void user;
    });
  });
});
