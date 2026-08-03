import express from "express";
import { protect, optionalAuth } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import {
  listReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";

const router = express.Router();

// Reads are public (browsing a mentor's reviews via ?mentorId= needs no login;
// optionalAuth still attaches req.user when present, for ?mine= / admin-all).
// Writes require a real session.
router.route("/")
  .get(optionalAuth, listReviews)
  .post(protect, createReview);

router.route("/:id")
  .get(validateObjectId, optionalAuth, getReview)
  .patch(validateObjectId, protect, updateReview)
  .delete(validateObjectId, protect, deleteReview);

export default router;
