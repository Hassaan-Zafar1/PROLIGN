import User from "../models/User.js";
import { logAudit } from "../services/auditLogService.js";

// ─── Update Profile ───────────────────────────────────────────────────────────
export async function updateProfile(req, res, next) {
  try {
    console.log("📩 Update profile body:", req.body); // ← add this
    // Fields allowed to be updated
    const allowedFields = [
      "name", "phone", "country", "city", "title",
      "company", "bio", "linkedinUrl", "profilePic",
      "skills", "languages", "certifications", "hourlyRate",
      "experience", "preferredCategories", "availableSlots",
      "weeklySchedule", "education", "careerGoals",
      "skillsToLearn", "learningInterests",
      "profileVisibility", "emailSessionRequests",
      "emailReminders", "emailMarketing", "appearanceTheme",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided to update.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    await logAudit({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: "profile_updated",
      targetId: req.user._id,
      targetType: "user",
      after: updates,
      request: req,
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        profilePic: user.profilePic,
        linkedinUrl: user.linkedinUrl,
        phone: user.phone,
        country: user.country,
        city: user.city,
        title: user.title,
        company: user.company,
        bio: user.bio,
        skills: user.skills,
        languages: user.languages,
        certifications: user.certifications,
        hourlyRate: user.hourlyRate,
        experience: user.experience,
        preferredCategories: user.preferredCategories,
        availableSlots: user.availableSlots,
        weeklySchedule: user.weeklySchedule,
        education: user.education,
        careerGoals: user.careerGoals,
        skillsToLearn: user.skillsToLearn,
        learningInterests: user.learningInterests,
        profileVisibility: user.profileVisibility,
        emailSessionRequests: user.emailSessionRequests,
        emailReminders: user.emailReminders,
        emailMarketing: user.emailMarketing,
        appearanceTheme: user.appearanceTheme,
        authProvider: user.authProvider,
        isEmailVerified: user.isEmailVerified,
        isProfileComplete: user.isProfileComplete,
        onboardingStep: user.onboardingStep,
        cv: user.cv,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── Delete Account ───────────────────────────────────────────────────────────
export async function deleteAccount(req, res, next) {
  try {
    await User.findByIdAndDelete(req.user._id);

    res.clearCookie("refreshToken");
    res.status(200).json({
      success: true,
      message: "Account deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}