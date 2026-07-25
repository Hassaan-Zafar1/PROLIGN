import mongoose from "mongoose";
const { Schema } = mongoose;

const videoConferenceSchema = new Schema(
  {
    provider: { type: String, enum: ["jitsi", "zoom"], default: "jitsi" },
    roomName: { type: String, default: null }, // Jitsi unique room name
    meetingUrl: { type: String, default: null }, // full join URL for both parties
    meetingId: { type: String, default: null }, // Zoom meeting ID
    hostToken: { type: String, default: null }, // Jitsi JWT for mentor (host priv)
    startUrl: { type: String, default: null }, // Zoom host-only start URL
    createdAt: { type: Date, default: null },
  },
  { _id: false }
);

const resourceSchema = new Schema(
  {
    label: { type: String },
    url: { type: String },
  },
  { _id: false }
);

const sessionSchema = new Schema(
  {
    menteeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mentorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    slotId: { type: Schema.Types.ObjectId, ref: "AvailabilitySlot", required: true },

    // ── Session Details ────────────────────────────────────────────
    sessionType: {
      type: String,
      enum: ["mock_interview", "resume_review", "career_counseling", "technical", "workshop"],
      required: true,
    },
    title: { type: String, default: null },
    agenda: { type: String, default: null }, // mentee's stated goal

    // ── Schedule ───────────────────────────────────────────────────
    scheduledDate: { type: Date, required: true }, // UTC datetime
    durationMinutes: { type: Number, enum: [30, 60, 90], default: 60 },
    timezone: { type: String, default: "Asia/Karachi" }, // mentee's timezone

    // ── Video Conference ───────────────────────────────────────────
    videoConference: { type: videoConferenceSchema, default: () => ({}) },

    // ── Session State Machine ─────────────────────────────────────
    // pending → confirmed → in_progress → completed
    //         → cancelled_by_mentee | cancelled_by_mentor
    //         → no_show_mentee | no_show_mentor
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled_by_mentee",
        "cancelled_by_mentor",
        "no_show_mentee",
        "no_show_mentor",
      ],
      default: "pending",
    },

    // ── State Transition Timestamps ────────────────────────────────
    confirmedAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: String, enum: ["mentee", "mentor", "admin"], default: null },
    cancellationReason: { type: String, default: null },

    // ── Payment ────────────────────────────────────────────────────
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment", default: null },
    priceCharged: { type: Number, required: true }, // snapshot at booking time
    currency: { type: String, enum: ["PKR", "USD"], default: "USD" },

    // ── Post-Session ───────────────────────────────────────────────
    reviewId: { type: Schema.Types.ObjectId, ref: "Review", default: null },
    mentorNotes: { type: String, default: null }, // private mentor notes
    resources: { type: [resourceSchema], default: [] }, // mentor shared links

    // ── Reminder Tracking ──────────────────────────────────────────
    remindersSent: { type: [String], default: [] }, // ["24h", "1h", "15min"]
  },
  { timestamps: true }
);

// Indexes
sessionSchema.index({ menteeId: 1, status: 1, scheduledDate: -1 });
sessionSchema.index({ mentorId: 1, status: 1, scheduledDate: -1 });
sessionSchema.index({ menteeId: 1, scheduledDate: 1 }); // one-session-per-day check
sessionSchema.index({ status: 1, scheduledDate: 1 });   // reminder cron queries
sessionSchema.index({ slotId: 1 }, { unique: true });   // no duplicate booking
sessionSchema.index({ paymentId: 1 });

export default mongoose.models.Session || mongoose.model("Session", sessionSchema);
