import express from "express";
import {
  listMentors,
  getMentorById,
  buildMentorProfile,
  getRecommendedMentors,
} from "../controllers/mentorController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

// Authenticated mentor: auto-build structured profile from CV (Task 4).
// Declared before "/:id" so it isn't captured by the param route.
router.post("/profile/build", protect, restrictTo("mentor"), buildMentorProfile);

// Recommendation seam (Task 8) — must precede "/:id".
router.get("/recommended", getRecommendedMentors);

// Public mentor directory — no auth required to browse.
router.get("/", listMentors);
router.get("/:id", getMentorById);

export default router;
