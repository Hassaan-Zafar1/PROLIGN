import express from "express";
import { protect, restrictTo } from "../middleware/auth.js";
import {
  listMenteeProfiles,
  getMyMenteeProfile,
  updateMyMenteeProfile,
  getMenteeProfile,
  updateMenteeProfile,
  deleteMenteeProfile,
} from "../controllers/menteeProfileController.js";

const router = express.Router();
router.use(protect);

// Profiles are created by the Python AI_interviewer and linked to a user via
// POST /api/interview — there is no create route here.
router.get("/", restrictTo("admin"), listMenteeProfiles);

// Own profile — no id needed (must be declared before "/:id")
router.route("/me")
  .get(getMyMenteeProfile)
  .patch(restrictTo("mentee", "admin"), updateMyMenteeProfile);

// :id is the interview's session_id (a string), NOT a Mongo ObjectId —
// no validateObjectId here.
router.route("/:id")
  .get(getMenteeProfile)
  .patch(restrictTo("mentee", "admin"), updateMenteeProfile)
  .delete(restrictTo("admin"), deleteMenteeProfile);

export { router };
export default router;
