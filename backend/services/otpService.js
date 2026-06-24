import crypto from "crypto";
import User from "../models/User.js";
import { env } from "../config/env.js";

/**
 * Generates a 6-digit OTP, hashes it, and saves it to the user document.
 * Returns the plain OTP (to be emailed — never stored plain).
 */
export async function generateAndSaveOTP(userId) {
  const plainOTP = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOTP = crypto.createHash("sha256").update(plainOTP).digest("hex");

  const expiresAt = new Date(
    Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000
  );

  await User.findByIdAndUpdate(userId, {
    otp: {
      code: hashedOTP,
      expiresAt,
      attempts: 0,
    },
  });

  return plainOTP;
}

/**
 * Verifies an OTP for a given user.
 * Increments attempt count on failure.
 * Clears OTP on success.
 */
export async function verifyOTP(userId, plainOTP) {
  const user = await User.findById(userId).select("+otp");

  if (!user) {
    return { success: false, message: "User not found" };
  }

  if (!user.otp?.code) {
    return { success: false, message: "No OTP requested. Please register first." };
  }

  if (user.otp.expiresAt < new Date()) {
    return { success: false, message: "OTP has expired. Please request a new one." };
  }

  if (user.otp.attempts >= env.OTP_MAX_ATTEMPTS) {
    return { success: false, message: "Too many attempts. Please request a new OTP." };
  }

  const hashedInput = crypto
    .createHash("sha256")
    .update(plainOTP)
    .digest("hex");

  if (hashedInput !== user.otp.code) {
    // Increment attempt count
    await User.findByIdAndUpdate(userId, {
      $inc: { "otp.attempts": 1 },
    });
    const remaining = env.OTP_MAX_ATTEMPTS - (user.otp.attempts + 1);
    return {
      success: false,
      message: `Invalid OTP. ${remaining} attempt(s) remaining.`,
    };
  }

  // ✅ OTP matched — clear it and mark email verified
  await User.findByIdAndUpdate(userId, {
    isEmailVerified: true,
    otp: { code: null, expiresAt: null, attempts: 0 },
  });

  return { success: true };
}

/**
 * Clears OTP from user (e.g. on resend).
 */
export async function clearOTP(userId) {
  await User.findByIdAndUpdate(userId, {
    otp: { code: null, expiresAt: null, attempts: 0 },
  });
}