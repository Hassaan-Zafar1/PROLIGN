import Session from "../models/Session.js";
import Dispute from "../models/Dispute.js";
import Payment from "../models/Payment.js";
import { openDisputeWindow, releaseToMentor, refundMentee } from "../services/escrowService.js";
import { ApiError } from "../middleware/errorHandler.js";

// Helper/middleware for asyncHandler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 1. PATCH /api/sessions/:id/confirm-completion
export const confirmSessionCompletion = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found.");

  let role = null;
  if (String(session.menteeId) === String(req.user._id) && req.user.role === "mentee") {
    role = "mentee";
  } else if (String(session.mentorId) === String(req.user._id) && req.user.role === "mentor") {
    role = "mentor";
  }

  if (!role) {
    throw new ApiError(403, "You are not authorized to confirm completion for this session.");
  }

  if (session.status !== "in_progress" && session.status !== "confirmed") {
    throw new ApiError(400, "Session status must be in_progress or confirmed.");
  }

  if (session.completionConfirmedBy.includes(role)) {
    throw new ApiError(400, "You already confirmed completion.");
  }

  session.completionConfirmedBy.push(role);

  if (
    session.completionConfirmedBy.includes("mentee") &&
    session.completionConfirmedBy.includes("mentor")
  ) {
    session.status = "completed";
    session.completedAt = new Date();
    await session.save();
    await openDisputeWindow(session._id);
  } else {
    await session.save();
  }

  res.status(200).json({ success: true, session });
});

// 2. POST /api/disputes
export const createDispute = asyncHandler(async (req, res) => {
  const { sessionId, reason, evidence } = req.body;
  if (!sessionId || !reason) {
    throw new ApiError(400, "sessionId and reason are required.");
  }

  if (req.user.role !== "mentee") {
    throw new ApiError(403, "Only mentees can file disputes.");
  }

  const session = await Session.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found.");

  if (String(session.menteeId) !== String(req.user._id)) {
    throw new ApiError(403, "You can only file a dispute for your own sessions.");
  }

  const payment = await Payment.findOne({ sessionId });
  if (!payment) throw new ApiError(404, "Payment not found for this session.");

  if (payment.escrowStatus !== "dispute_window") {
    throw new ApiError(400, "Disputes can only be filed during the dispute window.");
  }

  // Check if dispute already exists for this session
  const existingDispute = await Dispute.findOne({ sessionId });
  if (existingDispute) {
    throw new ApiError(400, "A dispute already exists for this session.");
  }

  const dispute = await Dispute.create({
    sessionId,
    paymentId: payment._id,
    filedBy: req.user._id,
    menteeId: session.menteeId,
    mentorId: session.mentorId,
    reason,
    evidence: evidence || null,
    status: "open",
  });

  payment.escrowStatus = "disputed";
  await payment.save();

  res.status(201).json({ success: true, dispute });
});

// 3. GET /api/disputes
export const getDisputes = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Access denied. Admin only.");
  }

  const { status } = req.query;
  const filter = {};
  if (status) {
    filter.status = status;
  }

  const disputes = await Dispute.find(filter)
    .populate("sessionId")
    .populate("paymentId");

  res.status(200).json({ success: true, disputes });
});

// 4. PATCH /api/disputes/:id/resolve
export const resolveDispute = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Access denied. Admin only.");
  }

  const { decision, adminNote } = req.body;
  if (!decision || (decision !== "mentor" && decision !== "mentee")) {
    throw new ApiError(400, "decision must be 'mentor' or 'mentee'.");
  }

  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) throw new ApiError(404, "Dispute not found.");

  if (dispute.status !== "open") {
    throw new ApiError(400, "Dispute is already resolved.");
  }

  if (decision === "mentor") {
    await releaseToMentor(dispute.paymentId, req.user._id, "admin");
    dispute.status = "resolved_mentor";
  } else {
    await refundMentee(dispute.paymentId, req.user._id, adminNote || "Dispute resolved in favor of mentee");
    dispute.status = "resolved_mentee";
  }

  dispute.adminNote = adminNote || null;
  dispute.resolvedAt = new Date();
  dispute.resolvedBy = req.user._id;
  await dispute.save();

  res.status(200).json({ success: true, dispute });
});
