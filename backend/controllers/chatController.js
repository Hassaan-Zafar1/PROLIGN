import ChatMessage from "../models/ChatMessage.js";
import { crudHandlers } from "../services/crudService.js";

// Chatbot message history. Owner-scoped; userId set from the token.
// List one thread via ?conversationId=…
const h = crudHandlers(ChatMessage, {
  owners: ["userId"],
  setOwner: "userId",
  immutable: ["userId"],
  defaultSort: "createdAt",
});

export const listChatMessages = h.list;
export const getChatMessage = h.getOne;
export const createChatMessage = h.create;
export const updateChatMessage = h.update;
export const deleteChatMessage = h.remove;
