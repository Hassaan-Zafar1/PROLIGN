import Payment from "../models/Payment.js";
import { crudHandlers } from "../services/crudService.js";

// Payments for sessions. Scoped to the mentee/mentor on the payment.
// (Amounts/ids are supplied in the body for now — Stripe integration will
// create these server-side later.)
const h = crudHandlers(Payment, {
  owners: ["menteeId", "mentorId"],
});

export const listPayments = h.list;
export const getPayment = h.getOne;
export const createPayment = h.create;
export const updatePayment = h.update;
export const deletePayment = h.remove;
