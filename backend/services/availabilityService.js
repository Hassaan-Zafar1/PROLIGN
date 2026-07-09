import AvailabilitySlot from "../models/AvailabilitySlot.js";
import { ApiError } from "../middleware/errorHandler.js";

/**
 * Mentor availability slots.
 *
 * Frontend usage:
 *   GET    /api/availability?mentorId=<id>&status=available&from=&to=   → browse a mentor's slots
 *   GET    /api/availability                                            → the logged-in mentor's own slots
 *   POST   /api/availability   { date, startTime, endTime, timezone? }  → mentor creates a slot
 *   PATCH  /api/availability/:id                                        → edit (blocked once booked)
 *   DELETE /api/availability/:id                                        → remove (blocked once booked)
 */

const parsePage = (q) => {
  const page = Math.max(parseInt(q.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 50, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

export async function listSlots(query, requester) {
  const { page, limit, skip } = parsePage(query);

  const filter = {};
  // Browse a specific mentor's slots (?mentorId), else default to your own.
  filter.mentorId = query.mentorId || requester._id;
  if (query.status) filter.status = query.status;
  if (query.date) filter.date = new Date(query.date);
  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = new Date(query.from);
    if (query.to) filter.date.$lte = new Date(query.to);
  }

  const [data, total] = await Promise.all([
    AvailabilitySlot.find(filter).sort({ date: 1, startTime: 1 }).skip(skip).limit(limit).lean(),
    AvailabilitySlot.countDocuments(filter),
  ]);
  return { data, total, page, pages: Math.ceil(total / limit) || 1 };
}

export async function getSlot(id) {
  const slot = await AvailabilitySlot.findById(id).lean();
  if (!slot) throw new ApiError(404, "Availability slot not found.");
  return slot;
}

export async function createSlot(mentorId, body) {
  const { date, startTime, endTime, slotType, dayOfWeek, timezone } = body;
  if (!date || !startTime || !endTime) throw new ApiError(400, "date, startTime and endTime are required.");

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) throw new ApiError(400, "Invalid date.");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d < today) throw new ApiError(400, "Cannot create a slot in the past.");
  if (String(endTime) <= String(startTime)) throw new ApiError(400, "endTime must be after startTime.");

  try {
    return await AvailabilitySlot.create({
      mentorId,
      date: d,
      startTime,
      endTime,
      slotType: slotType || "one_off",
      ...(dayOfWeek !== undefined && { dayOfWeek }),
      ...(timezone && { timezone }),
      status: "available",
    });
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, "You already have a slot at this date and start time.");
    throw err;
  }
}

export async function updateSlot(id, requester, body) {
  const slot = await AvailabilitySlot.findById(id);
  if (!slot) throw new ApiError(404, "Availability slot not found.");
  const isAdmin = requester.role === "admin";
  if (!isAdmin && String(slot.mentorId) !== String(requester._id)) throw new ApiError(403, "Not your slot.");
  if (slot.status === "booked") throw new ApiError(409, "This slot is booked — cancel the session before editing it.");

  const editable = ["date", "startTime", "endTime", "slotType", "dayOfWeek", "timezone", "status", "blockedReason"];
  editable.forEach((f) => { if (body[f] !== undefined) slot[f] = body[f]; });
  if (String(slot.endTime) <= String(slot.startTime)) throw new ApiError(400, "endTime must be after startTime.");

  await slot.save();
  return slot;
}

export async function deleteSlot(id, requester) {
  const slot = await AvailabilitySlot.findById(id);
  if (!slot) throw new ApiError(404, "Availability slot not found.");
  const isAdmin = requester.role === "admin";
  if (!isAdmin && String(slot.mentorId) !== String(requester._id)) throw new ApiError(403, "Not your slot.");
  if (slot.status === "booked") throw new ApiError(409, "This slot is booked — cancel the session first.");

  await slot.deleteOne();
  return { message: "Availability slot deleted." };
}
