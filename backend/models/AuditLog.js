const mongoose = require("mongoose");
const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    actorId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorRole: {
      type: String,
      enum: ["admin", "mentor", "mentee", "system"],
      required: true,
    },

    action: {
      type: String,
      enum: [
        "mentor_approved",
        "mentor_rejected",
        "user_banned",
        "user_unbanned",
        "session_cancelled",
        "refund_issued",
        "payout_triggered",
        "review_moderated",
        "review_flagged",
        "admin_login",
        "password_reset",
        "profile_updated",
      ],
      required: true,
    },

    targetId:   { type: Schema.Types.ObjectId, required: true },
    targetType: {
      type: String,
      enum: ["user", "session", "payment", "review", "mentor_profile"],
      required: true,
    },

    before: { type: Schema.Types.Mixed, default: null }, // field values before change
    after:  { type: Schema.Types.Mixed, default: null }, // field values after change

    ip:        { type: String, default: null },
    userAgent: { type: String, default: null },

    createdAt: { type: Date, default: Date.now }, // TTL index on this field
  }
);

// Indexes
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ targetId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });

// TTL: auto-delete audit logs older than 1 year
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

module.exports =
  mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
