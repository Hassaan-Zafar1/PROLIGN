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

const combineDateTime = (date, timeStr) => {
  const d = new Date(date);
  const [h, m] = String(timeStr || "00:00").split(":").map(Number);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};

const isParticipant = (session, user) =>
  user.role === "admin" ||
  String(session.menteeId) === String(user._id) ||
  String(session.mentorId) === String(user._id);

const populated = (q) =>
  q.populate("menteeId", "name profilePic email")
   .populate("mentorId", "name profilePic email")
   .populate("slotId", "date startTime endTime timezone status");

// ─── Create (mentee books) ────────────────────────────────────────────────────
export async function createSession(menteeId, body) {
  const { mentorId, slotId, sessionType, agenda, title, durationMinutes } = body;
  if (!mentorId || !slotId || !sessionType) throw new ApiError(400, "mentorId, slotId and sessionType are required.");
  if (String(mentorId) === String(menteeId)) throw new ApiError(400, "You cannot book a session with yourself.");

  const slot = await AvailabilitySlot.findById(slotId);
  if (!slot) throw new ApiError(404, "Availability slot not found.");
  if (String(slot.mentorId) !== String(mentorId)) throw new ApiError(400, "That slot does not belong to this mentor.");

  // Price snapshot from the mentor's profile at booking time.
  const profile = await MentorProfile.findOne({ userId: mentorId }).lean();
  const priceCharged = body.priceCharged ?? profile?.pricePerSession ?? profile?.hourlyRate ?? 0;
  const currency = body.currency || profile?.currency || "PKR";

  // Atomically claim the slot so two mentees can't book it at once.
  const claimed = await AvailabilitySlot.findOneAndUpdate(
    { _id: slotId, status: "available" },
    { $set: { status: "booked", bookedBy: menteeId, bookedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!claimed) throw new ApiError(409, "That slot is no longer available.");

  try {
    const session = await Session.create({
      menteeId,
      mentorId,
      slotId,
      sessionType,
      title: title || null,
      agenda: agenda || null,
      scheduledDate: combineDateTime(slot.date, slot.startTime),
      ...(durationMinutes && { durationMinutes }), // else schema default (60)
      timezone: slot.timezone,
      priceCharged,
      currency,
      status: "pending",
    });
    await AvailabilitySlot.updateOne({ _id: slotId }, { $set: { sessionId: session._id } });
    return populated(Session.findById(session._id));
  } catch (err) {
    // Roll the slot back if the session couldn't be created.
    await AvailabilitySlot.updateOne({ _id: slotId }, { $set: { status: "available", bookedBy: null, bookedAt: null, sessionId: null } });
    if (err.code === 11000) throw new ApiError(409, "This slot has already been booked.");
    throw err;
  }
}

// ─── List (my sessions) ───────────────────────────────────────────────────────
export async function listSessions(query, user) {
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

  const isMentor = String(session.mentorId) === String(user._id) || user.role === "admin";
  const isMentee = String(session.menteeId) === String(user._id) || user.role === "admin";

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
