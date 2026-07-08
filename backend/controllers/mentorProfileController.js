import MentorProfile from "../models/MentorProfile.js";
import { crudHandlers } from "../services/crudService.js";

// Rich mentor profile (skills/domains/ratings + AI-matching `cleaned.*`).
// Reads open (browse/matching); userId set from the token; one per user
// (unique userId → duplicate create returns 409).
const h = crudHandlers(MentorProfile, {
  owners: ["userId"],
  setOwner: "userId",
  immutable: ["userId"],
  publicRead: true,
});

export const listMentorProfiles = h.list;
export const getMentorProfile = h.getOne;
export const createMentorProfile = h.create;
export const updateMentorProfile = h.update;
export const deleteMentorProfile = h.remove;
