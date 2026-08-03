import Wallet from "../models/Wallet.js";
import CashoutRequest from "../models/CashoutRequest.js";
import { getOrCreateWallet } from "../services/escrowService.js";
import { ApiError } from "../middleware/errorHandler.js";

// Helper/middleware for asyncHandler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const getMyWallet = asyncHandler(async (req, res) => {
  if (req.user.role !== "mentor" && req.user.role !== "admin") {
    throw new ApiError(403, "Access denied. Required role: mentor or admin.");
  }

  const wallet = await getOrCreateWallet(req.user._id, req.user.role);
  
  let lastCashouts = [];
  if (req.user.role === "mentor") {
    lastCashouts = await CashoutRequest.find({ mentorId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);
  }

  res.status(200).json({
    success: true,
    wallet,
    lastCashouts,
  });
});

// 2. POST /api/cashout/request
export const requestCashout = asyncHandler(async (req, res) => {
  if (req.user.role !== "mentor") {
    throw new ApiError(403, "Access denied. Mentor only.");
  }

  const { amount, paymentMethod, paymentDetails } = req.body;
  if (!amount || !paymentMethod || !paymentDetails) {
    throw new ApiError(400, "amount, paymentMethod, and paymentDetails are required.");
  }

  const cashoutAmount = Number(amount);
  if (isNaN(cashoutAmount) || cashoutAmount < 100) {
    throw new ApiError(400, "Minimum cashout amount is $100.");
  }

  const wallet = await getOrCreateWallet(req.user._id, "mentor");
  if (wallet.availableBalance < cashoutAmount) {
    throw new ApiError(400, "Insufficient available balance.");
  }

  const cashoutRequest = await CashoutRequest.create({
    mentorId: req.user._id,
    amount: cashoutAmount,
    paymentMethod,
    paymentDetails,
    status: "pending",
  });

  res.status(201).json({
    success: true,
    cashoutRequest,
  });
});

// 3. GET /api/cashout
export const getCashoutRequests = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Access denied. Admin only.");
  }

  const { status } = req.query;
  const filter = {};
  if (status) {
    filter.status = status;
  }

  const requests = await CashoutRequest.find(filter)
    .sort({ createdAt: -1 })
    .populate("mentorId", "name email");

  res.status(200).json({
    success: true,
    requests,
  });
});

// 4. PATCH /api/cashout/:id/approve
export const approveCashout = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Access denied. Admin only.");
  }

  const request = await CashoutRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, "Cashout request not found.");

  if (request.status !== "pending") {
    throw new ApiError(400, "Cashout request has already been processed.");
  }

  const wallet = await Wallet.findOne({ userId: request.mentorId });
  if (!wallet || wallet.availableBalance < request.amount) {
    throw new ApiError(400, "Insufficient available balance in mentor's wallet.");
  }

  // Update wallet
  wallet.availableBalance -= request.amount;
  wallet.totalCashedOut += request.amount;
  await wallet.save();

  // Update request
  request.status = "approved";
  request.processedAt = new Date();
  request.processedBy = req.user._id;
  await request.save();

  res.status(200).json({
    success: true,
    cashoutRequest: request,
  });
});

// 5. PATCH /api/cashout/:id/reject
export const rejectCashout = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Access denied. Admin only.");
  }

  const { adminNote } = req.body;
  const request = await CashoutRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, "Cashout request not found.");

  if (request.status !== "pending") {
    throw new ApiError(400, "Cashout request has already been processed.");
  }

  request.status = "rejected";
  request.adminNote = adminNote || null;
  request.processedAt = new Date();
  request.processedBy = req.user._id;
  await request.save();

  res.status(200).json({
    success: true,
    cashoutRequest: request,
  });
});
