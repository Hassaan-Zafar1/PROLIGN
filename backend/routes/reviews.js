import express from "express";
import { protect } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import {
  listReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";

const router = express.Router();
router.use(protect);

router.route("/")
  .get(listReviews)
  .post(createReview);

router.route("/:id")
  .get(validateObjectId, getReview)
  .patch(validateObjectId, updateReview)
  .delete(validateObjectId, deleteReview);

export default router;
