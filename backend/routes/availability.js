import express from "express";
import { protect, optionalAuth, restrictTo } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import {
  listAvailability,
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
} from "../controllers/availabilityController.js";

const router = express.Router();

// Reads are public (browsing a mentor's slots via ?mentorId= needs no login;
// optionalAuth still attaches req.user when present, for a mentor's own
// dashboard management view). Writes require a real session.
router.route("/")
  .get(optionalAuth, listAvailability)
  .post(protect, restrictTo("mentor", "admin"), createAvailability);

router.route("/:id")
  .get(validateObjectId, optionalAuth, getAvailability)
  .patch(validateObjectId, protect, restrictTo("mentor", "admin"), updateAvailability)
  .delete(validateObjectId, protect, restrictTo("mentor", "admin"), deleteAvailability);

export default router;
