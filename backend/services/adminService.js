import mongoose from "mongoose";
import User from "../models/User.js";
import MentorProfile from "../models/MentorProfile.js";
import MenteeProfileFlat from "../models/Mentee_Profiles.js";
import { logAudit } from "./auditLogService.js";
import { ApiError } from "../middleware/errorHandler.js";

// User fields safe for an admin; role data comes from the populated/joined profile.
const ADMIN_USER_FIELDS =
  "name email role profilePic country city isActive isBanned " +
  "isEmailVerified isProfileComplete onboardingStep createdAt lastLoginAt " +
  "mentorProfile";

export async function listUsers({ role } = {}) {
  const filter = role ? { role } : { role: { $in: ["mentor", "mentee"] } };
  const users = await User.find(filter)
    .select(ADMIN_USER_FIELDS)
    .populate("mentorProfile")
    .sort({ createdAt: -1 })
    .lean();

  // menteeProfile isn't a Mongoose ref — MenteeProfileFlat._id is the Python
  // interview's session_id (a string), not this user's ObjectId — so join
  // manually by userId instead of populate().
  const menteeIds = users.filter((u) => u.role === "mentee").map((u) => u._id);
  if (menteeIds.length) {
    const profiles = await MenteeProfileFlat.find({ userId: { $in: menteeIds } }).lean();
    const byUserId = new Map(profiles.map((p) => [String(p.userId), p]));
    users.forEach((u) => {
      if (u.role === "mentee") u.menteeProfile = byUserId.get(String(u._id)) || null;
    });
  }

  return { users: users.map((u) => ({ ...u, id: u._id })) };
}

// Set a mentor's moderation status on their MentorProfile (id = User id).
async function setMentorStatus(admin, id, { status, reason = null, action }, req) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid mentor id.");
  const user = await User.findOne({ _id: id, role: "mentor" });
  if (!user) throw new ApiError(404, "Mentor not found.");

  const profile = await MentorProfile.findOneAndUpdate(
    { userId: id },
    {
      $set: {
        status,
        isApproved: status === "approved",
        rejectionReason: status === "rejected" ? reason : null,
        approvedAt: status === "approved" ? new Date() : null,
        approvedBy: admin._id,
      },
    },
    { returnDocument: "after" }
  );
  if (!profile) throw new ApiError(404, "Mentor profile not found.");

  await logAudit({
    actorId: admin._id, actorRole: admin.role, action,
    targetId: profile._id, targetType: "mentor_profile", after: { status, reason }, request: req,
  });
  return { mentorProfile: profile };
}

export const approveMentor = (admin, id, req) =>
  setMentorStatus(admin, id, { status: "approved", action: "mentor_approved" }, req);

export const rejectMentor = (admin, id, reason, req) =>
  setMentorStatus(admin, id, { status: "rejected", reason: reason || null, action: "mentor_rejected" }, req);

export async function deleteUser(admin, id, req) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid user id.");
  if (id === String(admin._id)) throw new ApiError(400, "You cannot delete your own admin account here.");

  const deleted = await User.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "User not found.");
  await MentorProfile.deleteOne({ userId: id });
  await MenteeProfileFlat.deleteOne({ userId: id });

  await logAudit({
    actorId: admin._id, actorRole: admin.role, action: "user_deleted",
    targetId: id, targetType: "user", after: { deleted: true }, request: req,
  });
  return { message: "User and profile deleted." };
}
