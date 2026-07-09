import express from "express";
import { protect, restrictTo } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import {
  listMentorProfiles,
  getMyMentorProfile,
  updateMyMentorProfile,
  getMentorProfile,
  createMentorProfile,
  updateMentorProfile,
  deleteMentorProfile,
} from "../controllers/mentorProfileController.js";

const router = express.Router();
router.use(protect);

router.route("/")
  .get(listMentorProfiles)
  .post(restrictTo("mentor", "admin"), createMentorProfile);

// Own profile — no id needed (must be declared before "/:id")
router.route("/me")
  .get(getMyMentorProfile)
  .patch(restrictTo("mentor", "admin"), updateMyMentorProfile);

router.route("/:id")
  .get(validateObjectId, getMentorProfile)
  .patch(validateObjectId, restrictTo("mentor", "admin"), updateMentorProfile)
  .delete(validateObjectId, restrictTo("admin"), deleteMentorProfile);

export default router;
