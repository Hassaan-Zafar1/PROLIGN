import express from "express";
import { changePassword, updateProfile, deleteAccount } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.patch("/profile", protect, updateProfile);
router.post("/change-password", protect, changePassword);
router.delete("/account", protect, deleteAccount);


export default router;