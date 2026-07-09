import mongoose from "mongoose";
import User from "../models/User.js";
import MentorProfile from "../models/MentorProfile.js";
import { buildProfileFromSources } from "./cvExtractionService.js";
import { logAudit } from "./auditLogService.js";
import { ApiError } from "../middleware/errorHandler.js";

/**
 * Mentor directory + profile building.
 * Mentor domain data lives on MentorProfile (1:1 with User via userId).
 * Listings join MentorProfile → User and return a FLAT public view
 * (`id` = User _id). Sensitive fields (cv text, cleaned, email, tokens) never leak.
 */

const PUBLIC_PROJECTION = {
  _id: 0,
  id: "$user._id",
  mentorProfileId: "$_id",
  name: "$user.name",
  profilePic: "$user.profilePic",
  country: "$user.country",
  city: "$user.city",
  title: 1, company: 1, industry: 1, bio: 1, headline: 1,
  skills: 1, domains: 1, industries: 1, languages: 1, certifications: 1, preferredCategories: 1,
  hourlyRate: 1, pricePerSession: 1, experience: 1, availableSlots: 1, weeklySchedule: 1,
  averageRating: 1, totalReviews: 1, totalSessions: 1, linkedinUrl: 1, createdAt: 1,
};

const SORT_MAP = {
  newest: { createdAt: -1 },
  experience: { experience: -1 },
  priceLow: { hourlyRate: 1 },
  priceHigh: { hourlyRate: -1 },
  rating: { averageRating: -1, totalReviews: -1 },
};

// MentorProfile→User pipeline for a filtered, active, approved list.
function mentorPipeline({ search, skills, minExperience, sort } = {}) {
  const pre = { status: "approved" };
  if (skills) {
    const list = String(skills).split(",").map((s) => s.trim()).filter(Boolean);
    if (list.length) pre.skills = { $in: list };
  }
  if (minExperience) {
    const min = parseInt(minExperience, 10);
    if (!Number.isNaN(min)) pre.experience = { $gte: min };
  }

  const stages = [
    { $match: pre },
    { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $match: { "user.isActive": true, "user.isBanned": { $ne: true } } },
  ];

  if (search) {
    const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    stages.push({ $match: { $or: [
      { "user.name": rx }, { title: rx }, { company: rx },
      { headline: rx }, { skills: rx }, { industries: rx },
    ] } });
  }

  stages.push({ $sort: SORT_MAP[sort] || SORT_MAP.newest });
  return stages;
}

export async function listMentors(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 24, 1), 100);

  const [result] = await MentorProfile.aggregate([
    ...mentorPipeline(query),
    { $facet: {
      data: [{ $skip: (page - 1) * limit }, { $limit: limit }, { $project: PUBLIC_PROJECTION }],
      meta: [{ $count: "total" }],
    } },
  ]);
  const mentors = result?.data || [];
  const total = result?.meta?.[0]?.total || 0;
  return { mentors, total, page, pages: Math.ceil(total / limit) || 1 };
}

export async function getRecommendedMentors(query) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 24, 1), 100);
  const mentors = await MentorProfile.aggregate([
    ...mentorPipeline({ sort: "rating" }),
    { $limit: limit },
    { $project: PUBLIC_PROJECTION },
  ]);
  return { mentors, strategy: "all_mentors_v0" };
}

export async function getMentorById(id) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid mentor id.");
  const [mentor] = await MentorProfile.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(id), status: "approved" } },
    { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $match: { "user.isActive": true, "user.isBanned": { $ne: true } } },
    { $project: PUBLIC_PROJECTION },
  ]);
  if (!mentor) throw new ApiError(404, "Mentor not found.");
  return mentor;
}

// Mentor onboarding: LinkedIn scrape attempt (compliant seam) → CV extraction
// fallback → write structured data onto MentorProfile. Never throws for missing
// data; mentors are auto-approved.
export async function buildMentorProfile(user, req) {
  let mp = await MentorProfile.findOne({ userId: user._id });
  if (!mp) mp = await MentorProfile.create({ userId: user._id, status: "approved", isApproved: true });

  if (mp.linkedinUrl) {
    mp.linkedinScrape = { status: "failed", lastAttempt: new Date(), error: "no_compliant_integration" };
  }

  const { profile, text, meta } = await buildProfileFromSources({
    cv: mp.cv,
    name: user.name,
    linkedinUrl: mp.linkedinUrl,
  });
  meta.textLength = text?.length || 0;

  if (profile.skills?.length) mp.skills = profile.skills;
  if (profile.certifications?.length) mp.certifications = profile.certifications;
  if (profile.experience > 0) mp.experience = profile.experience;
  if (profile.companies?.length) {
    mp.company = profile.companies[0];
    mp.currentCompany = { ...(mp.currentCompany || {}), name: profile.companies[0] };
  }
  if (profile.education?.length) mp.education = profile.education.map((e) => ({ institution: e }));
  if (profile.summary && !mp.bio) mp.bio = profile.summary;
  if (profile.title && !mp.title) mp.title = profile.title;
  if (profile.industry && !mp.industry) mp.industry = profile.industry;
  if (text && text.trim()) {
    if (!mp.cv) mp.cv = {};
    mp.cv.parsedText = text.slice(0, 20000);
    mp.markModified("cv");
  }
  await mp.save();

  await User.findByIdAndUpdate(user._id, {
    $set: { isProfileComplete: true, onboardingStep: "complete", mentorProfile: mp._id },
  });

  await logAudit({
    actorId: user._id, actorRole: user.role, action: "mentor_profile_built",
    targetId: mp._id, targetType: "mentor_profile",
    after: { cvParsed: meta.cvParsed, skills: profile.skills?.length || 0 }, request: req,
  });

  const updatedUser = await User.findById(user._id).select("-password -refreshTokens").populate("mentorProfile");
  return { profile, meta, user: updatedUser, mentorProfile: mp };
}
