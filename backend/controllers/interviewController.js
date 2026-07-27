import * as interviewService from "../services/interviewService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const submitInterview = asyncHandler(async (req, res) => {
  const result = await interviewService.submitInterview(req.user, req.body, req);
  res.status(200).json({ success: true, message: "Interview linked to your account.", ...result });
});

export const getInterview = asyncHandler(async (req, res) => {
  const { profile } = await interviewService.getInterview(req.user._id);
  res.status(200).json({ success: true, profile });
});

export const completeInterview = asyncHandler(async (req, res) => {
  const result = await interviewService.completeInterview(req.user, req.body, req);
  res.status(200).json({ success: true, message: "Interview completed.", ...result });
});
