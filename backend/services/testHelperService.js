import crypto from "crypto";
import { ApiError } from "../middleware/errorHandler.js";
import { getDevOTP } from "./otpService.js";
import MenteeProfileFlat from "../models/Mentee_Profiles.js";
import User from "../models/User.js";
import { env } from "../config/env.js";

/**
 * Dev/test-only helpers for E2E automation. Mounted only when
 * env.NODE_ENV !== "production" (see server.js) — this module is never
 * reachable in a production deployment regardless of what's imported here.
 */
function assertNonProduction() {
  if (env.NODE_ENV === "production") throw new ApiError(404, "Not found.");
}

export function getLastOtp(userId) {
  assertNonProduction();
  const otp = getDevOTP(userId);
  if (!otp) throw new ApiError(404, "No OTP on record for this user (dev/test only, process-memory).");
  return { otp };
}

// Mimics what the Python AI_interviewer writes to Mentee_Profiles (unlinked —
// no userId yet), so an E2E test can then drive the REAL POST /api/interview
// link endpoint against it — exercising the actual regression-fixed code path
// without needing to drive a live, non-deterministic LLM conversation.
export async function seedMenteeProfile(body = {}) {
  assertNonProduction();
  const sessionId = body.sessionId || crypto.randomUUID();

  const doc = new MenteeProfileFlat({
    _id: sessionId,
    session_id: sessionId,
    full_name: body.full_name || "E2E Test Mentee",
    university: body.university || "Test University",
    degree: body.degree || "BS Computer Science",
    experience_level: body.experience_level || "beginner",
    domain_interest: body.domain_interest || "Software Engineering",
    target_role: body.target_role || "Software Engineer",
    target_company_tier: body.target_company_tier || "Mid-market tech",
    target_industry: body.target_industry || "Technology",
    bio: body.bio || "Seeded by an E2E test.",
    tech_skills: body.tech_skills || "React | Node.js",
    domain_skills: body.domain_skills || "Web Development",
    soft_skills: body.soft_skills || "Communication",
    source: "e2e_seed",
  });
  // Skip Mongoose's `userId required` validator — Python's real raw-pymongo
  // insert has no userId either at this stage (that's exactly why the schema's
  // unique index on userId is sparse); linking it is the flow under test.
  await doc.save({ validateBeforeSave: false });

  return { sessionId };
}

// Ensures a known admin account exists (idempotent upsert), so the admin E2E
// journey doesn't depend on someone having manually run scripts/createAdmin.js
// against whichever database the suite happens to be pointed at.
export async function seedAdmin(body = {}) {
  assertNonProduction();
  const email = body.email || "e2e-admin@prolign.test";
  const password = body.password || "E2eAdmin@12345";
  const name = body.name || "E2E Admin";

  let user = await User.findOne({ email }).select("+password");
  if (user) {
    user.role = "admin";
    user.name = name;
    user.password = password; // re-hashed by the User model's pre-save hook
    user.isEmailVerified = true;
    user.isActive = true;
    user.isBanned = false;
    await user.save();
  } else {
    user = await User.create({ email, password, role: "admin", name, isEmailVerified: true, isActive: true });
  }
  return { email, password };
}
