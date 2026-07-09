import express from "express";
import { protect } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import {
  listNotifications,
  getNotification,
  createNotification,
  markAllRead,
  updateNotification,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();
router.use(protect);

router.route("/")
  .get(listNotifications)
  .post(createNotification);

// Bulk mark-as-read (must be declared before "/:id")
router.patch("/read-all", markAllRead);

router.route("/:id")
  .get(validateObjectId, getNotification)
  .patch(validateObjectId, updateNotification)
  .delete(validateObjectId, deleteNotification);

export default router;
