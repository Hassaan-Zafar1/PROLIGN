import express from "express";
import Review from "../models/Review.js";
import { protect } from "../middleware/auth.js";
import { crudController } from "../utils/crudController.js";

// Session reviews. Reads are open (browse a mentor's reviews via ?mentorId=…);
// the mentee author is auto-set on create. A Review save also updates the
// mentor's denormalized rating stats (post-save hook on the model).
const c = crudController(Review, {
  owners: ["menteeId", "mentorId"],
  setOwner: "menteeId",
  immutable: ["menteeId"],
  publicRead: true,
});

const router = express.Router();
router.use(protect);
router.get("/", c.list);
router.get("/:id", c.getOne);
router.post("/", c.create);
router.patch("/:id", c.update);
router.delete("/:id", c.remove);

export default router;
