import express from "express";
import Session from "../models/Session.js";
import { protect } from "../middleware/auth.js";
import { crudController } from "../utils/crudController.js";

// Mentorship sessions (the mentor⇄mentee booking junction). A user sees only
// sessions they're part of (as mentee or mentor); admin sees all. Create as the
// mentee — menteeId is auto-set from the token.
const c = crudController(Session, {
  owners: ["menteeId", "mentorId"],
  setOwner: "menteeId",
  immutable: ["menteeId"],
});

const router = express.Router();
router.use(protect);
router.get("/", c.list);
router.get("/:id", c.getOne);
router.post("/", c.create);
router.patch("/:id", c.update);
router.delete("/:id", c.remove);

export default router;
