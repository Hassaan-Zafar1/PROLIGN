import express from "express";
import { protect } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import {
  listPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  createPaymentIntent,
  handleWebhook,
} from "../controllers/paymentController.js";

const router = express.Router();

// ── Webhook: Needs to be raw and public (NO protect middleware) ──
router.post("/webhook", handleWebhook);

// Protected routes
router.use(protect);

router.post("/create-intent", createPaymentIntent);

router.route("/")
  .get(listPayments)
  .post(createPayment);

router.route("/:id")
  .get(validateObjectId, getPayment)
  .patch(validateObjectId, updatePayment)
  .delete(validateObjectId, deletePayment);

export default router;
