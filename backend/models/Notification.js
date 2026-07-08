import mongoose from "mongoose";
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    type: {
      type: String,
      enum: [
        "session_booked",
        "session_reminder_24h",
        "session_reminder_1h",
        "session_reminder_15min",
        "session_cancelled",
        "session_completed",
        "payment_received",
        "payout_sent",
        "review_received",
        "mentor_approved",
        "mentor_rejected",
        "account_banned",
        "general",
      ],
      required: true,
    },

    title: { type: String, required: true },
    body:  { type: String, required: true },

    // Context for frontend deep-linking
    data: {
      sessionId: { type: Schema.Types.ObjectId, ref: "Session",  default: null },
      mentorId:  { type: Schema.Types.ObjectId, ref: "User",     default: null },
      menteeId:  { type: Schema.Types.ObjectId, ref: "User",     default: null },
      paymentId: { type: Schema.Types.ObjectId, ref: "Payment",  default: null },
    },

    isRead:    { type: Boolean, default: false },
    readAt:    { type: Date,    default: null },
    emailSent: { type: Boolean, default: false }, // was email also dispatched?
    createdAt: { type: Date,    default: Date.now }, // TTL index on this field
  }
  // No timestamps: true — createdAt is manual above (TTL needs it)
);

// Indexes
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

// TTL: auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export default mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
