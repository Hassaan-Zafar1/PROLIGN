import express from "express";
import Notification from "../models/Notification.js";
import { protect } from "../middleware/auth.js";
import { crudController } from "../utils/crudController.js";

// A user's notifications. Owner-scoped; recipient (userId) auto-set on create.
// Mark-as-read is a normal update: PATCH /:id  { "isRead": true }.
const c = crudController(Notification, {
  owners: ["userId"],
  setOwner: "userId",
  immutable: ["userId"],
});

const router = express.Router();
router.use(protect);
router.get("/", c.list);
router.get("/:id", c.getOne);
router.post("/", c.create);
router.patch("/:id", c.update);
router.delete("/:id", c.remove);

export default router;
