import MenteeProfileFlat from "../models/Mentee_Profiles.js";
import { ApiError } from "../middleware/errorHandler.js";

/**
 * MenteeProfileFlat CRUD (private — a mentee profile is not publicly browsable).
 *
 * Documents are created by the Python AI_interviewer (keyed by session_id) and
 * linked to a user via POST /api/interview — there is no "create" here.
 *
 * Frontend usage:
 *   GET    /api/mentee-profiles              → admin only (all mentees)
 *   GET    /api/mentee-profiles/me           → my own profile
 *   PATCH  /api/mentee-profiles/me           → update my own profile
 *   GET    /api/mentee-profiles/:id          → owner or admin (:id = session_id)
 *   PATCH  /api/mentee-profiles/:id          → owner or admin
 *   DELETE /api/mentee-profiles/:id          → admin
 */

// Fields a mentee may edit. Python/derived fields (session_id, userId, cleaned_*,
// generated_at, source, mentee_experience_years) are excluded.
const OWNER_EDITABLE = [
  "full_name", "university", "degree", "experience_level", "domain_interest",
  "target_role", "target_company_tier", "target_industry", "bio",
  "tech_skills", "domain_skills", "soft_skills", "linkedinUrl",
];

const parsePage = (q) => {
  const page = Math.max(parseInt(q.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const applyUpdates = (profile, body) => {
  OWNER_EDITABLE.forEach((f) => { if (body[f] !== undefined) profile[f] = body[f]; });
};

const ownOr403 = (profile, user) => {
  const owner = String(profile.userId?._id || profile.userId) === String(user._id);
  if (!owner && user.role !== "admin") throw new ApiError(403, "Not allowed to access this profile.");
};

export async function listProfiles(query, user) {
  if (user.role !== "admin") throw new ApiError(403, "Only an admin can list mentee profiles.");
  const { page, limit, skip } = parsePage(query);
  const [data, total] = await Promise.all([
    MenteeProfileFlat.find().populate("userId", "name profilePic country city").sort({ generated_at: -1 }).skip(skip).limit(limit).lean(),
    MenteeProfileFlat.countDocuments(),
  ]);
  return { data, total, page, pages: Math.ceil(total / limit) || 1 };
}

export async function getMyProfile(user) {
  const profile = await MenteeProfileFlat.findOne({ userId: user._id }).populate("userId", "name profilePic country city");
  if (!profile) throw new ApiError(404, "You don't have a mentee profile yet. Complete the interview first.");
  return profile;
}

export async function getProfile(id, user) {
  const profile = await MenteeProfileFlat.findById(id).populate("userId", "name profilePic country city");
  if (!profile) throw new ApiError(404, "Mentee profile not found.");
  ownOr403(profile, user);
  return profile;
}

export async function updateMyProfile(user, body) {
  const profile = await MenteeProfileFlat.findOne({ userId: user._id });
  if (!profile) throw new ApiError(404, "You don't have a mentee profile yet. Complete the interview first.");
  applyUpdates(profile, body);
  await profile.save();
  return profile;
}

export async function updateProfile(id, user, body) {
  const profile = await MenteeProfileFlat.findById(id);
  if (!profile) throw new ApiError(404, "Mentee profile not found.");
  ownOr403(profile, user);
  applyUpdates(profile, body);
  await profile.save();
  return profile;
}

export async function deleteProfile(id, user) {
  if (user.role !== "admin") throw new ApiError(403, "Only an admin can delete a mentee profile.");
  const profile = await MenteeProfileFlat.findByIdAndDelete(id);
  if (!profile) throw new ApiError(404, "Mentee profile not found.");
  return { message: "Mentee profile deleted." };
}
