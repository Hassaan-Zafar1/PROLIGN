import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 60,
      default: null,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["mentor", "mentee", "admin"],
      required: true,
    },

    // ── Google OAuth ─────────────────────────────────────────────────
    googleId: { type: String, default: null, sparse: true },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // ── Email OTP Verification ───────────────────────────────────────
    isEmailVerified: { type: Boolean, default: false },
    otp: {
      code:      { type: String, select: false },
      expiresAt: { type: Date },
      attempts:  { type: Number, default: 0 },
    },

    // ── Profile Basics ───────────────────────────────────────────────
    profilePic:  { type: String, default: null },
    linkedinUrl: { type: String, default: null },

    // ── CV / Resume ──────────────────────────────────────────────────
    cv: {
      url:        { type: String, default: null },
      filename:   { type: String, default: null },
      uploadedAt: { type: Date,   default: null },
      parsedText: { type: String, default: null },
    },

    // ── LinkedIn Scrape State ────────────────────────────────────────
    linkedinScrape: {
      status:      { type: String, enum: ["pending", "done", "failed"], default: null },
      lastAttempt: { type: Date,   default: null },
      error:       { type: String, default: null },
    },

    // ── Onboarding ───────────────────────────────────────────────────
    onboardingStep: {
      type: String,
      enum: ["signup", "otp", "assessment", "complete"],
      default: "signup",
    },

    // ── Profile Refs ─────────────────────────────────────────────────
    menteeProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenteeProfile",
      default: null,
    },
    mentorProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MentorProfile",
      default: null,
    },

    // ── Account State ─────────────────────────────────────────────────
    isActive:    { type: Boolean, default: true },
    isBanned:    { type: Boolean, default: false },
    banReason:   { type: String,  default: null },
    lastLoginAt: { type: Date,    default: null },

    // ── Auth Tokens ───────────────────────────────────────────────────
    // Array supports multi-device login (each device gets its own refresh token)
    refreshTokens:       { type: [String], default: [], select: false },
    passwordResetToken:  { type: String,   default: null, select: false },
    passwordResetExpiry: { type: Date,     default: null },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ linkedinUrl: 1 }, { sparse: true });
userSchema.index({ googleId: 1 }, { sparse: true });

// ── Pre-save: Hash password ───────────────────────────────────────────────────
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// ── Instance Methods ──────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isOTPValid = function (code) {
  return (
    this.otp?.code === code &&
    this.otp?.expiresAt > new Date() &&
    this.otp?.attempts < 3
  );
};

export default mongoose.models.User || mongoose.model("User", userSchema);