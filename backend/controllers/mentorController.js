import mongoose from "mongoose";
import User from "../models/User.js";
import { buildProfileFromSources } from "../services/cvExtractionService.js";
import { logAudit } from "../services/auditLogService.js";

/**
 * Public mentor directory endpoints.
 *
 * Mentor profile data currently lives on the User document (role: "mentor"),
 * so we read from User directly rather than the (not-yet-wired) MentorProfile
 * model. Only a curated, public-safe set of fields is ever returned — never
 * email, password, tokens, OTP, etc.
 *
 * These endpoints are intentionally public: browsing mentors does not require
 * authentication (mentees can discover before signing up). Booking/messaging a
 * mentor still goes through the authenticated flows.
 */

// Whitelist of fields safe to expose publicly on a mentor.
const PUBLIC_FIELDS = [
  "name", "title", "company", "bio", "profilePic",
  "skills", "languages", "certifications", "preferredCategories",
  "hourlyRate", "experience", "availableSlots", "weeklySchedule",
  "country", "city", "linkedinUrl", "createdAt",
].join(" ");

// Base filter for a mentor that should appear in the public directory.
const listableMentorFilter = () => ({
  role: "mentor",
  isActive: true,
  isBanned: { $ne: true },
});

// ─── GET /mentors ──────────────────────────────────────────────────────────────
// Supports ?search, ?skills (csv), ?minExperience, ?page, ?limit, ?sort
export async function listMentors(req, res, next) {
  try {
    const { search, skills, minExperience, sort } = req.query;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 24, 1), 100);

    const filter = listableMentorFilter();

    if (search) {
      const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { name: rx },
        { title: rx },
        { company: rx },
        { skills: rx },
      ];
    }

    if (skills) {
      const list = String(skills).split(",").map((s) => s.trim()).filter(Boolean);
      if (list.length) filter.skills = { $in: list };
    }

    if (minExperience) {
      const min = parseInt(minExperience, 10);
      if (!Number.isNaN(min)) filter.experience = { $gte: min };
    }

    // Sort map — default newest first. (Rating sort will be added with reviews.)
    const sortMap = {
      newest: { createdAt: -1 },
      experience: { experience: -1 },
      priceLow: { hourlyRate: 1 },
      priceHigh: { hourlyRate: -1 },
    };
    const sortBy = sortMap[sort] || { createdAt: -1 };

    const [mentors, total] = await Promise.all([
      User.find(filter)
        .select(PUBLIC_FIELDS)
        .sort(sortBy)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      mentors,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    next(error);
  }
}

// ─── GET /mentors/recommended ─────────────────────────────────────────────────
// Mentors recommended for a mentee.
//
// TODAY: simply returns all listable mentors (spec: "Initially display all
// mentors"). SEAM for the future AI model — once ~500+ mentors exist, replace
// the body below with the trained recommendation model, personalized from the
// authenticated mentee's profile (skills, careerGoals, learningInterests, which
// the client already forwards as query params). The route + response contract
// stays identical, so the frontend needs no change when the model is plugged in.
// The `strategy` field lets clients/telemetry know which algorithm produced it.
export async function getRecommendedMentors(req, res, next) {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 24, 1), 100);

    const mentors = await User.find(listableMentorFilter())
      .select(PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({ success: true, mentors, strategy: "all_mentors_v0" });
  } catch (error) {
    next(error);
  }
}

// ─── GET /mentors/:id ────────────────────────────────────────────────────────
export async function getMentorById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid mentor id." });
    }

    const mentor = await User.findOne({ _id: id, ...listableMentorFilter() })
      .select(PUBLIC_FIELDS)
      .lean();

    if (!mentor) {
      return res.status(404).json({ success: false, message: "Mentor not found." });
    }

    res.status(200).json({ success: true, mentor });
  } catch (error) {
    next(error);
  }
}

// ─── POST /mentors/profile/build ──────────────────────────────────────────────
// Auto-builds the mentor's structured profile from their uploaded CV (primary)
// with an optional compliant-LinkedIn seam. Designed to never fail the request:
// whatever we can extract is saved, the rest keeps the registration values, and
// onboarding always completes.
export async function buildMentorProfile(req, res, next) {
  try {
    const user = req.user; // full doc (minus password) from `protect`

    console.log(
      `[mentor-profile-build] user=${user._id} cv=${user.cv?.url ? "present" : "MISSING"}`,
      user.cv?.url ? `(${user.cv.url})` : "— was a CV uploaded at registration?"
    );

    const { profile, text, meta } = await buildProfileFromSources({
      cv: user.cv,
      name: user.name,
      linkedinUrl: user.linkedinUrl,
    });

    // Only overwrite a field when extraction actually produced a value, so we
    // never clobber good registration data with empty results.
    const updates = { isProfileComplete: true, onboardingStep: "complete" };
    if (profile.skills?.length) updates.skills = profile.skills;
    if (profile.certifications?.length) updates.certifications = profile.certifications;
    if (profile.experience > 0) updates.experience = profile.experience;
    if (profile.companies?.length) updates.company = profile.companies[0];
    if (profile.education?.length) updates.education = profile.education.join(" | ");
    if (profile.summary && !user.bio) updates.bio = profile.summary;
    if (text && text.trim()) updates["cv.parsedText"] = text.slice(0, 20000);

    console.log(`[mentor-profile-build] fields to update:`, Object.keys(updates));
    meta.textLength = text?.length || 0;

    const updated = await User.findByIdAndUpdate(
      user._id,
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    ).select("-password -refreshTokens");

    await logAudit({
      actorId: user._id,
      actorRole: user.role,
      action: "mentor_profile_built",
      targetId: user._id,
      targetType: "user",
      after: { cvParsed: meta.cvParsed, skills: profile.skills?.length || 0 },
      request: req,
    });

    res.status(200).json({
      success: true,
      message: "Profile built successfully.",
      profile,
      meta,
      user: updated,
    });
  } catch (error) {
    next(error);
  }
}
