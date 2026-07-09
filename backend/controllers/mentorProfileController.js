import * as mentorProfileService from "../services/mentorProfileService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listMentorProfiles = asyncHandler(async (req, res) => {
  const { data, total, page, pages } = await mentorProfileService.listProfiles(req.query, req.user);
  res.status(200).json({ success: true, count: data.length, total, page, pages, data });
});

export const getMyMentorProfile = asyncHandler(async (req, res) => {
  const profile = await mentorProfileService.getMyProfile(req.user);
  res.status(200).json({ success: true, data: profile });
});

export const updateMyMentorProfile = asyncHandler(async (req, res) => {
  const profile = await mentorProfileService.updateMyProfile(req.user, req.body);
  res.status(200).json({ success: true, message: "Profile updated.", data: profile });
});

export const getMentorProfile = asyncHandler(async (req, res) => {
  const profile = await mentorProfileService.getProfile(req.params.id, req.user);
  res.status(200).json({ success: true, data: profile });
});

export const createMentorProfile = asyncHandler(async (req, res) => {
  const profile = await mentorProfileService.createProfile(req.user, req.body);
  res.status(201).json({ success: true, message: "Mentor profile created.", data: profile });
});

export const updateMentorProfile = asyncHandler(async (req, res) => {
  const profile = await mentorProfileService.updateProfile(req.params.id, req.user, req.body);
  res.status(200).json({ success: true, message: "Profile updated.", data: profile });
});

export const deleteMentorProfile = asyncHandler(async (req, res) => {
  const result = await mentorProfileService.deleteProfile(req.params.id, req.user);
  res.status(200).json({ success: true, ...result });
});
