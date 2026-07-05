import mongoose from "mongoose";
const { Schema } = mongoose;

const selfRatedSkillSchema = new Schema(
  {
    skill: { type: String },
    level: { type: String, enum: ["beginner", "intermediate", "advanced"] },
  },
  { _id: false }
);

const onboardingAnswersSchema = new Schema(
  {
    currentRole:     { type: String, default: null }, // "Student" | "Junior Dev"
    yearsOfExp:      { type: Number, default: 0 },
    targetRole:      { type: String, default: null }, // "Backend Engineer"
    targetIndustry:  { type: [String], default: [] },
    selfRatedSkills: { type: [selfRatedSkillSchema], default: [] },
    urgency: {
      type: String,
      enum: ["actively_applying", "exploring", "6_months", "1_year"],
      default: null,
    },
    preferredMentorStyle: {
      type: String,
      enum: ["structured", "casual", "no_preference"],
      default: "no_preference",
    },
  },
  { _id: false }
);

const skillProfileSchema = new Schema(
  {
    generatedAt:     { type: Date, default: null },
    assessmentId:    { type: Schema.Types.ObjectId, ref: "AiAssessment", default: null },

    // Flat arrays — indexed for $in / $all queries by matching engine
    skills:       { type: [String], default: [] },
    domains:      { type: [String], default: [] },
    careerGoals:  { type: [String], default: [] },
    industries:   { type: [String], default: [] },

    // Scored attributes (0.0 – 1.0)
    technicalScore:  { type: Number, default: 0, min: 0, max: 1 },
    softSkillScore:  { type: Number, default: 0, min: 0, max: 1 },
    experienceLevel: {
      type: String,
      enum: ["beginner", "junior", "mid", "senior"],
      default: "beginner",
    },

    strengths:     { type: [String], default: [] },
    weaknesses:    { type: [String], default: [] },
    readinessScore:{ type: Number, default: 0, min: 0, max: 100 }, // placement readiness
    aiSummary:     { type: String, default: null },
  },
  { _id: false }
);

const matchHistorySchema = new Schema(
  {
    generatedAt: { type: Date },
    mentorIds:   { type: [Schema.Types.ObjectId], ref: "User" },
    scores:      { type: [Number] },
  },
  { _id: false }
);

const menteeProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // ── Basic Info ─────────────────────────────────────────────────
    bio:            { type: String, maxlength: 300, default: null },
    university:     { type: String, default: null },
    degree:         { type: String, default: null },
    graduationYear: { type: Number, default: null },
    city:           { type: String, default: null },
    country:        { type: String, default: null },

    // ── Quick form answers before AI interview ──────────────────────
    onboardingAnswers: { type: onboardingAnswersSchema, default: () => ({}) },

    // ── AI-Generated Skill Profile (core of matching engine) ────────
    skillProfile: { type: skillProfileSchema, default: () => ({}) },

    // ── Mentor Match Cache (last 3 runs, newest last) ───────────────
    matchHistory: { type: [matchHistorySchema], default: [] },

    // ── Session Preferences ────────────────────────────────────────
    preferredSessionType: {
      type: [String],
      enum: ["mock_interview", "resume_review", "career_counseling", "technical", "workshop"],
      default: [],
    },
    preferredLanguage: { type: String, enum: ["English", "Urdu"], default: "English" },
    budgetPerSession:  { type: Number, default: null }, // max PKR willing to pay

    totalSessionsCompleted: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes
menteeProfileSchema.index({ "skillProfile.skills": 1 });    // multikey
menteeProfileSchema.index({ "skillProfile.domains": 1 });   // multikey
menteeProfileSchema.index({ "skillProfile.careerGoals": 1 });

export default mongoose.models.MenteeProfile ||
  mongoose.model("MenteeProfile", menteeProfileSchema);
