import * as paymentService from "../services/paymentService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listPayments = asyncHandler(async (req, res) => {
  const { data, total, page, pages } = await paymentService.listPayments(req.query, req.user);
  res.status(200).json({ success: true, count: data.length, total, page, pages, data });
});

export const getPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPayment(req.params.id, req.user);
  res.status(200).json({ success: true, data: payment });
});

export const createPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.createPayment(req.user, req.body);
  res.status(201).json({ success: true, message: "Payment recorded.", data: payment });
});

export const updatePayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.updatePayment(req.params.id, req.user, req.body);
  res.status(200).json({ success: true, message: "Payment updated.", data: payment });
});

export const deletePayment = asyncHandler(async (req, res) => {
  const result = await paymentService.deletePayment(req.params.id, req.user);
  res.status(200).json({ success: true, ...result });
});

export const createPaymentIntent = asyncHandler(async (req, res) => {
  const result = await paymentService.createPaymentIntent(req.user, req.body);
  res.status(200).json({ success: true, ...result });
});

export const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  const result = await paymentService.handleStripeWebhook(signature, req.rawBody);
  res.status(200).json(result);
});

