import express from "express";
import { protect, restrictTo } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import {
  listMenteeProfiles,
  getMenteeProfile,
  createMenteeProfile,
  updateMenteeProfile,
  deleteMenteeProfile,
} from "../controllers/menteeProfileController.js";

const router = express.Router();
router.use(protect);

router.route("/")
  .get(listMenteeProfiles)
  .post(restrictTo("mentee", "admin"), createMenteeProfile);

router.route("/:id")
  .get(validateObjectId, getMenteeProfile)
  .patch(validateObjectId, restrictTo("mentee", "admin"), updateMenteeProfile)
  .delete(validateObjectId, restrictTo("mentee", "admin"), deleteMenteeProfile);

export default router;
