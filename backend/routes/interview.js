import express from "express";
import { submitInterview, getInterview } from "../controllers/interviewController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

// Mentee onboarding interview (Task 7). Mentee-only.
router.get("/", protect, restrictTo("mentee"), getInterview);
router.post("/", protect, restrictTo("mentee"), submitInterview);

export default router;
