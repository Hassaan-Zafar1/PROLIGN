import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(".", ".env") });

import { holdInEscrow } from "../services/escrowService.js";
import { confirmSessionCompletion, createDispute, resolveDispute } from "../controllers/escrowController.js";
import Payment from "../models/Payment.js";
import Session from "../models/Session.js";
import Wallet from "../models/Wallet.js";
import User from "../models/User.js";
import Dispute from "../models/Dispute.js";

const makeMockReqRes = (user, params = {}, body = {}, query = {}) => {
  const req = { user, params, body, query };
  let resolvePromise;
  const done = new Promise((resolve) => {
    resolvePromise = resolve;
  });
  let error = null;
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      resolvePromise();
      return this;
    },
  };
  const next = (err) => {
    if (err) {
      error = err;
      resolvePromise();
    }
  };
  return { req, res, next, done, getError: () => error };
};

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  // Clean up existing test users and payments if they exist
  await User.deleteMany({ email: /test-e2e-.*@example.com/ });
  await Payment.deleteMany({ stripePaymentIntentId: "pi_test_e2e_webhook" });

  // 1. Setup mock accounts
  const adminUser = await User.create({
    name: "System Admin",
    email: "test-e2e-admin@example.com",
    role: "admin",
    password: "password123",
  });
  const mentor = await User.create({
    name: "Expert Mentor",
    email: "test-e2e-mentor@example.com",
    role: "mentor",
    password: "password123",
  });
  const mentee = await User.create({
    name: "Aspiring Mentee",
    email: "test-e2e-mentee@example.com",
    role: "mentee",
    password: "password123",
  });

  console.log("Mock accounts registered.");

  // 2. Mentee books a session (Simulated booked state)
  const session = await Session.create({
    menteeId: mentee._id,
    mentorId: mentor._id,
    slotId: new mongoose.Types.ObjectId(),
    sessionType: "mock_interview",
    title: "System Design Prep Session",
    scheduledDate: new Date(),
    durationMinutes: 60,
    priceCharged: 150,
    status: "confirmed",
  });
  console.log(`\n[Step 1] Mentee booked session. Session ID: ${session._id}, Status: ${session.status}`);

  // 3. stripe payment_intent.succeeded webhook trigger
  const payment = await Payment.create({
    sessionId: session._id,
    menteeId: mentee._id,
    mentorId: mentor._id,
    stripePaymentIntentId: "pi_test_e2e_webhook",
    grossAmount: 150,
    platformCommission: 22.5,
    mentorEarnings: 127.5,
    commissionRate: 0.15,
  });

  console.log(`\n[Step 2] Stripe webhook captured. Payment registered. Initial escrow status: ${payment.escrowStatus}`);

  // Hold funds in Escrow
  await holdInEscrow(payment);
  const updatedPaymentAfterHold = await Payment.findById(payment._id);
  
  const matchedAdmin = await User.findOne({ role: "admin" });
  const adminWalletAfterHold = await Wallet.findOne({ userId: matchedAdmin._id });

  console.log(`-> Escrow Status: ${updatedPaymentAfterHold.escrowStatus}`);
  console.log(`-> Admin Escrow Balance: $${adminWalletAfterHold.escrowBalance} (Mentor's cut: $127.50 held)`);

  // 4. Session completed - Confirm Completion (Mentee first)
  console.log("\n[Step 3] Mentee confirms session completion...");
  const menteeConfirm = makeMockReqRes(mentee, { id: session._id });
  await confirmSessionCompletion(menteeConfirm.req, menteeConfirm.res, menteeConfirm.next);
  await menteeConfirm.done;

  const sessionAfterMenteeConfirm = await Session.findById(session._id);
  console.log(`-> Session Status: ${sessionAfterMenteeConfirm.status}`);
  console.log(`-> Confirmations: ${JSON.stringify(sessionAfterMenteeConfirm.completionConfirmedBy)}`);

  // Confirm Completion (Mentor second)
  console.log("\n[Step 4] Mentor confirms session completion (Dispute window opens)...");
  const mentorConfirm = makeMockReqRes(mentor, { id: session._id });
  await confirmSessionCompletion(mentorConfirm.req, mentorConfirm.res, mentorConfirm.next);
  await mentorConfirm.done;

  const sessionAfterMentorConfirm = await Session.findById(session._id);
  const paymentAfterCompletion = await Payment.findById(payment._id);

  console.log(`-> Session Status: ${sessionAfterMentorConfirm.status} (completedAt: ${sessionAfterMentorConfirm.completedAt})`);
  console.log(`-> Confirmations: ${JSON.stringify(sessionAfterMentorConfirm.completionConfirmedBy)}`);
  console.log(`-> Escrow Status: ${paymentAfterCompletion.escrowStatus}`);
  console.log(`-> Dispute Deadline: ${paymentAfterCompletion.disputeDeadline}`);

  // 5. Mentee files a dispute
  console.log("\n[Step 5] Mentee files a dispute claim...");
  const disputeReq = makeMockReqRes(mentee, {}, {
    sessionId: session._id,
    reason: "Mentor was late and did not cover the topics.",
    evidence: "Screenshots of chat showing 30m delay.",
  });
  await createDispute(disputeReq.req, disputeReq.res, disputeReq.next);
  await disputeReq.done;

  const dispute = disputeReq.res.data.dispute;
  const paymentAfterDispute = await Payment.findById(payment._id);

  console.log(`-> Dispute Status: ${dispute.status}`);
  console.log(`-> Payment Escrow Status: ${paymentAfterDispute.escrowStatus}`);

  // 6. Admin arbitrates dispute (Resolves in favor of Mentor -> Releases funds)
  console.log("\n[Step 6] Admin resolves dispute in favor of the Mentor (Releases escrow)...");
  const resolveReq = makeMockReqRes(adminUser, { id: dispute._id }, {
    decision: "mentor",
    adminNote: "Mentor proved they rescheduled and did the extra time. Release funds.",
  });
  await resolveDispute(resolveReq.req, resolveReq.res, resolveReq.next);
  await resolveReq.done;

  const finalDispute = resolveReq.res.data.dispute;
  const finalPayment = await Payment.findById(payment._id);
  const mentorWallet = await Wallet.findOne({ userId: mentor._id });
  const finalAdminWallet = await Wallet.findOne({ userId: matchedAdmin._id });

  console.log(`-> Dispute Final Status: ${finalDispute.status}`);
  console.log(`-> Dispute Admin Resolution Note: ${finalDispute.adminNote}`);
  console.log(`-> Payment Final Escrow Status: ${finalPayment.escrowStatus}`);
  console.log(`-> Payment Payout Status: ${finalPayment.payoutStatus}`);
  console.log(`-> Mentor Wallet Available Balance: $${mentorWallet.availableBalance}`);
  console.log(`-> Admin Wallet Escrow Balance: $${finalAdminWallet.escrowBalance}`);

  // Clean up
  console.log("\nCleaning up test documents...");
  await User.deleteMany({ _id: { $in: [adminUser._id, mentor._id, mentee._id] } });
  await Session.deleteOne({ _id: session._id });
  await Payment.deleteOne({ _id: payment._id });
  await Dispute.deleteOne({ _id: dispute._id });
  await Wallet.deleteMany({ userId: { $in: [adminUser._id, mentor._id] } });
  console.log("Cleanup complete.");

  await mongoose.disconnect();
}

run().catch(console.error);
