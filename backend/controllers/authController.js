import jwt from "jsonwebtoken";
import crypto from "crypto";
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
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// ─── Step 1: Register (email + password + role) ───────────────────────────────

export async function register(req, res, next) {
  try {
    console.log("📩 Register hit with body:", req.body);
    const { email, password, role, name, linkedinUrl, hourlyRate } = req.body;

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

    // Check if already registered
    const existing = await User.findOne({ email });
    if (existing) {
      // If registered but not verified, resend OTP
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
        ...(hourlyRate && { hourlyRate }),  // only if hourlyRate exists in your User schema
    });
    const otp = await generateAndSaveOTP(user._id);
    await sendOTPEmail(email, otp);

    await logAudit({
      actorId: user._id,
      actorRole: role,
      action: "user_registered",
      targetId: user._id,
      targetType: "user",
      after: { email, role },
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

// ─── Step 2: Verify OTP ───────────────────────────────────────────────────────

export async function verifyEmail(req, res, next) {
  try {
    console.log("📩 Verify OTP hit with body:", req.body); // ← temp debug

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

    // ✅ Push to array instead of setting single field
    const hashedRefresh = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    user.refreshTokens.push(hashedRefresh);
    await user.save();

    setRefreshCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isProfileComplete: user.isProfileComplete,
      },
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
      await logAudit({
        actorId: new mongoose.Types.ObjectId(), // System or null
        actorRole: "system",
        action: "user_login",
        targetId: null,
        targetType: "none",
        before: { email, success: false },
        request: req,
      });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isEmailVerified) {
      // Resend OTP so they can verify
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

    // ✅ Correct — matches your schema
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
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isProfileComplete: user.isProfileComplete,
      },
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
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

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

    // Rotate refresh token
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = crypto
      .createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");
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
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET).id;
      await User.findByIdAndUpdate(decoded, { $pull: { refreshTokens: hashedToken } });
    }

    res.clearCookie("refreshToken");
    res.status(200).json({ success: true, message: "Logged out successfully." });
  } catch (error) {
    // Even if token is invalid, clear the cookie
    res.clearCookie("refreshToken");
    res.status(200).json({ success: true, message: "Logged out." });
  }
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If that email exists, a reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min
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

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token.",
      });
    }

    user.password = newPassword; // Pre-save hook will hash it
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    user.refreshTokens = []; // Force re-login after reset
    await user.save();

    res.clearCookie("refreshToken");
    res.status(200).json({
      success: true,
      message: "Password reset successful. Please log in.",
    });
    // After password is successfully reset:
await logAudit({
  actorId: user._id,
  actorRole: user.role,
  action: "password_reset_confirmed",
  targetId: user._id,
  targetType: "user",
  after: { email: user.email, resetAt: new Date() },
  request: req,
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
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
}

// ─── Google OAuth Callback ────────────────────────────────────────────────────

export async function googleCallback(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select("+refreshTokens"); // Attached by Passport

    const accessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = crypto
      .createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");
    user.lastLoginAt = new Date();
    await user.save();

    setRefreshCookie(res, newRefreshToken);

    // Redirect to frontend with access token in query param
    // Frontend reads this once, stores it in memory, removes from URL
    const redirectURL = new URL(`${env.FRONTEND_URL}/auth/callback`);
    redirectURL.searchParams.set("token", accessToken);
    redirectURL.searchParams.set("isProfileComplete", user.isProfileComplete);
    redirectURL.searchParams.set("role", user.role);

    res.redirect(redirectURL.toString());
  } catch (error) {
    next(error);
  }
}