import * as interviewService from "../services/interviewService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const submitInterview = asyncHandler(async (req, res) => {
  const result = await interviewService.submitInterview(req.user, req.body, req);
  res.status(200).json({ success: true, message: "Interview saved.", ...result });
});

export const getInterview = asyncHandler(async (req, res) => {
  const { assessment } = await interviewService.getInterview(req.user._id);
  res.status(200).json({ success: true, assessment });
});

export const completeInterview = asyncHandler(async (req, res) => {
  const result = await interviewService.completeInterview(req.user, req.body, req);
  res.status(200).json({ success: true, message: "Interview completed.", ...result });
});
