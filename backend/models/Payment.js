const mongoose = require("mongoose");
const { Schema } = mongoose;

const webhookEventSchema = new Schema(
  {
    event:      { type: String }, // "payment_intent.succeeded"
    receivedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const paymentSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    menteeId:  { type: Schema.Types.ObjectId, ref: "User",    required: true },
    mentorId:  { type: Schema.Types.ObjectId, ref: "User",    required: true },

    // ── Stripe Object IDs ──────────────────────────────────────────
    // NEVER store raw card data or Stripe secret keys here
    stripePaymentIntentId: { type: String, required: true }, // pi_xxx — idempotency key
    stripeCustomerId:      { type: String, default: null },  // cus_xxx
    stripeChargeId:        { type: String, default: null },  // ch_xxx
    stripeRefundId:        { type: String, default: null },  // re_xxx

    // ── Amounts (in smallest unit: paisas for PKR, cents for USD) ──
    grossAmount:        { type: Number, required: true }, // what mentee paid
    platformCommission: { type: Number, required: true }, // platform cut
    mentorEarnings:     { type: Number, required: true }, // grossAmount - commission
    refundAmount:       { type: Number, default: 0 },
    currency:           { type: String, enum: ["pkr", "usd"], default: "pkr" },
    commissionRate:     { type: Number, required: true }, // snapshot e.g. 0.15

    // ── Charge Status ──────────────────────────────────────────────
    chargeStatus: {
      type: String,
      enum: ["initiated", "captured", "failed", "refunded"],
      default: "initiated",
    },

    // ── Payout to Mentor (released after session completes) ────────
    payoutStatus: {
      type: String,
      enum: ["pending", "processing", "paid", "failed"],
      default: "pending",
    },
    payoutId:           { type: String, default: null }, // Stripe Transfer ID
    payoutInitiatedAt:  { type: Date,   default: null },
    payoutCompletedAt:  { type: Date,   default: null },

    // ── Refund ────────────────────────────────────────────────────
    refundReason:  { type: String, default: null }, // "mentor_cancelled"
    refundedAt:    { type: Date,   default: null },

    // ── Webhook Event Log (for debugging, not for business logic) ──
    webhookEvents: { type: [webhookEventSchema], default: [] },
  },
  { timestamps: true }
);

// Indexes
paymentSchema.index({ sessionId: 1 }, { unique: true });
paymentSchema.index({ menteeId: 1, createdAt: -1 });
paymentSchema.index({ mentorId: 1, payoutStatus: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 }, { unique: true }); // idempotency

module.exports =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
