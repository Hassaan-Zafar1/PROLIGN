import express from "express";
import { protect, restrictTo } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import {
  listAvailability,
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
} from "../controllers/availabilityController.js";

const router = express.Router();
router.use(protect);

router.route("/")
  .get(listAvailability)
  .post(restrictTo("mentor", "admin"), createAvailability);

router.route("/:id")
  .get(validateObjectId, getAvailability)
  .patch(validateObjectId, restrictTo("mentor", "admin"), updateAvailability)
  .delete(validateObjectId, restrictTo("mentor", "admin"), deleteAvailability);

export default router;
