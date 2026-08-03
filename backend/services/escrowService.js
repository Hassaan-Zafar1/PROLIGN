import Payment from "../models/Payment.js";
import Session from "../models/Session.js";
import Wallet from "../models/Wallet.js";
import User from "../models/User.js";
import { ApiError } from "../middleware/errorHandler.js";

// Helper function to get or create wallet
export async function getOrCreateWallet(userId, role) {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = await Wallet.create({
      userId,
      role,
      pendingBalance: 0,
      availableBalance: 0,
      totalEarned: 0,
      totalCashedOut: 0,
      escrowBalance: 0,
      totalPlatformEarnings: 0,
    });
  }
  return wallet;
}

export async function holdInEscrow(payment) {
  const now = new Date();
  payment.escrowStatus = "held";
  payment.escrowHeldAt = now;
  await payment.save();

  const adminUser = await User.findOne({ role: "admin" });
  if (!adminUser) {
    throw new ApiError(404, "No admin user found to hold escrow.");
  }

  const adminWallet = await getOrCreateWallet(adminUser._id, "admin");
  adminWallet.escrowBalance += payment.mentorEarnings;
  adminWallet.totalPlatformEarnings += payment.platformCommission;
  await adminWallet.save();

  return payment;
}

export async function openDisputeWindow(sessionId) {
  const session = await Session.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found.");

  const payment = await Payment.findOne({ sessionId });
  if (!payment) throw new ApiError(404, "Payment not found for session.");

  if (payment.escrowStatus !== "held") {
    throw new ApiError(400, "Escrow status must be held to open dispute window.");
  }

  const now = new Date();
  payment.escrowStatus = "dispute_window";
  payment.disputeDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  await payment.save();

  return payment;
}

export async function releaseToMentor(paymentId, adminId, method) {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(404, "Payment not found.");

  if (payment.escrowStatus !== "dispute_window" && payment.escrowStatus !== "held" && payment.escrowStatus !== "disputed") {
    throw new ApiError(400, "Escrow can only be released if status is dispute_window, held, or disputed.");
  }

  const now = new Date();

  // Decrement admin escrow
  const adminUser = await User.findOne({ role: "admin" });
  if (adminUser) {
    const adminWallet = await getOrCreateWallet(adminUser._id, "admin");
    adminWallet.escrowBalance = Math.max(0, adminWallet.escrowBalance - payment.mentorEarnings);
    await adminWallet.save();
  }

  // Increment mentor availableBalance & totalEarned
  const mentorWallet = await getOrCreateWallet(payment.mentorId, "mentor");
  mentorWallet.availableBalance += payment.mentorEarnings;
  mentorWallet.totalEarned += payment.mentorEarnings;
  await mentorWallet.save();

  // Update payment status
  payment.escrowStatus = "released";
  payment.escrowReleasedAt = now;
  payment.payoutStatus = "paid";
  payment.payoutCompletedAt = now;
  await payment.save();

  return payment;
}

export async function refundMentee(paymentId, adminId, reason) {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(404, "Payment not found.");

  const now = new Date();

  // Decrement admin escrow
  const adminUser = await User.findOne({ role: "admin" });
  if (adminUser) {
    const adminWallet = await getOrCreateWallet(adminUser._id, "admin");
    adminWallet.escrowBalance = Math.max(0, adminWallet.escrowBalance - payment.mentorEarnings);
    await adminWallet.save();
  }

  // Update payment status
  payment.escrowStatus = "refunded";
  payment.chargeStatus = "refunded";
  payment.refundReason = reason;
  payment.refundedAt = now;
  payment.payoutStatus = "failed";
  await payment.save();

  return payment;
}

export async function autoReleaseExpiredEscrow() {
  const now = new Date();
  const payments = await Payment.find({
    escrowStatus: "dispute_window",
    disputeDeadline: { $lt: now },
  });

  const results = [];
  for (const payment of payments) {
    try {
      await releaseToMentor(payment._id, null, "auto_release");
      results.push({ paymentId: payment._id, status: "success" });
    } catch (err) {
      console.error(`Failed to auto-release payment ${payment._id}:`, err);
      results.push({ paymentId: payment._id, status: "failed", error: err.message });
    }
  }
  return results;
}
