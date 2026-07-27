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

export const listMentorProfiles = asyncHandler(async (req, res) => {
  const result = await mentorService.listMentorProfiles(req.query);
  res.status(200).json({ success: true, ...result });
});

export const getMyMentorProfile = asyncHandler(async (req, res) => {
  const profile = await mentorService.getMyMentorProfile(req.user._id);
  res.status(200).json({ success: true, profile });
});

export const updateMyMentorProfile = asyncHandler(async (req, res) => {
  const profile = await mentorService.updateMyMentorProfile(req.user._id, req.body);
  res.status(200).json({ success: true, profile });
});

export const getMentorProfile = asyncHandler(async (req, res) => {
  const profile = await mentorService.getMentorProfile(req.params.id);
  res.status(200).json({ success: true, profile });
});

export const createMentorProfile = asyncHandler(async (req, res) => {
  const profile = await mentorService.createMentorProfile(req.user._id, req.body);
  res.status(201).json({ success: true, profile });
});

export const updateMentorProfile = asyncHandler(async (req, res) => {
  const profile = await mentorService.updateMentorProfile(req.params.id, req.body);
  res.status(200).json({ success: true, profile });
});

export const deleteMentorProfile = asyncHandler(async (req, res) => {
  await mentorService.deleteMentorProfile(req.params.id);
  res.status(200).json({ success: true, message: "Mentor profile deleted." });
});

export const buildMentorProfile = asyncHandler(async (req, res) => {
  const result = await mentorService.buildMentorProfile(req.user, req);
  res.status(200).json({ success: true, message: "Profile built successfully.", ...result });
});
