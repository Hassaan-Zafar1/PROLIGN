import express from "express";
import { listUsers, approveMentor, rejectMentor, deleteUser } from "../controllers/adminController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

// Every route here is admin-only.
router.use(protect, restrictTo("admin"));

router.get("/users", listUsers);
router.post("/mentors/:id/approve", approveMentor);
router.post("/mentors/:id/reject", rejectMentor);
router.delete("/users/:id", deleteUser);

export default router;
