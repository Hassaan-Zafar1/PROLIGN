import Session from "../models/Session.js";
import AvailabilitySlot from "../models/AvailabilitySlot.js";
import MentorProfile from "../models/MentorProfile.js";
import { ApiError } from "../middleware/errorHandler.js";

/**
 * Mentorship sessions — the mentor⇄mentee booking junction.
 *
 * Frontend usage:
 *   POST   /api/sessions   { mentorId, slotId, sessionType, agenda? }  → mentee books an available slot
 *   GET    /api/sessions?as=mentor|mentee&status=&when=upcoming|past    → my sessions (both roles), newest first
 *   GET    /api/sessions/:id                                            → one session (participant only)
 *   PATCH  /api/sessions/:id  { status } | { mentorNotes } | { agenda } → confirm / cancel / complete / notes
 *   DELETE /api/sessions/:id                                            → remove (admin or participant); frees the slot
 */

const parsePage = (q) => {
  const page = Math.max(parseInt(q.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 25, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const combineDateTime = (date, timeStr, timezone) => {
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  
  const localUtc = new Date(`${y}-${m}-${day}T${timeStr || "00:00"}:00.000Z`);
  
  const getTimezoneOffset = (timeZone, dateObj) => {
    try {
      const tz = dateObj.toLocaleString("en-US", { timeZone, timeZoneName: "longOffset" });
      const match = tz.match(/GMT([+-]\d+)(?::(\d+))?/);
      if (!match) return 0;
      const hrs = parseInt(match[1], 10);
      const mins = match[2] ? parseInt(match[2], 10) : 0;
      const sign = hrs < 0 ? -1 : 1;
      return (Math.abs(hrs) * 60 + mins) * sign;
    } catch (e) {
      console.error("Timezone offset parse error:", e);
      return 0;
    }
  };

  const offsetMin = getTimezoneOffset(timezone || "Asia/Karachi", localUtc);
  return new Date(localUtc.getTime() - offsetMin * 60 * 1000);
};

const isParticipant = (session, user) =>
  user.role === "admin" ||
  String(session.menteeId?._id || session.menteeId) === String(user._id) ||
  String(session.mentorId?._id || session.mentorId) === String(user._id);

const populated = (q) =>
  q.populate("menteeId", "name profilePic email")
   .populate("mentorId", "name profilePic email")
   .populate("slotId", "date startTime endTime timezone status")
   .populate("reviewId", "rating reviewText createdAt");

export async function cleanupExpiredPendingSessions() {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const expiredSessions = await Session.find({
    status: "pending",
    createdAt: { $lt: tenMinutesAgo }
  });

  if (expiredSessions.length > 0) {
    const sessionIds = expiredSessions.map(s => s._id);
    const slotIds = expiredSessions.map(s => s.slotId).filter(Boolean);

    if (slotIds.length > 0) {
      await AvailabilitySlot.updateMany(
        { _id: { $in: slotIds } },
        { $set: { status: "available", bookedBy: null, bookedAt: null, sessionId: null } }
      );
    }
    await Session.deleteMany({ _id: { $in: sessionIds } });
  }
}

// ─── Create (mentee books) ────────────────────────────────────────────────────
export async function createSession(menteeId, body) {
  await cleanupExpiredPendingSessions();
  const { mentorId, slotId, sessionType, agenda, title, durationMinutes } = body;
  if (!mentorId || !slotId || !sessionType) throw new ApiError(400, "mentorId, slotId and sessionType are required.");
  if (String(mentorId) === String(menteeId)) throw new ApiError(400, "You cannot book a session with yourself.");

  let slot;
  if (String(slotId).startsWith("rec-")) {
    const parts = String(slotId).split("-");
    const templateId = parts[1];
    const dateStr = parts.slice(2).join("-");
    const template = await AvailabilitySlot.findById(templateId);
    if (!template) throw new ApiError(404, "Availability template slot not found.");

    const parsedDate = new Date(dateStr);
    const existingConcrete = await AvailabilitySlot.findOne({
      mentorId: template.mentorId,
      date: parsedDate,
      startTime: template.startTime
    });

    if (existingConcrete) {
      let isAvailable = existingConcrete.status === "available";
      if (existingConcrete.status === "booked") {
        const activeSession = await Session.findOne({
          slotId: existingConcrete._id,
          status: { $in: ["pending", "confirmed", "scheduled", "in_progress"] }
        });
        if (!activeSession) {
          isAvailable = true; // orphaned slot
        }
      }

      if (!isAvailable) {
        throw new ApiError(409, "That slot is no longer available.");
      }

      existingConcrete.status = "booked";
      existingConcrete.bookedBy = menteeId;
      existingConcrete.bookedAt = new Date();
      await existingConcrete.save();
      slot = existingConcrete;
    } else {
      try {
        slot = await AvailabilitySlot.create({
          mentorId: template.mentorId,
          slotType: "recurring",
          dayOfWeek: template.dayOfWeek,
          date: parsedDate,
          startTime: template.startTime,
          endTime: template.endTime,
          timezone: template.timezone,
          status: "booked",
          bookedBy: menteeId,
          bookedAt: new Date()
        });
      } catch (err) {
        if (err.code === 11000) {
          throw new ApiError(409, "That slot is no longer available.");
        }
        throw err;
      }
    }
  } else {
    const foundSlot = await AvailabilitySlot.findById(slotId);
    if (!foundSlot) throw new ApiError(404, "Availability slot not found.");
    if (String(foundSlot.mentorId) !== String(mentorId)) throw new ApiError(400, "That slot does not belong to this mentor.");

    const claimed = await AvailabilitySlot.findOneAndUpdate(
      { _id: slotId, status: "available" },
      { $set: { status: "booked", bookedBy: menteeId, bookedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!claimed) throw new ApiError(409, "That slot is no longer available.");
    slot = claimed;
  }

  // Price snapshot from the mentor's profile at booking time.
  const profile = await MentorProfile.findOne({ userId: mentorId }).lean();
  const priceCharged = body.priceCharged ?? profile?.pricePerSession ?? profile?.hourlyRate ?? 0;
  const currency = body.currency || profile?.currency || "USD";

  try {
    const session = await Session.create({
      menteeId,
      mentorId,
      slotId: slot._id,
      sessionType,
      title: title || null,
      agenda: agenda || null,
      scheduledDate: combineDateTime(slot.date, slot.startTime, slot.timezone),
      ...(durationMinutes && { durationMinutes }), // else schema default (60)
      timezone: slot.timezone,
      priceCharged,
      currency,
      status: "pending",
    });
    await AvailabilitySlot.updateOne({ _id: slot._id }, { $set: { sessionId: session._id } });
    return populated(Session.findById(session._id));
  } catch (err) {
    if (slot) {
      await AvailabilitySlot.updateOne({ _id: slot._id }, { $set: { status: "available", bookedBy: null, bookedAt: null, sessionId: null } });
    }
    if (err.code === 11000) throw new ApiError(409, "This slot has already been booked.");
    throw err;
  }
}

// ─── List (my sessions) ───────────────────────────────────────────────────────
export async function listSessions(query, user) {
  await cleanupExpiredPendingSessions();
  const { page, limit, skip } = parsePage(query);

  let filter;
  if (user.role === "admin") filter = {};
  else if (query.as === "mentor") filter = { mentorId: user._id };
  else if (query.as === "mentee") filter = { menteeId: user._id };
  else filter = { $or: [{ menteeId: user._id }, { mentorId: user._id }] };

  if (query.status) filter.status = query.status;
  if (query.when === "upcoming") filter.scheduledDate = { $gte: new Date() };
  if (query.when === "past") filter.scheduledDate = { $lt: new Date() };

  const sort = query.when === "upcoming" ? { scheduledDate: 1 } : { scheduledDate: -1 };
  const [data, total] = await Promise.all([
    populated(Session.find(filter).sort(sort).skip(skip).limit(limit)),
    Session.countDocuments(filter),
  ]);
  return { data, total, page, pages: Math.ceil(total / limit) || 1 };
}

export async function getSession(id, user) {
  await cleanupExpiredPendingSessions();
  const session = await populated(Session.findById(id));
  if (!session) throw new ApiError(404, "Session not found.");
  if (!isParticipant(session, user)) throw new ApiError(403, "Not allowed to view this session.");
  return session;
}

// ─── Update (status transitions + notes) ──────────────────────────────────────
export async function updateSession(id, user, body) {
  const session = await Session.findById(id);
  if (!session) throw new ApiError(404, "Session not found.");
  if (!isParticipant(session, user)) throw new ApiError(403, "Not allowed to modify this session.");

  const isMentor = String(session.mentorId?._id || session.mentorId) === String(user._id) || user.role === "admin";
  const isMentee = String(session.menteeId?._id || session.menteeId) === String(user._id) || user.role === "admin";

  if (body.status) {
    await applyStatus(session, body.status, { isMentor, isMentee });
  }
  // Free-text updates by the relevant party.
  if (body.mentorNotes !== undefined && isMentor) session.mentorNotes = body.mentorNotes;
  if (body.agenda !== undefined && isMentee) session.agenda = body.agenda;

  await session.save();
  return populated(Session.findById(session._id));
}

async function applyStatus(session, status, { isMentor, isMentee }) {
  const now = new Date();
  switch (status) {
    case "confirmed":
      if (!isMentor) throw new ApiError(403, "Only the mentor can confirm a session.");
      if (session.status !== "pending") throw new ApiError(409, `Cannot confirm a ${session.status} session.`);
      session.status = "confirmed"; session.confirmedAt = now; break;
    case "in_progress":
      if (!isMentor) throw new ApiError(403, "Only the mentor can start a session.");
      if (!["confirmed", "pending"].includes(session.status)) throw new ApiError(409, `Cannot start a ${session.status} session.`);
      session.status = "in_progress"; session.startedAt = now; break;
    case "completed":
      if (!isMentor) throw new ApiError(403, "Only the mentor can complete a session.");
      if (!["confirmed", "in_progress"].includes(session.status)) throw new ApiError(409, `Cannot complete a ${session.status} session.`);
      session.status = "completed"; session.completedAt = now; break;
    case "cancelled_by_mentee":
      if (!isMentee) throw new ApiError(403, "Only the mentee can cancel on their behalf.");
      await cancel(session, "mentee", now); break;
    case "cancelled_by_mentor":
      if (!isMentor) throw new ApiError(403, "Only the mentor can cancel on their behalf.");
      await cancel(session, "mentor", now); break;
    case "no_show_mentee":
    case "no_show_mentor":
      if (!isMentor) throw new ApiError(403, "Only the mentor/admin can mark a no-show.");
      session.status = status; break;
    default:
      throw new ApiError(400, `Unsupported status transition: ${status}.`);
  }
}

async function cancel(session, by, now) {
  if (["completed", "cancelled_by_mentee", "cancelled_by_mentor"].includes(session.status)) {
    throw new ApiError(409, `Cannot cancel a ${session.status} session.`);
  }
  session.status = by === "mentee" ? "cancelled_by_mentee" : "cancelled_by_mentor";
  session.cancelledAt = now;
  session.cancelledBy = by;
  // Return the slot to the pool.
  if (session.slotId) {
    await AvailabilitySlot.updateOne(
      { _id: session.slotId },
      { $set: { status: "available", bookedBy: null, bookedAt: null, sessionId: null } }
    );
  }
}

export async function deleteSession(id, user) {
  const session = await Session.findById(id);
  if (!session) throw new ApiError(404, "Session not found.");
  if (!isParticipant(session, user)) throw new ApiError(403, "Not allowed to delete this session.");
  if (session.slotId) {
    await AvailabilitySlot.updateOne(
      { _id: session.slotId },
      { $set: { status: "available", bookedBy: null, bookedAt: null, sessionId: null } }
    );
  }
  await session.deleteOne();
  return { message: "Session deleted." };
}
