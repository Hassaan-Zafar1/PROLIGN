import User from "../models/User.js";
import MentorProfile from "../models/MentorProfile.js";
import MenteeProfileFlat from "../models/Mentee_Profiles.js";
import { logAudit } from "./auditLogService.js";
import { buildUserResponse } from "./authService.js";
import { ApiError } from "../middleware/errorHandler.js";

// User holds only shared identity + preferences. Role-specific fields are
// updated via the mentor-profile / mentee-profile endpoints.
const ALLOWED_FIELDS = [
  "name", "country", "city", "profilePic",
  "profileVisibility", "emailSessionRequests",
  "emailReminders", "emailMarketing", "appearanceTheme",
];

export async function updateProfile(userId, body, req) {
  const updates = {};
  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) updates[field] = body[field];
  }
  if (Object.keys(updates).length === 0) throw new ApiError(400, "No valid fields provided to update.");

  const user = await User.findByIdAndUpdate(userId, { $set: updates }, { returnDocument: "after", runValidators: true });
  if (!user) throw new ApiError(404, "User not found.");

  await logAudit({
    actorId: userId, actorRole: user.role, action: "profile_updated",
    targetId: userId, targetType: "user", after: updates, request: req,
  });

  return buildUserResponse(user);
}

export async function changePassword(userId, { currentPassword, newPassword }, req) {
  if (!currentPassword || !newPassword) throw new ApiError(400, "Current password and new password are required.");
  if (newPassword.length < 8) throw new ApiError(400, "New password must be at least 8 characters.");

  const user = await User.findById(userId).select("+password");
  if (!user) throw new ApiError(404, "User not found.");
  if (!(await user.comparePassword(currentPassword))) throw new ApiError(401, "Current password is incorrect.");

  user.password = newPassword; // pre-save hook hashes it
  await user.save();

  await logAudit({
    actorId: userId, actorRole: user.role, action: "password_changed",
    targetId: userId, targetType: "user", after: { changedAt: new Date() }, request: req,
  });
  return { message: "Password changed successfully." };
}

export async function deleteAccount(userId) {
  const deleted = await User.findByIdAndDelete(userId);
  if (!deleted) throw new ApiError(404, "User not found.");
  // Cascade: remove the linked role profile too.
  await MentorProfile.deleteOne({ userId });
  await MenteeProfileFlat.deleteOne({ userId });
  return { message: "Account deleted successfully." };
}
