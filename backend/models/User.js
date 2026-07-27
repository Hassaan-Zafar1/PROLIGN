import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * User = authentication + security + shared identity + account state ONLY.
 *
 * All mentor domain data lives on MentorProfile, all mentee domain data on
 * MenteeProfileFlat (the "Mentee_Profiles" collection, 1:1 via userId — see
 * that model for why it's not a Mongoose ref). Never store role-specific
 * onboarding data here.
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
    name:        { type: String, trim: true, minlength: 2, maxlength: 60, default: null },
    country:     { type: String, default: null },
    city:        { type: String, default: null },
    profilePic:  { type: String, default: null },
    // Captured at signup (optional, both roles). Mentors also keep a copy on
    // MentorProfile.linkedinUrl (their profile exists from signup); mentees
    // have no profile until the interview links one, so this is the durable
    // home for it until interviewService.submitInterview copies it onto
    // MenteeProfileFlat as a fallback.
    linkedinUrl: { type: String, default: null },

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
    // Mentor: 1:1 ref (MentorProfile._id is an ObjectId, safe to ref directly).
    // Mentee: NOT a ref — MenteeProfileFlat._id is the Python interview's
    // session_id (a string), so the mentee profile is always resolved by
    // MenteeProfileFlat.findOne({ userId }) instead of a stored ref.
    mentorProfile: { type: mongoose.Schema.Types.ObjectId, ref: "MentorProfile", default: null },

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
