import * as menteeProfileService from "../services/menteeProfileService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listMenteeProfiles = asyncHandler(async (req, res) => {
  const { data, total, page, pages } = await menteeProfileService.listProfiles(req.query, req.user);
  res.status(200).json({ success: true, count: data.length, total, page, pages, data });
});

export const getMyMenteeProfile = asyncHandler(async (req, res) => {
  const profile = await menteeProfileService.getMyProfile(req.user);
  res.status(200).json({ success: true, data: profile });
});

export const updateMyMenteeProfile = asyncHandler(async (req, res) => {
  const profile = await menteeProfileService.updateMyProfile(req.user, req.body);
  res.status(200).json({ success: true, message: "Profile updated.", data: profile });
});

export const getMenteeProfile = asyncHandler(async (req, res) => {
  const profile = await menteeProfileService.getProfile(req.params.id, req.user);
  res.status(200).json({ success: true, data: profile });
});

export const updateMenteeProfile = asyncHandler(async (req, res) => {
  const profile = await menteeProfileService.updateProfile(req.params.id, req.user, req.body);
  res.status(200).json({ success: true, message: "Profile updated.", data: profile });
});

export const deleteMenteeProfile = asyncHandler(async (req, res) => {
  const result = await menteeProfileService.deleteProfile(req.params.id, req.user);
  res.status(200).json({ success: true, ...result });
});
