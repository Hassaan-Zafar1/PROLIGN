import express from "express";
import { protect, restrictTo } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import {
  getMyWallet,
  requestCashout,
  getCashoutRequests as listCashouts,
  approveCashout,
  rejectCashout
} from "../controllers/walletController.js";

const router = express.Router();

router.use(protect);

router.get("/wallet/me", restrictTo("mentor", "admin"), getMyWallet);
router.post("/cashout/request", restrictTo("mentor"), requestCashout);
router.get("/cashout", restrictTo("admin"), listCashouts);
router.patch("/cashout/:id/approve", restrictTo("admin"), validateObjectId, approveCashout);
router.patch("/cashout/:id/reject", restrictTo("admin"), validateObjectId, rejectCashout);

export default router;
