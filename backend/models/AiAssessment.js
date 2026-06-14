const mongoose = require("mongoose");
const { Schema } = mongoose;

const conversationTurnSchema = new Schema(
  {
    role:    { type: String, enum: ["system", "assistant", "user"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    // Voice mode only
    audioUrl:              { type: String, default: null }, // S3 URL
    transcriptConfidence:  { type: Number, default: null }, // 0.0 – 1.0
  },
  { _id: false }
);

const generatedProfileSchema = new Schema(
  {
    skills:          { type: [String], default: [] },
    domains:         { type: [String], default: [] },
    careerGoals:     { type: [String], default: [] },
    industries:      { type: [String], default: [] },
    technicalScore:  { type: Number, default: 0 },
    softSkillScore:  { type: Number, default: 0 },
    experienceLevel: {
      type: String,
      enum: ["beginner", "junior", "mid", "senior"],
      default: "beginner",
    },
    strengths:      { type: [String], default: [] },
    weaknesses:     { type: [String], default: [] },
    readinessScore: { type: Number, default: 0 },
    aiSummary:      { type: String, default: null },
    modelVersion:   { type: String, default: null }, // "gpt-4o-2024-08"
    promptVersion:  { type: String, default: null }, // "v1.2"
    generatedAt:    { type: Date, default: null },
  },
  { _id: false }
);

const aiAssessmentSchema = new Schema(
  {
    menteeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Interview Metadata ─────────────────────────────────────────
    mode: {
      type: String,
      enum: ["text", "voice"],
      required: true,
    },
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned"],
      default: "in_progress",
    },
    startedAt:       { type: Date, default: Date.now },
    completedAt:     { type: Date, default: null },
    durationSeconds: { type: Number, default: null },

    // ── Full Conversation History ───────────────────────────────────
    // NOTE: At scale (10k+ users), consider archiving to S3 after 30 days
    // and storing only the S3 URL here. Keep generatedProfile permanently.
    conversation: { type: [conversationTurnSchema], default: [] },

    // ── AI-Generated Skill Report ──────────────────────────────────
    // Mirrored to mentee_profiles.skillProfile after generation
    generatedProfile: { type: generatedProfileSchema, default: () => ({}) },

    // ── Quality / Admin ────────────────────────────────────────────
    wasReviewed: { type: Boolean, default: false },
    reviewNotes: { type: String,  default: null },
  },
  { timestamps: true }
);

// Indexes
aiAssessmentSchema.index({ menteeId: 1 });
aiAssessmentSchema.index({ status: 1 });
aiAssessmentSchema.index({ completedAt: -1 });

module.exports =
  mongoose.models.AiAssessment ||
  mongoose.model("AiAssessment", aiAssessmentSchema);
