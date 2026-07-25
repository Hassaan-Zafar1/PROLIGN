import * as notificationService from "../services/notificationService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const { data, total, unreadCount, page, pages } = await notificationService.listNotifications(req.query, req.user);
  res.status(200).json({ success: true, count: data.length, total, unreadCount, page, pages, data });
});

export const getNotification = asyncHandler(async (req, res) => {
  const n = await notificationService.getNotification(req.params.id, req.user);
  res.status(200).json({ success: true, data: n });
});

export const createNotification = asyncHandler(async (req, res) => {
  const n = await notificationService.createNotification(req.user, req.body);
  res.status(201).json({ success: true, message: "Notification created.", data: n });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllRead(req.user);
  res.status(200).json({ success: true, ...result });
});

export const updateNotification = asyncHandler(async (req, res) => {
  const n = await notificationService.updateNotification(req.params.id, req.user, req.body);
  res.status(200).json({ success: true, message: "Notification updated.", data: n });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteNotification(req.params.id, req.user);
  res.status(200).json({ success: true, ...result });
});
