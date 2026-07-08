import express from "express";
import { protect } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import {
  listChatMessages,
  getChatMessage,
  createChatMessage,
  updateChatMessage,
  deleteChatMessage,
} from "../controllers/chatController.js";

const router = express.Router();
router.use(protect);

router.route("/")
  .get(listChatMessages)
  .post(createChatMessage);

router.route("/:id")
  .get(validateObjectId, getChatMessage)
  .patch(validateObjectId, updateChatMessage)
  .delete(validateObjectId, deleteChatMessage);

export default router;
