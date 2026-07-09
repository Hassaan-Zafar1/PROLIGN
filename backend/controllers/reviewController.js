import * as reviewService from "../services/reviewService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listReviews = asyncHandler(async (req, res) => {
  const { data, total, page, pages } = await reviewService.listReviews(req.query, req.user);
  res.status(200).json({ success: true, count: data.length, total, page, pages, data });
});

export const getReview = asyncHandler(async (req, res) => {
  const review = await reviewService.getReview(req.params.id);
  res.status(200).json({ success: true, data: review });
});

export const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.user._id, req.body);
  res.status(201).json({ success: true, message: "Review submitted.", data: review });
});

export const updateReview = asyncHandler(async (req, res) => {
  const review = await reviewService.updateReview(req.params.id, req.user, req.body);
  res.status(200).json({ success: true, message: "Review updated.", data: review });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const result = await reviewService.deleteReview(req.params.id, req.user);
  res.status(200).json({ success: true, ...result });
});
