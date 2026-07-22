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

    // ── Identity / headline ─────────────────────────────────────────
    bio:         { type: String, maxlength: 500, default: null },
    headline:    { type: String, maxlength: 120, default: null },
    title:       { type: String, default: null },
    company:     { type: String, default: null },
    industry:    { type: String, default: null },
    linkedinUrl: { type: String, default: null },

    // ── Skills & Domains ─────────────────────────────────────────────
    skills:              { type: [String], default: [] }, // tech skills
    domains:             { type: [String], default: [] }, // domain skills
    industries:          { type: [String], default: [] },
    domainTag:           { type: String,   default: null },
    softSkills:          { type: [String], default: [] },
    languages:           { type: [String], default: [] },
    certifications:      { type: [String], default: [] },
    preferredCategories: { type: [String], default: [] },

    // ── Availability & pricing ───────────────────────────────────────
    hourlyRate:     { type: Number, default: null },
    experience:     { type: Number, default: null }, // total years, summed from workExperience
    availableSlots: { type: [String], default: [] },
    weeklySchedule: { type: String, default: null },

    // ── CV / Resume ───────────────────────────────────────────────────
    cv: {
      url:        { type: String, default: null },
      filename:   { type: String, default: null },
      uploadedAt: { type: Date,   default: null },
      parsedText: { type: String, default: null },
    },

    // ── LinkedIn scrape state ───────────────────────────────────────
    linkedinScrape: {
      status:      { type: String, enum: ["pending", "done", "failed", null], default: null },
      lastAttempt: { type: Date,   default: null },
      error:       { type: String, default: null },
    },

    // ── Career History ───────────────────────────────────────────────
    workExperience: { type: [workExperienceSchema], default: [] },

    currentCompany: {
      name:       { type: String, default: null },
      role:       { type: String, default: null },
      yearsOfExp: { type: Number, default: 0 },
    },

    education: { type: [educationSchema], default: [] },

    // ── Mentorship Config ─────────────────────────────────────────────
    pricePerSession:   { type: Number, min: 0, default: null },
    currency:          { type: String, enum: ["PKR", "USD"], default: "PKR" },
    sessionDuration:   { type: Number, enum: [30, 60, 90], default: 60 },
    mentorshipTypes: {
      type: [String],
      enum: ["mock_interview", "resume_review", "career_counseling", "technical", "workshop"],
      default: [],
    },
    maxMenteesPerWeek: { type: Number, default: 10 },
    isTakingMentees:   { type: Boolean, default: true },

    // ── Ratings ────────────────────────────────────────────────────────
    averageRating:    { type: Number, default: 0, min: 0, max: 5 },
    totalReviews:     { type: Number, default: 0 },
    ratingBreakdown:  { type: ratingBreakdownSchema, default: () => ({}) },
    totalSessions:    { type: Number, default: 0 },

    // ── Platform State ────────────────────────────────────────────────
    status:          { type: String, enum: ["pending", "approved", "rejected"], default: "approved" },
    rejectionReason: { type: String, default: null },
    isApproved:      { type: Boolean, default: true },
    approvedAt:      { type: Date,    default: null },
    approvedBy:      { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// Indexes
mentorProfileSchema.index({ skills: 1 });
mentorProfileSchema.index({ domains: 1 });
mentorProfileSchema.index({ industries: 1 });
mentorProfileSchema.index({ domainTag: 1 });
mentorProfileSchema.index({ pricePerSession: 1 });
mentorProfileSchema.index({ averageRating: -1, totalReviews: -1 });
mentorProfileSchema.index({ isApproved: 1, isActive: 1 });
mentorProfileSchema.index({ "currentCompany.name": 1 });

export default mongoose.models.MentorProfile ||
  mongoose.model("MentorProfile", mentorProfileSchema);