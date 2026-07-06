import express from "express";
import rateLimit from "express-rate-limit";
import passport from "passport";
import "../config/passport.js";
import { env } from "../config/env.js";
import { googleCallback } from "../controllers/authController.js";
import {
  register,
  verifyEmail,
  resendOTP,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Strict rate limiter for sensitive auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: "Too many attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Public Routes ─────────────────────────────────────────────────────────────
router.post("/register", authLimiter, register);
router.post("/verify-otp", authLimiter, verifyEmail);
router.post("/resend-otp", authLimiter, resendOTP);
router.post("/login", authLimiter, login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

// ─── Protected Routes ──────────────────────────────────────────────────────────
router.get("/me", protect, getMe);
// ─── Google OAuth Routes ───────────────────────────────────────────────────────

// Step 1: Redirect user to Google login page
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Step 2: Google redirects back here after login
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${env.FRONTEND_URL}/login?error=google_failed`,
  }),
  googleCallback
);

export default router;