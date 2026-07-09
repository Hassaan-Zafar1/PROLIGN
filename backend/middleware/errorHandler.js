import { env } from "../config/env.js";

/**
 * Typed error services throw for expected failures (validation, not-found,
 * forbidden, …). The global errorHandler reads `statusCode` off it.
 *   throw new ApiError(404, "Mentor not found.");
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
    // Optional extra fields merged into the JSON response (e.g. { userId } for
    // an "email not verified" 403 so the client can continue the OTP flow).
    this.details = details;
  }
}

/**
 * Global error handling middleware.
 * Must be registered LAST in Express (after all routes).
 */
export function errorHandler(err, req, res, next) {
    console.error("🔴 ERROR:", err);
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose: duplicate key (e.g. email already exists)
  if (err.code === 11000) {
    statusCode = 409; 
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `${field} already exists`;
  }

  // Mongoose: validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Never leak stack traces in production
  const response = {
    success: false,
    message,
    ...(err.details && typeof err.details === "object" ? err.details : {}),
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
}

/**
 * 404 handler — register this BEFORE errorHandler but AFTER all routes.
 */
export function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}