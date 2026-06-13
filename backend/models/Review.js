const mongoose = require("mongoose");
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    mentorId:  { type: Schema.Types.ObjectId, ref: "User",    required: true },
    menteeId:  { type: Schema.Types.ObjectId, ref: "User",    required: true },

    // ── Overall + Sub-Ratings ──────────────────────────────────────
    rating: { type: Number, required: true, min: 1, max: 5 },
    subRatings: {
      communication:  { type: Number, min: 1, max: 5, default: null },
      technicalDepth: { type: Number, min: 1, max: 5, default: null },
      punctuality:    { type: Number, min: 1, max: 5, default: null },
      helpfulness:    { type: Number, min: 1, max: 5, default: null },
    },

    // ── Written Feedback ───────────────────────────────────────────
    reviewText:  { type: String, maxlength: 1000, default: null },
    isAnonymous: { type: Boolean, default: false },

    // ── Mentor Reply ───────────────────────────────────────────────
    mentorReply: {
      text:      { type: String, default: null },
      repliedAt: { type: Date,   default: null },
    },

    // ── Moderation ─────────────────────────────────────────────────
    isVisible:   { type: Boolean, default: true },
    flagged:     { type: Boolean, default: false },
    flagReason:  { type: String,  default: null },
    moderatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    moderatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes
reviewSchema.index({ mentorId: 1, createdAt: -1 });
reviewSchema.index({ menteeId: 1 });
reviewSchema.index({ sessionId: 1 }, { unique: true }); // one review per session
reviewSchema.index({ mentorId: 1, rating: 1 });

// Post-save: update denormalized rating stats on MentorProfile
reviewSchema.post("save", async function (doc) {
  try {
    const MentorProfile = mongoose.model("MentorProfile");
    const ratingKeyMap = { 5: "five", 4: "four", 3: "three", 2: "two", 1: "one" };
    const key = ratingKeyMap[Math.round(doc.rating)];

    // Fetch current profile to recompute average
    const profile = await MentorProfile.findOne({ userId: doc.mentorId });
    if (!profile) return;

    const newTotal = profile.totalReviews + 1;
    const newAvg = parseFloat(
      ((profile.averageRating * profile.totalReviews + doc.rating) / newTotal).toFixed(2)
    );

    await MentorProfile.findOneAndUpdate(
      { userId: doc.mentorId },
      {
        $inc:  { totalReviews: 1, [`ratingBreakdown.${key}`]: 1 },
        $set:  { averageRating: newAvg },
      }
    );
  } catch (err) {
    console.error("Review post-save hook error:", err.message);
  }
});

module.exports =
  mongoose.models.Review || mongoose.model("Review", reviewSchema);
