import express from "express";
import MentorProfile from "../models/MentorProfile.js";
import { protect, restrictTo } from "../middleware/auth.js";
import { crudController } from "../utils/crudController.js";

// Rich mentor profile (skills/domains/ratings + AI-matching `cleaned.*`).
// Reads open (browse/matching); writes are mentor/admin only, one per user
// (unique userId → duplicate create returns 409). userId auto-set on create.
const c = crudController(MentorProfile, {
  owners: ["userId"],
  setOwner: "userId",
  immutable: ["userId"],
  publicRead: true,
});

const router = express.Router();
router.use(protect);
router.get("/", c.list);
router.get("/:id", c.getOne);
router.post("/", restrictTo("mentor", "admin"), c.create);
router.patch("/:id", restrictTo("mentor", "admin"), c.update);
router.delete("/:id", restrictTo("mentor", "admin"), c.remove);

export default router;
