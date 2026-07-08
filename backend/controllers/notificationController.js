import Notification from "../models/Notification.js";
import { crudHandlers } from "../services/crudService.js";

// A user's notifications. Owner-scoped; recipient (userId) set from the token.
// Mark-as-read is a normal update: PATCH /:id { "isRead": true }.
const h = crudHandlers(Notification, {
  owners: ["userId"],
  setOwner: "userId",
  immutable: ["userId"],
});

export const listNotifications = h.list;
export const getNotification = h.getOne;
export const createNotification = h.create;
export const updateNotification = h.update;
export const deleteNotification = h.remove;
