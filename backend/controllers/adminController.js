import * as adminService from "../services/adminService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listUsers = asyncHandler(async (req, res) => {
  const { users } = await adminService.listUsers(req.query);
  res.status(200).json({ success: true, users });
});

export const approveMentor = asyncHandler(async (req, res) => {
  const { mentorProfile } = await adminService.approveMentor(req.user, req.params.id, req);
  res.status(200).json({ success: true, message: "Mentor approved.", mentorProfile });
});

export const rejectMentor = asyncHandler(async (req, res) => {
  const { mentorProfile } = await adminService.rejectMentor(req.user, req.params.id, req.body?.reason, req);
  res.status(200).json({ success: true, message: "Mentor rejected.", mentorProfile });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { message } = await adminService.deleteUser(req.user, req.params.id, req);
  res.status(200).json({ success: true, message });
});
