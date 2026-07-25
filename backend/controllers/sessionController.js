import * as sessionService from "../services/sessionService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listSessions = asyncHandler(async (req, res) => {
  const { data, total, page, pages } = await sessionService.listSessions(req.query, req.user);
  res.status(200).json({ success: true, count: data.length, total, page, pages, data });
});

export const getSession = asyncHandler(async (req, res) => {
  const session = await sessionService.getSession(req.params.id, req.user);
  res.status(200).json({ success: true, data: session });
});

export const createSession = asyncHandler(async (req, res) => {
  const session = await sessionService.createSession(req.user._id, req.body);
  res.status(201).json({ success: true, message: "Session booked.", data: session });
});

export const updateSession = asyncHandler(async (req, res) => {
  const session = await sessionService.updateSession(req.params.id, req.user, req.body);
  res.status(200).json({ success: true, message: "Session updated.", data: session });
});

export const deleteSession = asyncHandler(async (req, res) => {
  const result = await sessionService.deleteSession(req.params.id, req.user);
  res.status(200).json({ success: true, ...result });
});
