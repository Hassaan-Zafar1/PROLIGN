import AvailabilitySlot from "../models/AvailabilitySlot.js";
import { ApiError } from "../middleware/errorHandler.js";
import { cleanupExpiredPendingSessions } from "./sessionService.js";

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
  await cleanupExpiredPendingSessions();
  const { page, limit, skip } = parsePage(query);

  const mentorId = query.mentorId || requester._id;

  // If status is "available", or if date/range is specified, we perform dynamic expansion.
  // Otherwise, return raw templates directly (for mentor's dashboard management view).
  const isBookingView = query.status === "available" || query.date || query.from || query.to;

  if (!isBookingView) {
    const filter = { mentorId };
    const [data, total] = await Promise.all([
      AvailabilitySlot.find(filter).sort({ dayOfWeek: 1, startTime: 1 }).skip(skip).limit(limit).lean(),
      AvailabilitySlot.countDocuments(filter),
    ]);
    return { data, total, page, pages: Math.ceil(total / limit) || 1 };
  }

  // Expanded Booking View
  const fromDate = query.from ? new Date(query.from) : new Date();
  fromDate.setHours(0, 0, 0, 0);
  const toDate = query.to ? new Date(query.to) : new Date(fromDate.getTime() + 60 * 24 * 60 * 60 * 1000);
  toDate.setHours(23, 59, 59, 999);

  // Fetch all recurring templates for the mentor
  const recurringTemplates = await AvailabilitySlot.find({
    mentorId,
    slotType: "recurring",
    date: { $exists: false }
  }).lean();

  // Fetch all concrete overrides/bookings in the requested date range
  const concreteSlots = await AvailabilitySlot.find({
    mentorId,
    date: { $gte: fromDate, $lte: toDate }
  }).lean();

  const concreteMap = new Map();
  concreteSlots.forEach(s => {
    const dStr = new Date(s.date).toISOString().split('T')[0];
    concreteMap.set(`${dStr}_${s.startTime}`, s);
  });

  const allSlots = [];

  // Add all concrete overrides
  concreteSlots.forEach(s => {
    if (!query.status || s.status === query.status) {
      allSlots.push(s);
    }
  });

  // Expand templates for the next 60 days
  const loopDate = new Date(fromDate);
  while (loopDate <= toDate) {
    const dayOfWeek = loopDate.getDay();
    const dStr = loopDate.toISOString().split('T')[0];

    const dayTemplates = recurringTemplates.filter(t => t.dayOfWeek === dayOfWeek);

    dayTemplates.forEach(t => {
      const concreteKey = `${dStr}_${t.startTime}`;
      if (concreteMap.has(concreteKey)) return;

      const virtualSlot = {
        _id: `rec-${t._id}-${dStr}`,
        mentorId: t.mentorId,
        slotType: "recurring",
        dayOfWeek: t.dayOfWeek,
        date: new Date(loopDate),
        startTime: t.startTime,
        endTime: t.endTime,
        timezone: t.timezone,
        status: "available",
      };

      if (!query.status || virtualSlot.status === query.status) {
        allSlots.push(virtualSlot);
      }
    });

    loopDate.setDate(loopDate.getDate() + 1);
  }

  // Sort by date, then startTime
  allSlots.sort((a, b) => {
    const dateDiff = new Date(a.date) - new Date(b.date);
    if (dateDiff !== 0) return dateDiff;
    return a.startTime.localeCompare(b.startTime);
  });

  const paginated = allSlots.slice(skip, skip + limit);
  return {
    data: paginated,
    total: allSlots.length,
    page,
    pages: Math.ceil(allSlots.length / limit) || 1
  };
}

export async function getSlot(id) {
  await cleanupExpiredPendingSessions();
  const slot = await AvailabilitySlot.findById(id).lean();
  if (!slot) throw new ApiError(404, "Availability slot not found.");
  return slot;
}

export async function createSlot(mentorId, body) {
  const { date, startTime, endTime, slotType, dayOfWeek, timezone } = body;

  if (slotType === "recurring") {
    if (dayOfWeek === undefined || !startTime || !endTime) {
      throw new ApiError(400, "dayOfWeek, startTime and endTime are required for recurring templates.");
    }
  } else {
    if (!date || !startTime || !endTime) {
      throw new ApiError(400, "date, startTime and endTime are required for one-off slots.");
    }
  }

  if (String(endTime) <= String(startTime)) {
    throw new ApiError(400, "endTime must be after startTime.");
  }

  try {
    if (slotType === "recurring") {
      return await AvailabilitySlot.create({
        mentorId,
        slotType: "recurring",
        dayOfWeek: parseInt(dayOfWeek, 10),
        startTime,
        endTime,
        ...(timezone && { timezone }),
        status: "available",
      });
    } else {
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) throw new ApiError(400, "Invalid date.");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d < today) throw new ApiError(400, "Cannot create a slot in the past.");

      return await AvailabilitySlot.create({
        mentorId,
        slotType: "one_off",
        date: d,
        startTime,
        endTime,
        ...(timezone && { timezone }),
        status: "available",
      });
    }
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, "You already have a slot configured for this day/time.");
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
