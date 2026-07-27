import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import MentorProfile from "../models/MentorProfile.js";
import MenteeProfileFlat from "../models/Mentee_Profiles.js";
import { env } from "../config/env.js";
import { generateAndSaveOTP, verifyOTP as verifyOtpCode, clearOTP } from "./otpService.js";
import { sendOTPEmail, sendPasswordResetEmail } from "./emailService.js";
import { logAudit } from "./auditLogService.js";
import { ApiError } from "../middleware/errorHandler.js";

// ─── Token / response helpers ─────────────────────────────────────────────────
const signAccess = (userId, role) =>
  jwt.sign({ id: userId, role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
const signRefresh = (userId) =>
  jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
const hashToken = (t) => crypto.createHash("sha256").update(t).digest("hex");

// Attach the user's role profile so the response carries role-specific data.
// Mentor: a real Mongoose ref, populated in place. Mentee: MenteeProfileFlat's
// _id is the Python interview's session_id (a string), so it can't be a ref —
// resolve it by userId instead and hang it on the user object for buildUserResponse.
async function populateProfiles(user) {
  if (user.role === "mentor") {
    await user.populate({ path: "mentorProfile" });
  } else if (user.role === "mentee") {
    user.menteeProfile = await MenteeProfileFlat.findOne({ userId: user._id }).lean();
  }
  return user;
}

// Public user shape: auth + shared identity + account state ONLY.
export function buildUserResponse(user) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    authProvider: user.authProvider,
    isEmailVerified: user.isEmailVerified,
    country: user.country,
    city: user.city,
    profilePic: user.profilePic,
    linkedinUrl: user.linkedinUrl,
    onboardingStep: user.onboardingStep,
    isProfileComplete: user.isProfileComplete,
    isActive: user.isActive,
    isBanned: user.isBanned,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    profileVisibility: user.profileVisibility,
    emailSessionRequests: user.emailSessionRequests,
    emailReminders: user.emailReminders,
    emailMarketing: user.emailMarketing,
    appearanceTheme: user.appearanceTheme,
    mentorProfile: user.mentorProfile,
    menteeProfile: user.menteeProfile,
  };
}

// Issue a rotated access+refresh pair and persist the hashed refresh token.
async function issueTokens(user) {
  const accessToken = signAccess(user._id, user.role);
  const refreshToken = signRefresh(user._id);
  user.refreshTokens.push(hashToken(refreshToken));
  return { accessToken, refreshToken };
}

