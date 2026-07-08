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
    currentRole:       { type: String, default: null }, // "Student" | "Junior Dev"
    yearsOfExp:        { type: Number, default: 0 },     // maps to mentee_experience_years
    experienceLevel:   { type: String, default: null },  // raw self-reported label, e.g. "Entry level (0–2 yrs)"
    targetRole:        { type: String, default: null },  // raw target answer (role + company/industry)
    targetIndustry:    { type: [String], default: [] },
    targetCompanyTier: { type: String, default: null },  // "Mid-market tech" | "FAANG" | ...
    selfRatedSkills:   { type: [selfRatedSkillSchema], default: [] },

    // ── Raw interview answers (Task 7) — stored verbatim for the Python EDA job ──
    notableProject:    { type: String, default: null },  // "Tell us about a notable project…"
    problemSolving:    { type: String, default: null },  // leadership / problem-solving example
    experience:        { type: String, default: null },  // internships / work / certifications
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

    // ── Domain interest & soft skills (mentee feature set) ─────────
    // NOTE for the AI pipeline: tech_skills IS skillProfile.skills,
    // domain_skills IS skillProfile.domains (same intent — reused).
    domainInterest: { type: String,   default: null }, // vertical tag, e.g. "martech"
    softSkills:     { type: [String], default: [] },   // ["Executive Presence", "Communication"]

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

    // ── AI Matching — normalized text, written by the offline Python EDA job ──
    // Interview answers above are the INPUT; these are the cleaned OUTPUT the
    // future matching model reads. Mapping (raw → cleaned):
    //   onboardingAnswers.targetRole     → targetRole
    //   onboardingAnswers.targetIndustry → targetIndustry
    //   domainInterest                   → domainInterest
    //   bio                              → bio
    //   skillProfile.skills              → techSkills
    //   skillProfile.domains             → domainSkills
    //   softSkills                       → softSkills
    // Values are space-joined, lowercased tokens.
    cleaned: {
      targetRole:     { type: String, default: null },
      targetIndustry: { type: String, default: null },
      domainInterest: { type: String, default: null },
      bio:            { type: String, default: null },
      techSkills:     { type: String, default: null },
      domainSkills:   { type: String, default: null },
      softSkills:     { type: String, default: null },
      cleanedAt:      { type: Date,   default: null }, // when the pipeline last ran
    },
  },
  { timestamps: true }
);

// Indexes
menteeProfileSchema.index({ "skillProfile.skills": 1 });    // multikey
menteeProfileSchema.index({ "skillProfile.domains": 1 });   // multikey
menteeProfileSchema.index({ "skillProfile.careerGoals": 1 });
menteeProfileSchema.index({ domainInterest: 1 });           // vertical filter for matching

export default mongoose.models.MenteeProfile ||
  mongoose.model("MenteeProfile", menteeProfileSchema);
