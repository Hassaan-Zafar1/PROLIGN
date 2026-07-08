import Session from "../models/Session.js";
import { crudHandlers } from "../services/crudService.js";

// Mentorship sessions (mentor⇄mentee booking junction). Scoped to the mentee or
// mentor on the session; created as the mentee (menteeId from the token).
const h = crudHandlers(Session, {
  owners: ["menteeId", "mentorId"],
  setOwner: "menteeId",
  immutable: ["menteeId"],
});

export const listSessions = h.list;
export const getSession = h.getOne;
export const createSession = h.create;
export const updateSession = h.update;
export const deleteSession = h.remove;
