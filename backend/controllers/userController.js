import * as userService from "../services/userService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body, req);
  res.status(200).json({ success: true, message: "Profile updated successfully.", user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { message } = await userService.changePassword(req.user._id, req.body, req);
  res.status(200).json({ success: true, message });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const { message } = await userService.deleteAccount(req.user._id);
  res.clearCookie("refreshToken");
  res.status(200).json({ success: true, message });
});
