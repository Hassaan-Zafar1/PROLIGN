import MenteeProfile from "../models/MenteeProfile.js";
import { ApiError } from "../middleware/errorHandler.js";

/**
 * MenteeProfile CRUD (private — a mentee profile is not publicly browsable).
 *
 * Frontend usage:
 *   GET    /api/mentee-profiles              → admin only (all mentees)
 *   GET    /api/mentee-profiles/me           → my own profile
 *   PATCH  /api/mentee-profiles/me           → update my own profile
 *   GET    /api/mentee-profiles/:id          → owner or admin
 *   POST   /api/mentee-profiles              → create (one per user)
 *   PATCH  /api/mentee-profiles/:id          → owner or admin
 *   DELETE /api/mentee-profiles/:id          → admin
 */

// Fields a mentee may edit. AI-generated (skillProfile, matchHistory, cleaned) excluded.
const OWNER_EDITABLE = [
  "bio", "university", "degree", "education", "graduationYear", "city", "country",
  "linkedinUrl", "careerGoals", "skillsToLearn", "learningInterests", "languages",
  "domainInterest", "softSkills", "interviewAnswers", "onboardingAnswers",
  "preferredSessionType", "preferredLanguage", "budgetPerSession",
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
    MenteeProfile.find().populate("userId", "name profilePic country city").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    MenteeProfile.countDocuments(),
  ]);
  return { data, total, page, pages: Math.ceil(total / limit) || 1 };
}

export async function getMyProfile(user) {
  const profile = await MenteeProfile.findOne({ userId: user._id }).populate("userId", "name profilePic country city");
  if (!profile) throw new ApiError(404, "You don't have a mentee profile yet.");
  return profile;
}

export async function getProfile(id, user) {
  const profile = await MenteeProfile.findById(id).populate("userId", "name profilePic country city");
  if (!profile) throw new ApiError(404, "Mentee profile not found.");
  ownOr403(profile, user);
  return profile;
}

export async function createProfile(user, body) {
  const exists = await MenteeProfile.findOne({ userId: user._id });
  if (exists) throw new ApiError(409, "You already have a mentee profile.");
  const profile = new MenteeProfile({ userId: user._id });
  applyUpdates(profile, body);
  await profile.save();
  return profile;
}

export async function updateMyProfile(user, body) {
  const profile = await MenteeProfile.findOne({ userId: user._id });
  if (!profile) throw new ApiError(404, "You don't have a mentee profile yet.");
  applyUpdates(profile, body);
  await profile.save();
  return profile;
}

export async function updateProfile(id, user, body) {
  const profile = await MenteeProfile.findById(id);
  if (!profile) throw new ApiError(404, "Mentee profile not found.");
  ownOr403(profile, user);
  applyUpdates(profile, body);
  await profile.save();
  return profile;
}

export async function deleteProfile(id, user) {
  if (user.role !== "admin") throw new ApiError(403, "Only an admin can delete a mentee profile.");
  const profile = await MenteeProfile.findByIdAndDelete(id);
  if (!profile) throw new ApiError(404, "Mentee profile not found.");
  return { message: "Mentee profile deleted." };
}
