import User from "../models/User.js";
import MenteeProfileFlat from "../models/Mentee_Profiles.js";
import { logAudit } from "./auditLogService.js";
import { ApiError } from "../middleware/errorHandler.js";

/**
 * Mentee interview LINKING (not the interview itself).
 *
 * The actual interview — conversation + profile extraction — runs in the
 * Python AI_interviewer service, which writes a MenteeProfileFlat document
 * keyed by session_id (its Mongo _id). That service has no notion of a
 * ProLign account, so this is the step that closes the loop: given the
 * sessionId the frontend obtained from the Python service, attach this
 * authenticated user's userId (+ optional linkedinUrl) onto that document.
 */
export async function submitInterview(user, { sessionId, linkedinUrl }, req) {
  if (!sessionId) throw new ApiError(400, "sessionId is required.");

  const profile = await MenteeProfileFlat.findById(sessionId);
  if (!profile) throw new ApiError(404, "Interview session not found. Please complete the interview first.");

  if (profile.userId && String(profile.userId) !== String(user._id)) {
    throw new ApiError(409, "This interview session is already linked to a different account.");
  }

  // One profile per user — drop any earlier session already linked to this
  // user (e.g. a retaken interview) so the sparse-unique userId index stays clean.
  await MenteeProfileFlat.deleteMany({ userId: user._id, _id: { $ne: sessionId } });

  // req.user._id is already a Mongoose ObjectId — assign it directly. Never
  // wrap a string userId in `new mongoose.Types.ObjectId(...)` unless it
  // genuinely arrived as a raw string (e.g. from a JWT payload).
  profile.userId = user._id;
  // Prefer an explicit linkedinUrl from this call, else fall back to what was
  // captured at signup (stored on User since the mentee had no profile yet).
  const link = linkedinUrl || user.linkedinUrl;
  if (link) profile.linkedinUrl = link;
  await profile.save();

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { $set: { isProfileComplete: true, onboardingStep: "complete" } },
    { returnDocument: "after", runValidators: true }
  ).select("-password -refreshTokens");

  // targetType/targetId stay on "user" — MenteeProfileFlat._id is the Python
  // session_id (a string), which the AuditLog schema's ObjectId targetId can't hold.
  await logAudit({
    actorId: user._id, actorRole: user.role, action: "mentee_interview_completed",
    targetId: user._id, targetType: "user",
    after: { sessionId: profile._id }, request: req,
  });

  return { user: updatedUser, menteeProfile: profile };
}

export async function getInterview(userId) {
  const profile = await MenteeProfileFlat.findOne({ userId }).lean();
  return { profile: profile || null };
}
