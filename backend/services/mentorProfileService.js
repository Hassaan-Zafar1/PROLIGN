import MentorProfile from "../models/MentorProfile.js";
import { ApiError } from "../middleware/errorHandler.js";

/**
 * MentorProfile CRUD (the profile is normally created at registration).
 *
 * Frontend usage:
 *   GET    /api/mentor-profiles?page=&limit=   → approved profiles (admin sees all)
 *   GET    /api/mentor-profiles/me             → my own profile
 *   PATCH  /api/mentor-profiles/me             → update my own profile
 *   GET    /api/mentor-profiles/:id
 *   POST   /api/mentor-profiles                → create (one per user)
 *   PATCH  /api/mentor-profiles/:id            → owner or admin
 *   DELETE /api/mentor-profiles/:id            → admin
 */

// Fields a mentor may edit. Ratings/approval/AI-cleaned fields are excluded.
const OWNER_EDITABLE = [
  "headline", "bio", "title", "company", "industry", "linkedinUrl",
  "skills", "domains", "industries", "domainTag", "softSkills", "languages",
  "certifications", "preferredCategories", "hourlyRate", "pricePerSession",
  "experience", "availableSlots", "weeklySchedule", "currency", "sessionDuration",
  "mentorshipTypes", "maxMenteesPerWeek", "isTakingMentees", "workExperience",
  "currentCompany", "education",
];
// Additional fields only an admin may set.
const ADMIN_EDITABLE = ["status", "isApproved", "rejectionReason"];

const parsePage = (q) => {
  const page = Math.max(parseInt(q.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const applyUpdates = (profile, body, fields) => {
  fields.forEach((f) => { if (body[f] !== undefined) profile[f] = body[f]; });
};

export async function listProfiles(query, user) {
  const { page, limit, skip } = parsePage(query);
  const filter = user.role === "admin" ? {} : { status: "approved" };

  const [data, total] = await Promise.all([
    MentorProfile.find(filter).populate("userId", "name profilePic country city").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    MentorProfile.countDocuments(filter),
  ]);
  return { data, total, page, pages: Math.ceil(total / limit) || 1 };
}

export async function getMyProfile(user) {
  const profile = await MentorProfile.findOne({ userId: user._id }).populate("userId", "name profilePic country city");
  if (!profile) throw new ApiError(404, "You don't have a mentor profile yet.");
  return profile;
}

export async function getProfile(id, user) {
  const profile = await MentorProfile.findById(id).populate("userId", "name profilePic country city");
  if (!profile) throw new ApiError(404, "Mentor profile not found.");
  const isOwner = String(profile.userId?._id || profile.userId) === String(user._id);
  if (profile.status !== "approved" && !isOwner && user.role !== "admin") {
    throw new ApiError(403, "This profile is not public.");
  }
  return profile;
}

export async function createProfile(user, body) {
  const exists = await MentorProfile.findOne({ userId: user._id });
  if (exists) throw new ApiError(409, "You already have a mentor profile.");
  const profile = new MentorProfile({ userId: user._id, status: "approved", isApproved: true });
  applyUpdates(profile, body, OWNER_EDITABLE);
  await profile.save();
  return profile;
}

export async function updateMyProfile(user, body) {
  const profile = await MentorProfile.findOne({ userId: user._id });
  if (!profile) throw new ApiError(404, "You don't have a mentor profile yet.");
  applyUpdates(profile, body, OWNER_EDITABLE);
  await profile.save();
  return profile;
}

export async function updateProfile(id, user, body) {
  const profile = await MentorProfile.findById(id);
  if (!profile) throw new ApiError(404, "Mentor profile not found.");
  const isOwner = String(profile.userId) === String(user._id);
  const isAdmin = user.role === "admin";
  if (!isOwner && !isAdmin) throw new ApiError(403, "Not allowed to modify this profile.");

  applyUpdates(profile, body, OWNER_EDITABLE);
  if (isAdmin) applyUpdates(profile, body, ADMIN_EDITABLE);
  await profile.save();
  return profile;
}

export async function deleteProfile(id, user) {
  if (user.role !== "admin") throw new ApiError(403, "Only an admin can delete a mentor profile.");
  const profile = await MentorProfile.findByIdAndDelete(id);
  if (!profile) throw new ApiError(404, "Mentor profile not found.");
  return { message: "Mentor profile deleted." };
}
