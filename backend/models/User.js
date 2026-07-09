import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * User = authentication + security + shared identity + account state ONLY.
 *
 * All mentor domain data lives on MentorProfile, all mentee domain data on
 * MenteeProfile (1:1 via userId). Never store role-specific onboarding data here.
 */
const userSchema = new mongoose.Schema(
  {
    // ── Authentication ──────────────────────────────────────────────────────────
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
    googleId: { type: String, default: null, sparse: true },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    refreshTokens: { type: [String], default: [], select: false },

    // ── Security ────────────────────────────────────────────────────────────────
    isEmailVerified: { type: Boolean, default: false },
    otp: {
      code:      { type: String, select: false },
      expiresAt: { type: Date },
      attempts:  { type: Number, default: 0 },
    },
    passwordResetToken:  { type: String, default: null, select: false },
    passwordResetExpiry: { type: Date,   default: null },

    // ── Shared User Data ──────────────────────────────────────────────────────────
    name:       { type: String, trim: true, minlength: 2, maxlength: 60, default: null },
    country:    { type: String, default: null },
    city:       { type: String, default: null },
    profilePic: { type: String, default: null },

    // ── Preferences (account-level, role-agnostic) ────────────────────────────────
    profileVisibility: {
      type: String,
      enum: ["public", "members", "private"],
      default: "public",
    },
    emailSessionRequests: { type: Boolean, default: true },
    emailReminders:       { type: Boolean, default: true },
    emailMarketing:       { type: Boolean, default: false },
    appearanceTheme: {
      type: String,
      enum: ["System", "Light", "Dark"],
      default: "System",
    },

    // ── Onboarding State ──────────────────────────────────────────────────────────
    onboardingStep: {
      type: String,
      enum: ["signup", "otp", "assessment", "complete"],
      default: "signup",
    },
    isProfileComplete: { type: Boolean, default: false },

    // ── Profile References (role-specific data lives here) ────────────────────────
    mentorProfile: { type: mongoose.Schema.Types.ObjectId, ref: "MentorProfile", default: null },
    menteeProfile: { type: mongoose.Schema.Types.ObjectId, ref: "MenteeProfile", default: null },

    // ── Account State ─────────────────────────────────────────────────────────────
    isActive:    { type: Boolean, default: true },
    isBanned:    { type: Boolean, default: false },
    banReason:   { type: String,  default: null },
    lastLoginAt: { type: Date,    default: null },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ role: 1, isActive: 1 });

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
