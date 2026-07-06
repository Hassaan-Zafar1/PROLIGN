import jwt from "jsonwebtoken";
import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { generateAndSaveOTP, verifyOTP, clearOTP } from "../services/otpService.js";
import { sendOTPEmail, sendPasswordResetEmail } from "../services/emailService.js";
import { logAudit } from "../services/auditLogService.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateAccessToken(userId, role) {
  return jwt.sign({ id: userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

function generateRefreshToken(userId) {
  return jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// ✅ Single helper to build consistent user response object
function buildUserResponse(user) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    profilePic: user.profilePic,
    linkedinUrl: user.linkedinUrl,
    authProvider: user.authProvider,
    isEmailVerified: user.isEmailVerified,
    isProfileComplete: user.isProfileComplete,
    onboardingStep: user.onboardingStep,
    menteeProfile: user.menteeProfile,
    mentorProfile: user.mentorProfile,
    cv: user.cv,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,

    // ✅ Extended profile
    country: user.country,
    city: user.city,
    title: user.title,
    company: user.company,
    industry: user.industry,
    bio: user.bio,

    // ✅ Skills & arrays
    skills: user.skills,
    languages: user.languages,
    certifications: user.certifications,
    preferredCategories: user.preferredCategories,

    // ✅ Mentor-specific
    hourlyRate: user.hourlyRate,
    experience: user.experience,
    availableSlots: user.availableSlots,
    weeklySchedule: user.weeklySchedule,
    status: user.status,
    rejectionReason: user.rejectionReason,

    // ✅ Mentee-specific
    education: user.education,
    careerGoals: user.careerGoals,
    skillsToLearn: user.skillsToLearn,
    learningInterests: user.learningInterests,

    // ✅ Preferences
    profileVisibility: user.profileVisibility,
    emailSessionRequests: user.emailSessionRequests,
    emailReminders: user.emailReminders,
    emailMarketing: user.emailMarketing,
    appearanceTheme: user.appearanceTheme,

    // ✅ Account state
    isActive: user.isActive,
    isBanned: user.isBanned,
  };
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function register(req, res, next) {
  try {
    const { email, password, role, name, linkedinUrl, hourlyRate, cv } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and role are required.",
      });
    }

    if (!["mentee", "mentor"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be mentee or mentor.",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      if (!existing.isEmailVerified) {
        await clearOTP(existing._id);
        const otp = await generateAndSaveOTP(existing._id);
        await sendOTPEmail(email, otp);
        return res.status(200).json({
          success: true,
          message: "Account exists but email unverified. New OTP sent.",
          userId: existing._id,
        });
      }
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    const user = await User.create({
      email,
      password,
      role,
      ...(name && { name }),
      ...(linkedinUrl && { linkedinUrl }),
      // Mentors need admin approval before they're bookable — this is what
      // powers the WaitingForApproval page and AdminDashboard's pending queue.
      ...(role === "mentor" && { status: "pending" }),
      // Mentor onboarding data captured at signup. CV is a small Cloudinary
      // reference ({ url, filename }) plus the text extracted client-side
      // (parsedText) — not the file bytes — so it fits the body. parsedText is
      // what makes profile-building work even when Cloudinary blocks the
      // backend's raw-file download.
      ...(hourlyRate != null && hourlyRate !== "" && { hourlyRate: Number(hourlyRate) }),
      ...((cv?.url || cv?.parsedText) && {
        cv: {
          url: cv.url || null,
          filename: cv.filename || null,
          uploadedAt: new Date(),
          ...(cv.parsedText && { parsedText: cv.parsedText }),
        },
      }),
    });

    const otp = await generateAndSaveOTP(user._id);
    await sendOTPEmail(email, otp);

    await logAudit({
      actorId: user._id,
      actorRole: role,
      action: "user_registered",
      targetId: user._id,
      targetType: "user",
      after: { email, role, name },
      request: req,
    });

    res.status(201).json({
      success: true,
      message: "Registration initiated. Check your email for the OTP.",
      userId: user._id,
    });
  } catch (error) {
    next(error);
  }
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────

export async function verifyEmail(req, res, next) {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: "userId and otp are required.",
      });
    }

    const result = await verifyOTP(userId, otp);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    const user = await User.findById(userId).select("+refreshTokens");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    const hashedRefresh = crypto.createHash("sha256").update(refreshToken).digest("hex");
    user.refreshTokens.push(hashedRefresh);
    user.onboardingStep = "assessment"; // ✅ Move onboarding forward
    await user.save();

    setRefreshCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      accessToken,
      user: buildUserResponse(user), // ✅ Full user object
    });
  } catch (error) {
    next(error);
  }
}

