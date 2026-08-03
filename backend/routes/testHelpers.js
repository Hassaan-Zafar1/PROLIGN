import express from "express";
import { getLastOtp, seedMenteeProfile, seedAdmin } from "../controllers/testHelperController.js";

// Dev/test-only — this router is only mounted when env.NODE_ENV !== "production"
// (see server.js). Never reachable in a production deployment.
const router = express.Router();

router.get("/last-otp/:userId", getLastOtp);
router.post("/seed-mentee-profile", seedMenteeProfile);
router.post("/seed-admin", seedAdmin);

export default router;
