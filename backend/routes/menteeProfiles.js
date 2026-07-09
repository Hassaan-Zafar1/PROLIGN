import express from "express";
import { protect, restrictTo } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import {
  listMenteeProfiles,
  getMyMenteeProfile,
  updateMyMenteeProfile,
  getMenteeProfile,
  createMenteeProfile,
  updateMenteeProfile,
  deleteMenteeProfile,
} from "../controllers/menteeProfileController.js";

const router = express.Router();
router.use(protect);

router.route("/")
  .get(restrictTo("admin"), listMenteeProfiles)
  .post(restrictTo("mentee", "admin"), createMenteeProfile);

// Own profile — no id needed (must be declared before "/:id")
router.route("/me")
  .get(getMyMenteeProfile)
  .patch(restrictTo("mentee", "admin"), updateMyMenteeProfile);

router.route("/:id")
  .get(validateObjectId, getMenteeProfile)
  .patch(validateObjectId, restrictTo("mentee", "admin"), updateMenteeProfile)
  .delete(validateObjectId, restrictTo("admin"), deleteMenteeProfile);

export default router;
