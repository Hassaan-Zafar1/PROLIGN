import mongoose from "mongoose";
const { Schema } = mongoose;

const workExperienceSchema = new Schema(
  {
    companyName: { type: String },
    role:        { type: String },
    startDate:   { type: Date },
    endDate:     { type: Date, default: null }, // null = current
    isCurrent:   { type: Boolean, default: false },
    description: { type: String, default: null },
  },
  { _id: false }
);

const educationSchema = new Schema(
  {
    institution: { type: String },
    degree:      { type: String },
    field:       { type: String },
    year:        { type: Number },
  },
  { _id: false }
);

const ratingBreakdownSchema = new Schema(
  {
    five:  { type: Number, default: 0 },
    four:  { type: Number, default: 0 },
    three: { type: Number, default: 0 },
    two:   { type: Number, default: 0 },
    one:   { type: Number, default: 0 },
  },
  { _id: false }
);

const mentorProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // ── Identity / headline (moved from User — mentor domain data) ─
    bio:         { type: String, maxlength: 500, default: null },
    headline:    { type: String, maxlength: 120, default: null }, // "Senior SWE at Google | 8 YOE"
    title:       { type: String, default: null },  // professional title
    company:     { type: String, default: null },  // current company (denormalized string)
    industry:    { type: String, default: null },  // primary industry (single)
    linkedinUrl: { type: String, default: null },

    // ── Skills & Domains ───────────────────────────────────────────
    // NOTE for the AI pipeline: `skills` IS "tech_skills", `domains` IS
    // "domain_skills". No separate tech_skills/domain_skills fields are added
    // (same intent — reused). `softSkills` and `domainTag` are genuinely new.
    skills:              { type: [String], default: [] }, // tech_skills — ["Java", "Kubernetes"]
    domains:             { type: [String], default: [] }, // domain_skills — ["Agile/Scrum"]
    industries:          { type: [String], default: [] }, // ["Finance", "HealthTech"]
    domainTag:           { type: String,   default: null }, // vertical tag, e.g. "hrtech"
    softSkills:          { type: [String], default: [] },   // ["Negotiation", "Strategic Thinking"]
    languages:           { type: [String], default: [] },   // spoken languages
    certifications:      { type: [String], default: [] },
    preferredCategories: { type: [String], default: [] },   // mentorship categories

    // ── Availability & pricing (moved from User) ───────────────────
    hourlyRate:     { type: Number, default: null },
    experience:     { type: Number, default: null }, // years
    availableSlots: { type: [String], default: [] },
    weeklySchedule: { type: String, default: null },

    // ── CV / Resume (moved from User — mentor onboarding data) ─────
    cv: {
      url:        { type: String, default: null },
      filename:   { type: String, default: null },
      uploadedAt: { type: Date,   default: null },
      parsedText: { type: String, default: null },
    },

    // ── LinkedIn scrape state (moved from User) ────────────────────
    linkedinScrape: {
      status:      { type: String, enum: ["pending", "done", "failed", null], default: null },
      lastAttempt: { type: Date,   default: null },
      error:       { type: String, default: null },
    },

    // ── Career History (scraped from LinkedIn) ─────────────────────
    workExperience: { type: [workExperienceSchema], default: [] },

    // ── Current Company (denormalized for fast card rendering) ──────
    currentCompany: {
      name:       { type: String, default: null },
      role:       { type: String, default: null },
      yearsOfExp: { type: Number, default: 0 },
    },

    // ── Education ──────────────────────────────────────────────────
    education: { type: [educationSchema], default: [] },

    // ── Mentorship Config ──────────────────────────────────────────
    pricePerSession:   { type: Number, min: 0, default: null }, // optional; falls back to hourlyRate
    currency:          { type: String, enum: ["PKR", "USD"], default: "PKR" },
    sessionDuration:   { type: Number, enum: [30, 60, 90], default: 60 }, // minutes
    mentorshipTypes: {
      type: [String],
      enum: ["mock_interview", "resume_review", "career_counseling", "technical", "workshop"],
      default: [],
    },
    maxMenteesPerWeek: { type: Number, default: 10 },
    isTakingMentees:   { type: Boolean, default: true },

    // ── Ratings (denormalized — updated incrementally after each review) ─
    // DO NOT recompute via aggregation on every request
    averageRating:    { type: Number, default: 0, min: 0, max: 5 },
    totalReviews:     { type: Number, default: 0 },
    ratingBreakdown:  { type: ratingBreakdownSchema, default: () => ({}) },
    totalSessions:    { type: Number, default: 0 },

    // ── Platform State ─────────────────────────────────────────────
    // Mentors are auto-approved (no admin gate); status/rejectionReason remain
    // for optional post-hoc moderation. Moved off User (mentor domain data).
    status:         { type: String, enum: ["pending", "approved", "rejected"], default: "approved" },
    rejectionReason:{ type: String, default: null },
    isApproved:     { type: Boolean, default: true },
    approvedAt:     { type: Date,    default: null },
    approvedBy:     { type: Schema.Types.ObjectId, ref: "User", default: null },

    // ── AI Matching — normalized text, written by the offline Python EDA job ──
    // The CV-scraped raw fields above are the INPUT; these are the cleaned
    // OUTPUT the future matching model reads. Mapping (raw → cleaned):
    //   currentCompany.role → currentRole | industries → industry |
    //   domainTag → domainTag | bio → bio | skills → techSkills |
    //   domains → domainSkills | softSkills → softSkills
    // Values are space-joined, lowercased tokens (e.g. "java kubernetes docker").
    cleaned: {
      currentRole:  { type: String, default: null },
      industry:     { type: String, default: null },
      domainTag:    { type: String, default: null },
      bio:          { type: String, default: null },
      techSkills:   { type: String, default: null },
      domainSkills: { type: String, default: null },
      softSkills:   { type: String, default: null },
      cleanedAt:    { type: Date,   default: null }, // when the pipeline last ran
    },
  },
  { timestamps: true }
);

// Indexes
mentorProfileSchema.index({ skills: 1 });               // multikey — IR matching
mentorProfileSchema.index({ domains: 1 });              // multikey
mentorProfileSchema.index({ industries: 1 });           // multikey
mentorProfileSchema.index({ domainTag: 1 });            // vertical filter for matching
mentorProfileSchema.index({ pricePerSession: 1 });
mentorProfileSchema.index({ averageRating: -1, totalReviews: -1 });
mentorProfileSchema.index({ isApproved: 1, isActive: 1 });
mentorProfileSchema.index({ "currentCompany.name": 1 });

export default mongoose.models.MentorProfile ||
  mongoose.model("MentorProfile", mentorProfileSchema);
