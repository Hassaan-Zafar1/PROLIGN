import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.warn("⚠️  Email service not connected:", error.message);
  } else {
    console.log("✅ Email service ready");
  }
});

/**
 * Sends an OTP verification email.
 */
export async function sendOTPEmail(toEmail, otp) {
  await transporter.sendMail({
    from: `"MentorMentee" <${env.EMAIL_FROM}>`,
    to: toEmail,
    subject: "Verify your email — MentorMentee",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #2d6a4f;">Verify your email</h2>
        <p>Use the OTP below to complete your registration. It expires in <strong>${env.OTP_EXPIRY_MINUTES} minutes</strong>.</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1b4332; margin: 24px 0;">
          ${otp}
        </div>
        <p style="color: #777; font-size: 13px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}

/**
 * Sends a password reset email.
 */
export async function sendPasswordResetEmail(toEmail, resetToken) {
  const resetURL = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from: `"MentorMentee" <${env.EMAIL_FROM}>`,
    to: toEmail,
    subject: "Password reset request — MentorMentee",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #2d6a4f;">Reset your password</h2>
        <p>Click the button below to reset your password. This link expires in <strong>15 minutes</strong>.</p>
        <a href="${resetURL}" style="display:inline-block; padding: 12px 24px; background:#2d6a4f; color:#fff; border-radius:6px; text-decoration:none; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #777; font-size: 13px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}