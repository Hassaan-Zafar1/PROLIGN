import Payment from "../models/Payment.js";
import Session from "../models/Session.js";
import { ApiError } from "../middleware/errorHandler.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

/**
 * Payments for sessions.
 *
 * Frontend usage:
 *   POST   /api/payments   { sessionId, grossAmount, commissionRate?, currency? }
 *          → derives platformCommission + mentorEarnings and links the session.
 *   GET    /api/payments?chargeStatus=&payoutStatus=   → my payments (mentee/mentor); admin sees all
 *   GET    /api/payments/:id
 *   PATCH  /api/payments/:id  { chargeStatus | payoutStatus | refundAmount }  (admin only)
 *   DELETE /api/payments/:id   (admin only)
 *
 * NOTE: Stripe isn't wired yet — amounts/ids are supplied in the body and a test
 * paymentIntent id is generated if omitted. Swap in real Stripe later.
 */

const DEFAULT_COMMISSION_RATE = 0.15;

const parsePage = (q) => {
  const page = Math.max(parseInt(q.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 25, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const isParticipant = (p, user) =>
  user.role === "admin" ||
  String(p.menteeId) === String(user._id) ||
  String(p.mentorId) === String(user._id);

export async function createPayment(user, body) {
  const { sessionId, grossAmount } = body;
  if (!sessionId || grossAmount == null) throw new ApiError(400, "sessionId and grossAmount are required.");

  const session = await Session.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found.");
  // Only the mentee on the session (the payer) or an admin can create the payment.
  if (user.role !== "admin" && String(session.menteeId) !== String(user._id)) {
    throw new ApiError(403, "Only the booking mentee can pay for this session.");
  }

  const gross = Number(grossAmount);
  if (!Number.isFinite(gross) || gross < 0) throw new ApiError(400, "grossAmount must be a non-negative number.");
  const commissionRate = body.commissionRate != null ? Number(body.commissionRate) : DEFAULT_COMMISSION_RATE;
  const platformCommission = Math.round(gross * commissionRate);
  const mentorEarnings = gross - platformCommission;

  try {
    const payment = await Payment.create({
      sessionId,
      menteeId: session.menteeId,
      mentorId: session.mentorId,
      stripePaymentIntentId: body.stripePaymentIntentId || `pi_test_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      grossAmount: gross,
      platformCommission,
      mentorEarnings,
      commissionRate,
      currency: (body.currency || "usd").toLowerCase(),
      chargeStatus: body.chargeStatus || "captured",
    });
    // Link the payment onto the session.
    await Session.updateOne({ _id: sessionId }, { $set: { paymentId: payment._id } });
    return payment;
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, "A payment already exists for this session.");
    throw err;
  }
}

export async function listPayments(query, user) {
  const { page, limit, skip } = parsePage(query);
  const filter = user.role === "admin" ? {} : { $or: [{ menteeId: user._id }, { mentorId: user._id }] };
  if (query.chargeStatus) filter.chargeStatus = query.chargeStatus;
  if (query.payoutStatus) filter.payoutStatus = query.payoutStatus;

  const [data, total] = await Promise.all([
    Payment.find(filter).populate("sessionId", "sessionType scheduledDate status").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Payment.countDocuments(filter),
  ]);
  return { data, total, page, pages: Math.ceil(total / limit) || 1 };
}

export async function getPayment(id, user) {
  const payment = await Payment.findById(id).populate("sessionId", "sessionType scheduledDate status").lean();
  if (!payment) throw new ApiError(404, "Payment not found.");
  if (!isParticipant(payment, user)) throw new ApiError(403, "Not allowed to view this payment.");
  return payment;
}

export async function updatePayment(id, user, body) {
  if (user.role !== "admin") throw new ApiError(403, "Only an admin can update payment/payout status.");
  const payment = await Payment.findById(id);
  if (!payment) throw new ApiError(404, "Payment not found.");

  if (body.chargeStatus) payment.chargeStatus = body.chargeStatus;
  if (body.payoutStatus) {
    payment.payoutStatus = body.payoutStatus;
    if (body.payoutStatus === "processing") payment.payoutInitiatedAt = new Date();
    if (body.payoutStatus === "paid") payment.payoutCompletedAt = new Date();
  }
  if (body.refundAmount != null) {
    payment.refundAmount = Number(body.refundAmount);
    payment.chargeStatus = "refunded";
    payment.refundedAt = new Date();
    if (body.refundReason) payment.refundReason = body.refundReason;
  }
  await payment.save();
  return payment;
}

export async function deletePayment(id, user) {
  if (user.role !== "admin") throw new ApiError(403, "Only an admin can delete a payment.");
  const payment = await Payment.findById(id);
  if (!payment) throw new ApiError(404, "Payment not found.");
  await payment.deleteOne();
  return { message: "Payment deleted." };
}

export async function createPaymentIntent(user, { sessionId }) {
  const session = await Session.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found.");
  if (user.role !== "admin" && String(session.menteeId) !== String(user._id)) {
    throw new ApiError(403, "Only the booking mentee can pay for this session.");
  }

  const gross = Number(session.priceCharged);
  const commissionRate = 0.15; // platform commission
  const platformCommission = Math.round(gross * commissionRate);
  const mentorEarnings = gross - platformCommission;

  // Convert amount to the smallest unit (e.g. cents/paisas)
  const amountInCents = Math.round(gross * 100);

  // 1. Create the PaymentIntent on Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: session.currency.toLowerCase(),
    metadata: { sessionId: String(sessionId) },
  });

  // 2. Save the payment record locally in "initiated" state
  const payment = await Payment.create({
    sessionId,
    menteeId: session.menteeId,
    mentorId: session.mentorId,
    stripePaymentIntentId: paymentIntent.id,
    grossAmount: gross,
    platformCommission,
    mentorEarnings,
    commissionRate,
    currency: session.currency.toLowerCase(),
    chargeStatus: "initiated",
  });

  // 3. Link the payment onto the session
  await Session.updateOne({ _id: sessionId }, { $set: { paymentId: payment._id } });

  return {
    clientSecret: paymentIntent.client_secret,
    payment,
  };
}

export async function handleStripeWebhook(signature, rawBody) {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    throw new ApiError(400, `Webhook signature verification failed: ${err.message}`);
  }

  const intent = event.data.object;

  if (event.type === "payment_intent.succeeded") {
    // Find the payment, update status, and record the webhook event
    const payment = await Payment.findOneAndUpdate(
      { stripePaymentIntentId: intent.id },
      {
        $set: { chargeStatus: "captured" },
        $push: { webhookEvents: { event: event.type } },
      },
      { new: true }
    );

    if (payment) {
      // Confirm the session now that payment was completed
      await Session.updateOne(
        { _id: payment.sessionId },
        { $set: { status: "confirmed" } }
      );
    }
  } else if (event.type === "payment_intent.payment_failed") {
    // Record payment failure
    await Payment.updateOne(
      { stripePaymentIntentId: intent.id },
      {
        $set: { chargeStatus: "failed" },
        $push: { webhookEvents: { event: event.type } },
      }
    );
  }

  return { received: true };
}