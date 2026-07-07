import User from "../models/User.js";
import MenteeProfile from "../models/MenteeProfile.js";
import AiAssessment from "../models/AiAssessment.js";
import { logAudit } from "../services/auditLogService.js";

/**
 * Mentee onboarding interview (Task 7).
 *
 * A text-based interview FRAMEWORK — deliberately NO LLM yet. The 10-question
 * assessment answers are stored two ways:
 *   1. Verbatim Q&A on the AiAssessment conversation log.
 *   2. Mapped onto the mentee's MenteeProfile (raw fields) — this is what the
 *      offline Python EDA job reads to populate the `cleaned.*` fields for the
 *      matching model.
 * A few dashboard-facing fields are also mirrored to the User doc so the
 * existing mentee dashboard keeps working.
 */

const toArray = (val) =>
  Array.isArray(val)
    ? val.map((v) => String(v).trim()).filter(Boolean)
    : String(val || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
const uniq = (arr) => [...new Set(arr)];
const str = (v) => (Array.isArray(v) ? v.join(", ") : String(v ?? "")).trim();

// ─── POST /interview ──────────────────────────────────────────────────────────
export async function submitInterview(req, res, next) {
  try {
    const { answers, mode = "text" } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, message: "answers are required." });
    }

    // Build conversation turns (assistant asks → user answers), stored verbatim.
    const conversation = [];
    for (const a of answers) {
      if (a?.question) conversation.push({ role: "assistant", content: String(a.question) });
      conversation.push({
        role: "user",
        content: Array.isArray(a?.answer) ? a.answer.join(", ") : String(a?.answer ?? ""),
      });
    }

    // One assessment per mentee for now — upsert so re-taking overwrites.
    const assessment = await AiAssessment.findOneAndUpdate(
      { menteeId: req.user._id },
      {
        menteeId: req.user._id,
        mode: mode === "voice" ? "voice" : "text",
        status: "completed",
        completedAt: new Date(),
        conversation,
        // generatedProfile intentionally untouched — the AI model populates it later.
      },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
    );

    const byId = Object.fromEntries(answers.map((a) => [a.id, a.answer]));

    // Languages + frameworks/tools together form the mentee's technical skill set.
    const techSkills = uniq([...toArray(byId.languages), ...toArray(byId.frameworks_tools)]);

    // ── 1) Persist the raw interview answers on MenteeProfile ────────────────────
    // (the Python EDA job reads these and writes the cleaned.* fields).
    const mp = await MenteeProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        $set: {
          university: str(byId.university) || null,
          degree: str(byId.degree) || null,
          bio: str(byId.for_mentors).slice(0, 300) || null,
          softSkills: toArray(byId.soft_skills),
          "skillProfile.skills": techSkills,
          "onboardingAnswers.targetRole": str(byId.target) || null,
          "onboardingAnswers.notableProject": str(byId.notable_project) || null,
          "onboardingAnswers.problemSolving": str(byId.problem_solving) || null,
          "onboardingAnswers.experience": str(byId.experience) || null,
        },
        $setOnInsert: { userId: req.user._id },
      },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
    );

    // ── 2) Mirror dashboard-facing fields onto User + link the profile ───────────
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          isProfileComplete: true,
          onboardingStep: "complete",
          menteeProfile: mp._id,
          skills: techSkills,
          careerGoals: str(byId.target) || null,
          education: [str(byId.degree), str(byId.university)].filter(Boolean).join(" — ") || null,
        },
      },
      { returnDocument: "after", runValidators: true }
    ).select("-password -refreshTokens");

    await logAudit({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: "mentee_interview_completed",
      targetId: assessment._id,
      targetType: "ai_assessment",
      after: { turns: conversation.length, menteeProfile: mp._id },
      request: req,
    });

    res.status(200).json({ success: true, message: "Interview saved.", assessment, user });
  } catch (error) {
    next(error);
  }
}

// ─── GET /interview ───────────────────────────────────────────────────────────
export async function getInterview(req, res, next) {
  try {
    const assessment = await AiAssessment.findOne({ menteeId: req.user._id }).lean();
    res.status(200).json({ success: true, assessment: assessment || null });
  } catch (error) {
    next(error);
  }
}
