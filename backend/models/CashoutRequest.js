import mongoose from "mongoose";
const { Schema } = mongoose;

const cashoutRequestSchema = new Schema(
  {
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "jazzcash", "easypaisa", "paypal"],
      required: true,
    },
    paymentDetails: {
      type: String,
      required: true,
    },
    adminNote: {
      type: String,
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

cashoutRequestSchema.index({ mentorId: 1, status: 1 });
cashoutRequestSchema.index({ status: 1, createdAt: 1 });

export default mongoose.models.CashoutRequest || mongoose.model("CashoutRequest", cashoutRequestSchema);
