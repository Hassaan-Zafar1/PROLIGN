import * as chatService from "../services/chatService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listChatMessages = asyncHandler(async (req, res) => {
  const { data, total, page, pages } = await chatService.listMessages(req.query, req.user);
  res.status(200).json({ success: true, count: data.length, total, page, pages, data });
});

export const getChatMessage = asyncHandler(async (req, res) => {
  const msg = await chatService.getMessage(req.params.id, req.user);
  res.status(200).json({ success: true, data: msg });
});

export const createChatMessage = asyncHandler(async (req, res) => {
  const msg = await chatService.createMessage(req.user._id, req.body);
  res.status(201).json({ success: true, message: "Message saved.", data: msg });
});

export const updateChatMessage = asyncHandler(async (req, res) => {
  const msg = await chatService.updateMessage(req.params.id, req.user, req.body);
  res.status(200).json({ success: true, message: "Message updated.", data: msg });
});

export const deleteChatMessage = asyncHandler(async (req, res) => {
  const result = await chatService.deleteMessage(req.params.id, req.user);
  res.status(200).json({ success: true, ...result });
});
