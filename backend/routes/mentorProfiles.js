import express from "express";
import { protect, restrictTo } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import {
  listMentorProfiles,
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

router.route("/:id")
  .get(validateObjectId, getMentorProfile)
  .patch(validateObjectId, restrictTo("mentor", "admin"), updateMentorProfile)
  .delete(validateObjectId, restrictTo("mentor", "admin"), deleteMentorProfile);

export default router;
