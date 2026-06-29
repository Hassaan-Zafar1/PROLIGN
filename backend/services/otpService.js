import crypto from "crypto";
import User from "../models/User.js";
import { env } from "../config/env.js";

export async function generateAndSaveOTP(userId) {
  const plainOTP = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOTP = crypto.createHash("sha256").update(plainOTP).digest("hex");

  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

  // ✅ Use dot notation for nested fields — avoids overwriting the whole otp object
  await User.findByIdAndUpdate(userId, {
    "otp.code": hashedOTP,
    "otp.expiresAt": expiresAt,
    "otp.attempts": 0,
  });

  return plainOTP;
}

export async function verifyOTP(userId, plainOTP) {
  // ✅ Select each nested field explicitly — "+otp" doesn't work for nested select:false
  const user = await User.findById(userId).select("+otp.code +otp.expiresAt +otp.attempts");

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

  const hashedInput = crypto.createHash("sha256").update(plainOTP).digest("hex");

  if (hashedInput !== user.otp.code) {
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
    "otp.code": null,
    "otp.expiresAt": null,
    "otp.attempts": 0,
  });

  return { success: true };
}

export async function clearOTP(userId) {
  await User.findByIdAndUpdate(userId, {
    "otp.code": null,
    "otp.expiresAt": null,
    "otp.attempts": 0,
  });
}