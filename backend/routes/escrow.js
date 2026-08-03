import express from "express";
import { protect, restrictTo } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import {
  confirmSessionCompletion as confirmCompletion,
  createDispute as fileDispute,
  getDisputes as listDisputes,
  resolveDispute
} from "../controllers/escrowController.js";

const router = express.Router();

router.use(protect);

router.patch("/sessions/:id/confirm-completion", validateObjectId, confirmCompletion);
router.post("/disputes", fileDispute);
router.get("/disputes", restrictTo("admin"), listDisputes);
router.patch("/disputes/:id/resolve", restrictTo("admin"), validateObjectId, resolveDispute);

export default router;
