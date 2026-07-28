import * as testHelperService from "../services/testHelperService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const getLastOtp = asyncHandler(async (req, res) => {
  const result = testHelperService.getLastOtp(req.params.userId);
  res.status(200).json({ success: true, ...result });
});

export const seedMenteeProfile = asyncHandler(async (req, res) => {
  const result = await testHelperService.seedMenteeProfile(req.body);
  res.status(201).json({ success: true, ...result });
});

export const seedAdmin = asyncHandler(async (req, res) => {
  const result = await testHelperService.seedAdmin(req.body);
  res.status(200).json({ success: true, ...result });
});
