import express from "express";
import Payment from "../models/Payment.js";
import { protect } from "../middleware/auth.js";
import { crudController } from "../utils/crudController.js";

// Payments for sessions. Scoped to the mentee/mentor on the payment; admin sees
// all. (Amounts/ids are supplied in the body for now — the Stripe integration
// will create these server-side later.)
const c = crudController(Payment, {
  owners: ["menteeId", "mentorId"],
});

const router = express.Router();
router.use(protect);
router.get("/", c.list);
router.get("/:id", c.getOne);
router.post("/", c.create);
router.patch("/:id", c.update);
router.delete("/:id", c.remove);

export default router;
