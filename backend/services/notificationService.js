import Notification from "../models/Notification.js";
import { ApiError } from "../middleware/errorHandler.js";

/**
 * User notifications.
 *
 * Frontend usage:
 *   GET    /api/notifications?unread=true   → my notifications (+ unreadCount), newest first
 *   POST   /api/notifications   { type, title, body, data? }   → self (or any user if admin)
 *   PATCH  /api/notifications/read-all       → mark every unread as read
 *   PATCH  /api/notifications/:id  { isRead } → mark one read/unread
 *   DELETE /api/notifications/:id
 */

const parsePage = (q) => {
  const page = Math.max(parseInt(q.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 30, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const ownOr404 = async (id, user) => {
  const n = await Notification.findById(id);
  if (!n) throw new ApiError(404, "Notification not found.");
  if (user.role !== "admin" && String(n.userId) !== String(user._id)) throw new ApiError(403, "Not your notification.");
  return n;
};

export async function listNotifications(query, user) {
  const { page, limit, skip } = parsePage(query);
  const filter = { userId: user._id };
  if (query.unread === "true") filter.isRead = false;
  if (query.type) filter.type = query.type;

  const [data, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: user._id, isRead: false }),
  ]);
  return { data, total, unreadCount, page, pages: Math.ceil(total / limit) || 1 };
}

export async function getNotification(id, user) {
  const n = await ownOr404(id, user);
  return n;
}

export async function createNotification(user, body) {
  const { type, title, body: message } = body;
  if (!type || !title || !message) throw new ApiError(400, "type, title and body are required.");
  // Only admins may target another user; everyone else creates for themselves.
  const userId = user.role === "admin" && body.userId ? body.userId : user._id;
  return Notification.create({ userId, type, title, body: message, data: body.data || {} });
}

export async function updateNotification(id, user, body) {
  const n = await ownOr404(id, user);
  if (body.isRead !== undefined) {
    n.isRead = body.isRead;
    n.readAt = body.isRead ? new Date() : null;
  }
  await n.save();
  return n;
}

export async function markAllRead(user) {
  const result = await Notification.updateMany(
    { userId: user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  return { message: "All notifications marked as read.", modified: result.modifiedCount ?? result.nModified ?? 0 };
}

export async function deleteNotification(id, user) {
  const n = await ownOr404(id, user);
  await n.deleteOne();
  return { message: "Notification deleted." };
}
