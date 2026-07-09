import * as mentorService from "../services/mentorService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listMentors = asyncHandler(async (req, res) => {
  const result = await mentorService.listMentors(req.query);
  res.status(200).json({ success: true, ...result });
});

export const getRecommendedMentors = asyncHandler(async (req, res) => {
  const result = await mentorService.getRecommendedMentors(req.query);
  res.status(200).json({ success: true, ...result });
});

export const getMentorById = asyncHandler(async (req, res) => {
  const mentor = await mentorService.getMentorById(req.params.id);
  res.status(200).json({ success: true, mentor });
});

export const buildMentorProfile = asyncHandler(async (req, res) => {
  const result = await mentorService.buildMentorProfile(req.user, req);
  res.status(200).json({ success: true, message: "Profile built successfully.", ...result });
});
