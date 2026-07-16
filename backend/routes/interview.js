import express from "express";
import {
  submitInterview,
  getInterview,
  completeInterview,
} from "../controllers/interviewController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, restrictTo("mentee"), getInterview);
router.post("/", protect, restrictTo("mentee"), submitInterview);

// New: sync completed AI interview profile into Node
router.post("/complete-ai", protect, restrictTo("mentee"), completeInterview);

export default router;