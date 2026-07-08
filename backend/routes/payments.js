import express from "express";
import { protect } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import {
  listPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
} from "../controllers/paymentController.js";

const router = express.Router();
router.use(protect);

router.route("/")
  .get(listPayments)
  .post(createPayment);

router.route("/:id")
  .get(validateObjectId, getPayment)
  .patch(validateObjectId, updatePayment)
  .delete(validateObjectId, deletePayment);

export default router;
