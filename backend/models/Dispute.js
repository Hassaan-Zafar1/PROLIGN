import mongoose from "mongoose";
const { Schema } = mongoose;

const disputeSchema = new Schema(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    filedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    menteeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    evidence: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["open", "resolved_mentor", "resolved_mentee"],
      default: "open",
    },
    adminNote: {
      type: String,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

disputeSchema.index({ sessionId: 1 });
disputeSchema.index({ status: 1 });
disputeSchema.index({ menteeId: 1 });
disputeSchema.index({ mentorId: 1 });

export default mongoose.models.Dispute || mongoose.model("Dispute", disputeSchema);
