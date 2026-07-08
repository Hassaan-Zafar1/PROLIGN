import express from "express";
import ChatMessage from "../models/ChatMessage.js";
import { protect } from "../middleware/auth.js";
import { crudController } from "../utils/crudController.js";

// Chatbot message history. Owner-scoped; userId auto-set on create.
// List one conversation via ?conversationId=…
const c = crudController(ChatMessage, {
  owners: ["userId"],
  setOwner: "userId",
  immutable: ["userId"],
  defaultSort: "createdAt",
});

const router = express.Router();
router.use(protect);
router.get("/", c.list);
router.get("/:id", c.getOne);
router.post("/", c.create);
router.patch("/:id", c.update);
router.delete("/:id", c.remove);

export default router;
