import User from "../models/User.js";
import AiAssessment from "../models/AiAssessment.js";
import { logAudit } from "../services/auditLogService.js";

/**
 * Mentee onboarding interview (Task 7).
 *
 * A text-based interview FRAMEWORK — deliberately NO LLM yet. The questions come
 * from the client's static interview config; we store the raw Q&A as an
 * AiAssessment conversation and map the well-known answers onto the mentee's
 * profile. `generatedProfile` is left empty for the future AI model to fill.
 */

const toArray = (val) =>
  Array.isArray(val)
    ? val.map((v) => String(v).trim()).filter(Boolean)
    : String(val || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

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
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Map known question ids onto the mentee's profile — these are exactly the
    // fields the mentor recommendation seam (recommendationService) reads, so
    // every interview answer here is doing real matching work, not just being
    // archived in the conversation log above.
    const byId = Object.fromEntries(answers.map((a) => [a.id, a.answer]));
    const updates = { isProfileComplete: true, onboardingStep: "complete" };
    if (byId.career_goal) {
      updates.careerGoals = Array.isArray(byId.career_goal) ? byId.career_goal.join(", ") : String(byId.career_goal);
    }
    if (byId.current_skills) updates.skills = toArray(byId.current_skills);
    if (byId.skills_to_learn) updates.skillsToLearn = toArray(byId.skills_to_learn);
    if (byId.focus_areas) {
      updates.preferredCategories = toArray(byId.focus_areas);
      updates.learningInterests = toArray(byId.focus_areas);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password -refreshTokens");

    await logAudit({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: "mentee_interview_completed",
      targetId: assessment._id,
      targetType: "ai_assessment",
      after: { turns: conversation.length },
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
