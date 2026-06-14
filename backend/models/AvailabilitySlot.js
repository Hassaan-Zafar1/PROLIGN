const mongoose = require("mongoose");
const { Schema } = mongoose;

const availabilitySlotSchema = new Schema(
  {
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Slot Type ──────────────────────────────────────────────────
    slotType: {
      type: String,
      enum: ["recurring", "one_off"],
      default: "recurring",
    },

    // ── Weekly Template Fields (for recurring slots) ───────────────
    dayOfWeek: { type: Number, min: 0, max: 6 }, // 0=Sun … 6=Sat

    // ── Concrete Bookable Fields ───────────────────────────────────
    date:      { type: Date,   required: true },  // exact calendar date (UTC midnight)
    startTime: { type: String, required: true },  // "10:00" (24hr, mentor local time)
    endTime:   { type: String, required: true },  // "10:30"
    timezone:  { type: String, default: "Asia/Karachi" },

    // ── Booking State ──────────────────────────────────────────────
    status: {
      type: String,
      enum: ["available", "booked", "blocked", "cancelled"],
      default: "available",
    },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", default: null },
    bookedBy:  { type: Schema.Types.ObjectId, ref: "User",    default: null },
    bookedAt:  { type: Date, default: null },

    // ── Mentor Block Override ──────────────────────────────────────
    blockedReason: { type: String, default: null }, // "vacation" | "unavailable"
  },
  { timestamps: true }
);

// Indexes
availabilitySlotSchema.index({ mentorId: 1, dayOfWeek: 1, startTime: 1 });
availabilitySlotSchema.index({ mentorId: 1, date: 1, status: 1 });

// CRITICAL: prevents double-booking at the DB level (not just app level)
availabilitySlotSchema.index(
  { mentorId: 1, date: 1, startTime: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.AvailabilitySlot ||
  mongoose.model("AvailabilitySlot", availabilitySlotSchema);
