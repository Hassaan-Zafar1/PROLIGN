import AvailabilitySlot from "../models/AvailabilitySlot.js";
import { crudHandlers } from "../services/crudService.js";

// Mentor availability slots. Reads open (browse a mentor's slots via
// ?mentorId=…); writes are owner-scoped and mentorId is set from the token.
const h = crudHandlers(AvailabilitySlot, {
  owners: ["mentorId"],
  setOwner: "mentorId",
  immutable: ["mentorId"],
  publicRead: true,
});

export const listAvailability = h.list;
export const getAvailability = h.getOne;
export const createAvailability = h.create;
export const updateAvailability = h.update;
export const deleteAvailability = h.remove;
