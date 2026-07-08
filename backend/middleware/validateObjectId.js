import mongoose from "mongoose";

/**
 * Rejects requests whose :id route param isn't a valid Mongo ObjectId, before
 * they reach the controller — so a bad id returns a clean 400 instead of a
 * Mongoose CastError 500. Used on all /:id CRUD routes.
 */
export function validateObjectId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid id parameter." });
  }
  next();
}
