const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      enum: ["mentor", "mentee", "admin"],
      required: true,
    },

    // ── Email OTP Verification ──────────────────────────────────────
    isEmailVerified: { type: Boolean, default: false },
    otp: {
      code:      { type: String, select: false }, // stored as SHA-256 hash
      expiresAt: { type: Date },
      attempts:  { type: Number, default: 0 },   // lock after 3
    },

    // ── Profile Basics ──────────────────────────────────────────────
    profilePic:  { type: String, default: null }, // Cloudinary / S3 URL
    linkedinUrl: { type: String, default: null },

    // ── CV / Resume ─────────────────────────────────────────────────
    cv: {
      url:        { type: String, default: null }, // S3/Cloudinary URL
      filename:   { type: String, default: null },
      uploadedAt: { type: Date,   default: null },
      parsedText: { type: String, default: null }, // extracted for AI
    },

    // ── LinkedIn Scrape State (mentor only) ─────────────────────────
    linkedinScrape: {
      status:      { type: String, enum: ["pending", "done", "failed"], default: null },
      lastAttempt: { type: Date,   default: null },
      error:       { type: String, default: null },
    },

    // ── Onboarding ──────────────────────────────────────────────────
    onboardingStep: {
      type: String,
      enum: ["signup", "otp", "assessment", "complete"],
      default: "signup",
    },

    // ── Account State ────────────────────────────────────────────────
    isActive:   { type: Boolean, default: true },
    isBanned:   { type: Boolean, default: false },
    banReason:  { type: String,  default: null },
    lastLoginAt:{ type: Date,    default: null },

    // ── Auth Tokens ──────────────────────────────────────────────────
    refreshTokens:       { type: [String], default: [], select: false },
    passwordResetToken:  { type: String,   default: null, select: false },
    passwordResetExpiry: { type: Date,     default: null },
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ linkedinUrl: 1 }, { sparse: true });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
