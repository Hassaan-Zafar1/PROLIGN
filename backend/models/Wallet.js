import mongoose from "mongoose";
const { Schema } = mongoose;

const walletSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["mentor", "admin"],
      required: true,
    },
    pendingBalance: {
      type: Number,
      default: 0,
    },
    availableBalance: {
      type: Number,
      default: 0,
    },
    totalEarned: {
      type: Number,
      default: 0,
    },
    totalCashedOut: {
      type: Number,
      default: 0,
    },
    escrowBalance: {
      type: Number,
      default: 0,
    },
    totalPlatformEarnings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Wallet || mongoose.model("Wallet", walletSchema);
