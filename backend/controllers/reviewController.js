import Review from "../models/Review.js";
import { crudHandlers } from "../services/crudService.js";

// Session reviews. Reads open (browse a mentor's reviews via ?mentorId=…);
// author (menteeId) set from the token. Creating a review also updates the
// mentor's denormalized rating stats (post-save hook on the model).
const h = crudHandlers(Review, {
  owners: ["menteeId", "mentorId"],
  setOwner: "menteeId",
  immutable: ["menteeId"],
  publicRead: true,
});

export const listReviews = h.list;
export const getReview = h.getOne;
export const createReview = h.create;
export const updateReview = h.update;
export const deleteReview = h.remove;
