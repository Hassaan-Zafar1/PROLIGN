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

// protect is applied per-route (not via router.use) — see routes/escrow.js
// for why: this router is also mounted at the bare /api prefix, and a
// router-level router.use(protect) would intercept ANY request reaching this
// router, including ones meant for other /api/* routers.
router.get("/wallet/me", protect, restrictTo("mentor", "admin"), getMyWallet);
router.post("/cashout/request", protect, restrictTo("mentor"), requestCashout);
router.get("/cashout", protect, restrictTo("admin"), listCashouts);
router.patch("/cashout/:id/approve", protect, restrictTo("admin"), validateObjectId, approveCashout);
router.patch("/cashout/:id/reject", protect, restrictTo("admin"), validateObjectId, rejectCashout);

export default router;
