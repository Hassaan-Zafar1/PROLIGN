import User from "../models/User.js";
import MenteeProfile from "../models/MenteeProfile.js";
import AiAssessment from "../models/AiAssessment.js";
import { logAudit } from "./auditLogService.js";
import { ApiError } from "../middleware/errorHandler.js";

/**
 * Mentee onboarding interview (NO LLM). Stores the answers verbatim on the
 * AiAssessment conversation AND mapped onto MenteeProfile (never on User) — the
 * Python EDA job reads these to populate the cleaned.* fields.
 */

const toArray = (val) =>
  Array.isArray(val)
    ? val.map((v) => String(v).trim()).filter(Boolean)
    : String(val || "").split(",").map((s) => s.trim()).filter(Boolean);
const uniq = (arr) => [...new Set(arr)];
const str = (v) => (Array.isArray(v) ? v.join(", ") : String(v ?? "")).trim();

export async function submitInterview(user, { answers, mode = "text" }, req) {
  if (!Array.isArray(answers) || answers.length === 0) throw new ApiError(400, "answers are required.");

  // Conversation turns (assistant asks → user answers), stored verbatim.
  const conversation = [];
  for (const a of answers) {
    if (a?.question) conversation.push({ role: "assistant", content: String(a.question) });
    conversation.push({ role: "user", content: Array.isArray(a?.answer) ? a.answer.join(", ") : String(a?.answer ?? "") });
  }

  const assessment = await AiAssessment.findOneAndUpdate(
    { menteeId: user._id },
    {
      menteeId: user._id,
      mode: mode === "voice" ? "voice" : "text",
      status: "completed",
      completedAt: new Date(),
      conversation,
    },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );

  const byId = Object.fromEntries(answers.map((a) => [a.id, a.answer]));
  const techSkills = uniq([...toArray(byId.languages), ...toArray(byId.frameworks_tools)]);

  // All mentee onboarding data → MenteeProfile (never User).
  const mp = await MenteeProfile.findOneAndUpdate(
    { userId: user._id },
    {
      $set: {
        university: str(byId.university) || null,
        degree: str(byId.degree) || null,
        education: [str(byId.degree), str(byId.university)].filter(Boolean).join(" — ") || null,
        bio: str(byId.for_mentors).slice(0, 300) || null,
        careerGoals: str(byId.target) || null,
        softSkills: toArray(byId.soft_skills),
        "skillProfile.skills": techSkills,
        interviewAnswers: answers.map((a) => ({ id: a.id, question: a.question, answer: a.answer })),
        "onboardingAnswers.targetRole": str(byId.target) || null,
        "onboardingAnswers.notableProject": str(byId.notable_project) || null,
        "onboardingAnswers.problemSolving": str(byId.problem_solving) || null,
        "onboardingAnswers.experience": str(byId.experience) || null,
      },
      $setOnInsert: { userId: user._id },
    },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );

  // User: only account/onboarding state + the profile link.
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { $set: { isProfileComplete: true, onboardingStep: "complete", menteeProfile: mp._id } },
    { returnDocument: "after", runValidators: true }
  ).select("-password -refreshTokens").populate("menteeProfile");

  await logAudit({
    actorId: user._id, actorRole: user.role, action: "mentee_interview_completed",
    targetId: assessment._id, targetType: "ai_assessment",
    after: { turns: conversation.length, menteeProfile: mp._id }, request: req,
  });

  return { assessment, user: updatedUser, menteeProfile: mp };
}

export async function getInterview(userId) {
  const assessment = await AiAssessment.findOne({ menteeId: userId }).lean();
  return { assessment: assessment || null };
}

const toList = (value) =>
  Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : String(value || "")
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean);

export async function completeInterview(user, { menteeRecord, conversation = [], mode = "text" }, req) {
  if (!menteeRecord) throw new ApiError(400, "menteeRecord is required.");

  const profile = await MenteeProfile.findOneAndUpdate(
    { userId: user._id },
    {
      $set: {
        userId: user._id,
        university: menteeRecord.university || null,
        degree: menteeRecord.degree || null,
        education: [menteeRecord.degree, menteeRecord.university].filter(Boolean).join(" — ") || null,
        bio: menteeRecord.bio || null,
        careerGoals: menteeRecord.target_role || null,
        domainInterest: menteeRecord.domain_interest || null,
        softSkills: toList(menteeRecord.soft_skills),
        skillProfile: {
          generatedAt: new Date(),
          skills: toList(menteeRecord.tech_skills),
          domains: toList(menteeRecord.domain_skills),
          careerGoals: toList(menteeRecord.target_role),
          industries: toList(menteeRecord.target_industry),
        },
        onboardingAnswers: {
          targetRole: menteeRecord.target_role || null,
          targetIndustry: toList(menteeRecord.target_industry),
          experienceLevel: menteeRecord.experience_level || null,
          targetCompanyTier: menteeRecord.target_company_tier || null,
          yearsOfExp: Number(menteeRecord.mentee_experience_years) || 0,
        },
        interviewAnswers: conversation,
      },
      $setOnInsert: { userId: user._id },
    },
    { upsert: true, new: true, runValidators: true }
  );

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        isProfileComplete: true,
        onboardingStep: "complete",
        menteeProfile: profile._id,
      },
    },
    { new: true, runValidators: true }
  )
    .select("-password -refreshTokens")
    .populate("menteeProfile");

  return { user: updatedUser, menteeProfile: profile };
}
