import Review from "../models/Review.js";
import Session from "../models/Session.js";
import { ApiError } from "../middleware/errorHandler.js";

/**
 * Session reviews.
 *
 * Frontend usage:
 *   POST   /api/reviews   { sessionId, rating, reviewText?, subRatings?, isAnonymous? }
 *          → mentee reviews a COMPLETED session they attended (one review per session).
 *   GET    /api/reviews?mentorId=<id>       → a mentor's public (visible) reviews, newest first
 *   GET    /api/reviews?mine=true           → my own reviews
 *   GET    /api/reviews/:id
 *   PATCH  /api/reviews/:id   { rating, reviewText }         (author)
 *                            | { mentorReply }               (the reviewed mentor)
 *                            | { isVisible, flagged, flagReason }  (admin moderation)
 *   DELETE /api/reviews/:id   (author or admin)
 */

const parsePage = (q) => {
  const page = Math.max(parseInt(q.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

// Hide the reviewer's identity on anonymous reviews.
const shape = (r) => {
  const o = typeof r.toObject === "function" ? r.toObject() : r;
  if (o.isAnonymous) o.menteeId = null;
  return o;
};

export async function createReview(menteeId, body) {
  const { sessionId, rating } = body;
  if (!sessionId || rating == null) throw new ApiError(400, "sessionId and rating are required.");
  if (rating < 1 || rating > 5) throw new ApiError(400, "rating must be between 1 and 5.");

  const session = await Session.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found.");
  if (String(session.menteeId) !== String(menteeId)) throw new ApiError(403, "You can only review your own sessions.");
  
  const now = new Date();
  const sessionDate = new Date(session.scheduledDate);
  const isPast = sessionDate && sessionDate.getTime() < now.getTime();
  if (session.status !== "completed" && !isPast) {
    throw new ApiError(409, "You can only review a completed session.");
  }

  try {
    const review = await Review.create({
      sessionId,
      mentorId: session.mentorId,
      menteeId,
      rating,
      subRatings: body.subRatings || {},
      reviewText: body.reviewText || null,
      isAnonymous: !!body.isAnonymous,
    });
    await Session.updateOne({ _id: sessionId }, { $set: { reviewId: review._id, status: "completed" } });
    return review; // post-save hook has updated the mentor's rating stats
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, "You have already reviewed this session.");
    throw err;
  }
}

export async function listReviews(query, user) {
  const { page, limit, skip } = parsePage(query);

  let filter;
  if (query.mine === "true") filter = { menteeId: user._id };
  else if (query.mentorId) filter = { mentorId: query.mentorId, isVisible: true, flagged: false };
  else if (user.role === "admin") filter = {}; // admin can browse everything (incl. flagged)
  else filter = { menteeId: user._id };

  const [rows, total] = await Promise.all([
    Review.find(filter).populate("menteeId", "name profilePic").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Review.countDocuments(filter),
  ]);
  return { data: rows.map(shape), total, page, pages: Math.ceil(total / limit) || 1 };
}

export async function getReview(id) {
  const review = await Review.findById(id).populate("menteeId", "name profilePic");
  if (!review) throw new ApiError(404, "Review not found.");
  return shape(review);
}

export async function updateReview(id, user, body) {
  const review = await Review.findById(id);
  if (!review) throw new ApiError(404, "Review not found.");

  const isAuthor = String(review.menteeId) === String(user._id);
  const isMentor = String(review.mentorId) === String(user._id);
  const isAdmin = user.role === "admin";

  // Author edits their rating / text.
  if (body.rating !== undefined || body.reviewText !== undefined || body.subRatings !== undefined) {
    if (!isAuthor && !isAdmin) throw new ApiError(403, "Only the author can edit this review.");
    if (body.rating !== undefined) {
      if (body.rating < 1 || body.rating > 5) throw new ApiError(400, "rating must be between 1 and 5.");
      review.rating = body.rating;
    }
    if (body.reviewText !== undefined) review.reviewText = body.reviewText;
    if (body.subRatings !== undefined) review.subRatings = body.subRatings;
  }

  // Reviewed mentor posts a public reply.
  if (body.mentorReply !== undefined) {
    if (!isMentor && !isAdmin) throw new ApiError(403, "Only the reviewed mentor can reply.");
    review.mentorReply = { text: body.mentorReply, repliedAt: new Date() };
  }

  // Admin moderation.
  if (body.isVisible !== undefined || body.flagged !== undefined || body.flagReason !== undefined) {
    if (!isAdmin) throw new ApiError(403, "Only an admin can moderate reviews.");
    if (body.isVisible !== undefined) review.isVisible = body.isVisible;
    if (body.flagged !== undefined) review.flagged = body.flagged;
    if (body.flagReason !== undefined) review.flagReason = body.flagReason;
    review.moderatedBy = user._id;
    review.moderatedAt = new Date();
  }

  await review.save();
  return shape(review);
}

export async function deleteReview(id, user) {
  const review = await Review.findById(id);
  if (!review) throw new ApiError(404, "Review not found.");
  if (String(review.menteeId) !== String(user._id) && user.role !== "admin") {
    throw new ApiError(403, "Only the author or an admin can delete this review.");
  }
  await Session.updateOne({ _id: review.sessionId }, { $set: { reviewId: null } });
  await review.deleteOne();
  return { message: "Review deleted." };
}
