import mongoose from "mongoose";
import { ApiError } from "./errorHandler.js";

/**
 * Rejects requests whose :id route param isn't a valid Mongo ObjectId, before
 * they reach the controller — forwards a 400 to the global errorHandler instead
 * of letting a Mongoose CastError become a 500. Used on all /:id CRUD routes.
 */
export function validateObjectId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new ApiError(400, "Invalid id parameter."));
  }
  next();
}
