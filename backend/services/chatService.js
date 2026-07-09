import ChatMessage from "../models/ChatMessage.js";
import { ApiError } from "../middleware/errorHandler.js";

/**
 * Chatbot message history (owner-scoped).
 *
 * Frontend usage:
 *   GET    /api/chat?conversationId=<uuid>   → one conversation in order (oldest→newest)
 *   GET    /api/chat                         → all my messages, newest first
 *   POST   /api/chat   { conversationId, role, content }   → append a message
 *   PATCH  /api/chat/:id  { content }        → edit my message
 *   DELETE /api/chat/:id
 */

const parsePage = (q) => {
  const page = Math.max(parseInt(q.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 100, 1), 200);
  return { page, limit, skip: (page - 1) * limit };
};

const ownOr404 = async (id, user) => {
  const msg = await ChatMessage.findById(id);
  if (!msg) throw new ApiError(404, "Message not found.");
  if (user.role !== "admin" && String(msg.userId) !== String(user._id)) throw new ApiError(403, "Not your message.");
  return msg;
};

export async function listMessages(query, user) {
  const { page, limit, skip } = parsePage(query);
  const filter = { userId: user._id };
  if (query.conversationId) filter.conversationId = query.conversationId;

  // Within a conversation, read oldest→newest; across all, newest first.
  const sort = query.conversationId ? { createdAt: 1 } : { createdAt: -1 };
  const [data, total] = await Promise.all([
    ChatMessage.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    ChatMessage.countDocuments(filter),
  ]);
  return { data, total, page, pages: Math.ceil(total / limit) || 1 };
}

export async function getMessage(id, user) {
  return ownOr404(id, user);
}

export async function createMessage(userId, body) {
  const { conversationId, role, content } = body;
  if (!conversationId || !role || !content) throw new ApiError(400, "conversationId, role and content are required.");
  if (!["user", "assistant"].includes(role)) throw new ApiError(400, "role must be 'user' or 'assistant'.");
  return ChatMessage.create({ userId, conversationId, role, content, ...(body.modelUsed && { modelUsed: body.modelUsed }) });
}

export async function updateMessage(id, user, body) {
  const msg = await ownOr404(id, user);
  if (body.content !== undefined) msg.content = body.content;
  await msg.save();
  return msg;
}

export async function deleteMessage(id, user) {
  const msg = await ownOr404(id, user);
  await msg.deleteOne();
  return { message: "Message deleted." };
}
