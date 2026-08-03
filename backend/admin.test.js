import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, authHeader, createAdmin, createMentor, createMentee } from "./test/helpers.js";
import MentorProfile from "./models/MentorProfile.js";
import User from "./models/User.js";

// TC-ADMIN-001 .. 008 (qa/test_cases_testrail_import.csv).
describe("Admin", () => {
  describe("GET /api/admin/users", () => {
    it("TC-ADMIN-001: lists all mentors and mentees", async () => {
      const admin = await createAdmin();
      await createMentor();
      await createMentee();

      const res = await request(app).get("/api/admin/users").set(authHeader(admin.accessToken));
      expect(res.status).toBe(200);
      expect(res.body.users.length).toBe(2);
      const roles = res.body.users.map((u) => u.role).sort();
      expect(roles).toEqual(["mentee", "mentor"]);
    });

    it("TC-ADMIN-002: filters the user list by role", async () => {
      const admin = await createAdmin();
      await createMentor();
      await createMentee();

      const res = await request(app).get("/api/admin/users").query({ role: "mentor" }).set(authHeader(admin.accessToken));
      expect(res.status).toBe(200);
      expect(res.body.users.length).toBe(1);
      expect(res.body.users[0].role).toBe("mentor");
    });

    it("TC-ADMIN-003: rejects a non-admin listing users", async () => {
      const { accessToken } = await createMentee();
      const res = await request(app).get("/api/admin/users").set(authHeader(accessToken));
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/required role: admin/i);
    });

    it("TC-ADMIN-008: a mentee's linked profile fields are joined and returned in the admin list", async () => {
      const admin = await createAdmin();
      const mentee = await createMentee();
      const MenteeProfileFlat = (await import("./models/Mentee_Profiles.js")).default;
      await new MenteeProfileFlat({
        _id: "admin-list-session", session_id: "admin-list-session", userId: mentee.userId,
        university: "Admin Test University", degree: "BS CS",
      }).save({ validateBeforeSave: false });

      const res = await request(app).get("/api/admin/users").set(authHeader(admin.accessToken));
      const listed = res.body.users.find((u) => u.id === String(mentee.userId));
      expect(listed.menteeProfile.university).toBe("Admin Test University");
    });
  });

  describe("POST /api/admin/mentors/:id/approve", () => {
    it("TC-ADMIN-004: approves a mentor", async () => {
      const admin = await createAdmin();
      const mentor = await createMentor();
      await MentorProfile.findOneAndUpdate({ userId: mentor.userId }, { status: "pending", isApproved: false });

      const res = await request(app).post(`/api/admin/mentors/${mentor.userId}/approve`).set(authHeader(admin.accessToken));
      expect(res.status).toBe(200);
      expect(res.body.mentorProfile.status).toBe("approved");
      expect(res.body.mentorProfile.isApproved).toBe(true);
      expect(res.body.mentorProfile.approvedAt).toBeTruthy();
    });
  });

  describe("POST /api/admin/mentors/:id/reject", () => {
    it("TC-ADMIN-005: rejects a mentor with a reason", async () => {
      const admin = await createAdmin();
      const mentor = await createMentor();

      const res = await request(app).post(`/api/admin/mentors/${mentor.userId}/reject`).set(authHeader(admin.accessToken)).send({ reason: "Incomplete profile" });
      expect(res.status).toBe(200);
      expect(res.body.mentorProfile.status).toBe("rejected");
      expect(res.body.mentorProfile.rejectionReason).toBe("Incomplete profile");
    });
  });

  describe("DELETE /api/admin/users/:id", () => {
    it("TC-ADMIN-006: deletes a user and their role profile", async () => {
      const admin = await createAdmin();
      const mentor = await createMentor();

      const res = await request(app).delete(`/api/admin/users/${mentor.userId}`).set(authHeader(admin.accessToken));
      expect(res.status).toBe(200);
      expect(await User.findById(mentor.userId)).toBeNull();
      expect(await MentorProfile.findOne({ userId: mentor.userId })).toBeNull();
    });

    it("TC-ADMIN-007: blocks an admin from deleting their own account via this endpoint", async () => {
      const admin = await createAdmin();
      const res = await request(app).delete(`/api/admin/users/${admin.user.id}`).set(authHeader(admin.accessToken));
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot delete your own admin account/i);
    });
  });
});
