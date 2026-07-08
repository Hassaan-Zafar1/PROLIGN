import express from "express";
import MenteeProfile from "../models/MenteeProfile.js";
import { protect, restrictTo } from "../middleware/auth.js";
import { crudController } from "../utils/crudController.js";

// Rich mentee profile (interview answers, skillProfile + AI-matching `cleaned.*`).
// Owner-scoped/private; writes are mentee/admin only, one per user (unique
// userId → duplicate create returns 409). userId auto-set on create.
const c = crudController(MenteeProfile, {
  owners: ["userId"],
  setOwner: "userId",
  immutable: ["userId"],
});

const router = express.Router();
router.use(protect);
router.get("/", c.list);
router.get("/:id", c.getOne);
router.post("/", restrictTo("mentee", "admin"), c.create);
router.patch("/:id", restrictTo("mentee", "admin"), c.update);
router.delete("/:id", restrictTo("mentee", "admin"), c.remove);

export default router;
