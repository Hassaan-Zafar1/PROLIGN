import express from "express";
import AvailabilitySlot from "../models/AvailabilitySlot.js";
import { protect, restrictTo } from "../middleware/auth.js";
import { crudController } from "../utils/crudController.js";

// Mentor availability slots. Reads are open (a mentee browses a mentor's slots
// via ?mentorId=…); writes are mentor/admin only and auto-scoped to the owner.
const c = crudController(AvailabilitySlot, {
  owners: ["mentorId"],
  setOwner: "mentorId",
  immutable: ["mentorId"],
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