// ─── Resend OTP ───────────────────────────────────────────────────────────────

export async function resendOTP(req, res, next) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: "Email already verified." });
    }

    await clearOTP(userId);
    const otp = await generateAndSaveOTP(userId);
    await sendOTPEmail(user.email, otp);

    res.status(200).json({ success: true, message: "New OTP sent to your email." });
  } catch (error) {
    next(error);
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email }).select("+password +refreshTokens");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isEmailVerified) {
      await clearOTP(user._id);
      const otp = await generateAndSaveOTP(user._id);
      await sendOTPEmail(user.email, otp);
      return res.status(403).json({
        success: false,
        message: "Email not verified. A new OTP has been sent.",
        userId: user._id,
      });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    const hashedRefresh = crypto.createHash("sha256").update(refreshToken).digest("hex");
    user.refreshTokens.push(hashedRefresh);
    user.lastLoginAt = new Date();
    await user.save();

    await logAudit({
      actorId: user._id,
      actorRole: user.role,
      action: "user_login",
      targetId: user._id,
      targetType: "user",
      after: { email, role: user.role, timestamp: new Date() },
      request: req,
    });

    setRefreshCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: "Login successful.",
      accessToken,
      user: buildUserResponse(user), // ✅ Full user object
    });
  } catch (error) {
    next(error);
  }
}

// ─── Refresh Access Token ─────────────────────────────────────────────────────

export async function refreshToken(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided.",
      });
    }

    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      _id: decoded.id,
      refreshTokens: hashedToken,
    }).select("+refreshTokens");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token.",
      });
    }

    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);
    const newHashedRefresh = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

    // ✅ Rotate — remove old, add new
    user.refreshTokens = user.refreshTokens.filter(t => t !== hashedToken);
    user.refreshTokens.push(newHashedRefresh);
    await user.save();

    setRefreshCookie(res, newRefreshToken);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        // ✅ Only remove this device's token
        await User.findByIdAndUpdate(decoded.id, {
          $pull: { refreshTokens: hashedToken },
        });
      } catch (err) {
        // Token already invalid — still clear cookie
      }
    }

    res.clearCookie("refreshToken");
    res.status(200).json({ success: true, message: "Logged out successfully." });
  } catch (error) {
    res.clearCookie("refreshToken");
    res.status(200).json({ success: true, message: "Logged out." });
  }
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If that email exists, a reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.passwordResetExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await sendPasswordResetEmail(email, resetToken);

    res.status(200).json({
      success: true,
      message: "If that email exists, a reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: new Date() }, // ✅ Fixed field name to match schema
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token.",
      });
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpiry = null;
    user.refreshTokens = []; // Force logout all devices
    await user.save();

    await logAudit({
      actorId: user._id,
      actorRole: user.role,
      action: "password_reset_confirmed",
      targetId: user._id,
      targetType: "user",
      after: { email: user.email, resetAt: new Date() },
      request: req,
    });

    res.clearCookie("refreshToken");
    res.status(200).json({
      success: true,
      message: "Password reset successful. Please log in.",
    });
  } catch (error) {
    next(error);
  }
}

// ─── Get Current User ─────────────────────────────────────────────────────────

export async function getMe(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      user: buildUserResponse(req.user), // ✅ Full user object
    });
  } catch (error) {
    next(error);
  }
}

// ─── Google OAuth Callback ────────────────────────────────────────────────────

export async function googleCallback(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select("+refreshTokens");

    const accessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    const hashedRefresh = crypto.createHash("sha256").update(newRefreshToken).digest("hex");
    user.refreshTokens.push(hashedRefresh); // ✅ Fixed — was using user.refreshToken
    user.lastLoginAt = new Date();
    await user.save();

    setRefreshCookie(res, newRefreshToken);

    const redirectURL = new URL(`${env.FRONTEND_URL}/auth/callback`);
    redirectURL.searchParams.set("token", accessToken);
    redirectURL.searchParams.set("isProfileComplete", user.isProfileComplete);
    redirectURL.searchParams.set("role", user.role);

    res.redirect(redirectURL.toString());
  } catch (error) {
    next(error);
  }
}