// ─── Register ─────────────────────────────────────────────────────────────────
export async function register(data, req) {
  const { email, password, role, name, linkedinUrl, hourlyRate, cv } = data;

  if (!email || !password || !role) throw new ApiError(400, "Email, password, and role are required.");
  if (!["mentee", "mentor"].includes(role)) throw new ApiError(400, "Role must be mentee or mentor.");

  const existing = await User.findOne({ email });
  if (existing) {
    if (!existing.isEmailVerified) {
      await clearOTP(existing._id);
      const otp = await generateAndSaveOTP(existing._id);
      await sendOTPEmail(email, otp);
      return { userId: existing._id, message: "Account exists but email unverified. New OTP sent." };
    }
    throw new ApiError(409, "Email already registered.");
  }

  // User holds ONLY auth + shared identity; role data goes on the profile.
  // linkedinUrl is stored here too (in addition to MentorProfile for mentors)
  // since mentees have no profile yet at signup — see User.js's comment.
  const user = await User.create({
    email, password, role,
    ...(name && { name }),
    ...(linkedinUrl && { linkedinUrl }),
  });

  if (role === "mentor") {
    const mentorProfile = await MentorProfile.create({
      userId: user._id,
      ...(linkedinUrl && { linkedinUrl }),
      ...(hourlyRate != null && hourlyRate !== "" && {
        hourlyRate: Number(hourlyRate),
        pricePerSession: Number(hourlyRate),
      }),
      ...((cv?.url || cv?.parsedText) && {
        cv: {
          url: cv.url || null,
          filename: cv.filename || null,
          uploadedAt: new Date(),
          ...(cv.parsedText && { parsedText: cv.parsedText }),
        },
      }),
      status: "approved",
      isApproved: true,
      approvedAt: new Date(),
    });
    user.mentorProfile = mentorProfile._id;
  }
  // Mentees get no profile at signup — MenteeProfileFlat is created by the
  // Python interviewer (keyed by session_id) and linked to this user later via
  // POST /api/interview once the interview completes.
  await user.save();

  const otp = await generateAndSaveOTP(user._id);
  await sendOTPEmail(email, otp);

  await logAudit({
    actorId: user._id, actorRole: role, action: "user_registered",
    targetId: user._id, targetType: "user", after: { email, role, name }, request: req,
  });

  return { userId: user._id, message: "Registration initiated. Check your email for the OTP." };
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export async function verifyEmail({ userId, otp }, req) {
  if (!userId || !otp) throw new ApiError(400, "userId and otp are required.");

  const result = await verifyOtpCode(userId, otp);
  if (!result.success) throw new ApiError(400, result.message);

  const user = await User.findById(userId).select("+refreshTokens");
  if (!user) throw new ApiError(404, "User not found.");

  const { accessToken, refreshToken } = await issueTokens(user);
  user.onboardingStep = "assessment";
  await user.save();
  await populateProfiles(user);

  return { accessToken, refreshToken, user: buildUserResponse(user) };
}

// ─── Resend OTP ───────────────────────────────────────────────────────────────
export async function resendOTP({ userId }) {
  if (!userId) throw new ApiError(400, "userId is required.");
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found.");
  if (user.isEmailVerified) throw new ApiError(400, "Email already verified.");

  await clearOTP(userId);
  const otp = await generateAndSaveOTP(userId);
  await sendOTPEmail(user.email, otp);
  return { message: "New OTP sent to your email." };
}

// ─── Login ────────────────────────────────────────────────────────────────────
export async function login({ email, password }, req) {
  if (!email || !password) throw new ApiError(400, "Email and password are required.");

  const user = await User.findOne({ email }).select("+password +refreshTokens");
  if (!user || !(await user.comparePassword(password))) throw new ApiError(401, "Invalid email or password.");

  if (!user.isEmailVerified) {
    await clearOTP(user._id);
    const otp = await generateAndSaveOTP(user._id);
    await sendOTPEmail(user.email, otp);
    // 403 carries userId so the client can jump to the OTP screen.
    throw new ApiError(403, "Email not verified. A new OTP has been sent.", { userId: user._id });
  }

  const { accessToken, refreshToken } = await issueTokens(user);
  user.lastLoginAt = new Date();
  await user.save();
  await populateProfiles(user);

  await logAudit({
    actorId: user._id, actorRole: user.role, action: "user_login",
    targetId: user._id, targetType: "user", after: { email, timestamp: new Date() }, request: req,
  });

  return { accessToken, refreshToken, user: buildUserResponse(user) };
}

// ─── Rotate refresh token ─────────────────────────────────────────────────────
export async function rotateRefresh(oldToken) {
  if (!oldToken) throw new ApiError(401, "No refresh token provided.");

  const decoded = jwt.verify(oldToken, env.JWT_REFRESH_SECRET);
  const hashed = hashToken(oldToken);
  const user = await User.findOne({ _id: decoded.id, refreshTokens: hashed }).select("+refreshTokens");
  if (!user) throw new ApiError(401, "Invalid or expired refresh token.");

  user.refreshTokens = user.refreshTokens.filter((t) => t !== hashed); // rotate out
  const { accessToken, refreshToken } = await issueTokens(user);
  await user.save();
  return { accessToken, refreshToken };
}

// ─── Logout (revoke this device's refresh token) ──────────────────────────────
export async function logout(oldToken) {
  if (!oldToken) return;
  try {
    const decoded = jwt.verify(oldToken, env.JWT_REFRESH_SECRET);
    await User.findByIdAndUpdate(decoded.id, { $pull: { refreshTokens: hashToken(oldToken) } });
  } catch {
    // token already invalid — nothing to revoke
  }
}

// ─── Forgot / Reset password ──────────────────────────────────────────────────
export async function forgotPassword({ email }) {
  const user = await User.findOne({ email });
  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    await sendPasswordResetEmail(email, resetToken);
  }
  // Always the same message — don't reveal whether the email exists.
  return { message: "If that email exists, a reset link has been sent." };
}

export async function resetPassword({ token, newPassword }, req) {
  if (!token || !newPassword) throw new ApiError(400, "Token and new password are required.");

  const user = await User.findOne({
    passwordResetToken: hashToken(token),
    passwordResetExpiry: { $gt: new Date() },
  });
  if (!user) throw new ApiError(400, "Invalid or expired reset token.");

  user.password = newPassword;
  user.passwordResetToken = null;
  user.passwordResetExpiry = null;
  user.refreshTokens = []; // force logout everywhere
  await user.save();

  await logAudit({
    actorId: user._id, actorRole: user.role, action: "password_reset_confirmed",
    targetId: user._id, targetType: "user", after: { resetAt: new Date() }, request: req,
  });
  return { message: "Password reset successful. Please log in." };
}

// ─── Current user ─────────────────────────────────────────────────────────────
export async function getCurrentUser(user) {
  await populateProfiles(user);
  return buildUserResponse(user);
}

// ─── Google OAuth: issue tokens for an already-authenticated user ─────────────
export async function issueGoogleSession(userId) {
  const user = await User.findById(userId).select("+refreshTokens");
  if (!user) throw new ApiError(404, "User not found.");
  const { accessToken, refreshToken } = await issueTokens(user);
  user.lastLoginAt = new Date();
  await user.save();
  return { accessToken, refreshToken, user };
}
