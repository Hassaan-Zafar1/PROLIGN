import * as availabilityService from "../services/availabilityService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listAvailability = asyncHandler(async (req, res) => {
  const { data, total, page, pages } = await availabilityService.listSlots(req.query, req.user);
  res.status(200).json({ success: true, count: data.length, total, page, pages, data });
});

export const getAvailability = asyncHandler(async (req, res) => {
  const slot = await availabilityService.getSlot(req.params.id);
  res.status(200).json({ success: true, data: slot });
});

export const createAvailability = asyncHandler(async (req, res) => {
  const slot = await availabilityService.createSlot(req.user._id, req.body);
  res.status(201).json({ success: true, message: "Availability slot created.", data: slot });
});

export const updateAvailability = asyncHandler(async (req, res) => {
  const slot = await availabilityService.updateSlot(req.params.id, req.user, req.body);
  res.status(200).json({ success: true, message: "Availability slot updated.", data: slot });
});

export const deleteAvailability = asyncHandler(async (req, res) => {
  const result = await availabilityService.deleteSlot(req.params.id, req.user);
  res.status(200).json({ success: true, ...result });
});
