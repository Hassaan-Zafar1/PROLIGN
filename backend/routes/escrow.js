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

// protect is applied per-route (not via router.use) because this router is
// mounted at the bare /api prefix (server.js) to get flat URLs like
// /api/sessions/:id/confirm-completion. A router-level router.use(protect)
// would run for ANY request reaching this router, even ones matching no route
// defined here — which previously 401'd requests meant for other /api/*
// routers, and still turns a truly unmatched /api/* path into a 401 instead of
// the correct 404 from the app's final notFound handler.
router.patch("/sessions/:id/confirm-completion", protect, validateObjectId, confirmCompletion);
router.post("/disputes", protect, fileDispute);
router.get("/disputes", protect, restrictTo("admin"), listDisputes);
router.patch("/disputes/:id/resolve", protect, restrictTo("admin"), validateObjectId, resolveDispute);

export default router;
