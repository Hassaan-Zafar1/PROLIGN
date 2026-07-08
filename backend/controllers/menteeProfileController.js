import MenteeProfile from "../models/MenteeProfile.js";
import { crudHandlers } from "../services/crudService.js";

// Rich mentee profile (interview answers, skillProfile + AI-matching `cleaned.*`).
// Owner-scoped/private; userId set from the token; one per user (unique userId
// → duplicate create returns 409).
const h = crudHandlers(MenteeProfile, {
  owners: ["userId"],
  setOwner: "userId",
  immutable: ["userId"],
});

export const listMenteeProfiles = h.list;
export const getMenteeProfile = h.getOne;
export const createMenteeProfile = h.create;
export const updateMenteeProfile = h.update;
export const deleteMenteeProfile = h.remove;
