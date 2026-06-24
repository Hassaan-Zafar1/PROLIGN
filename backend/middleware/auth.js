import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";

/**
 * Protects routes — verifies JWT access token from Authorization header.
 * Attaches req.user on success.
 */
export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account has been deactivated.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Restricts route access to specific roles.
 * Usage: router.get("/admin", protect, restrictTo("admin"), handler)
 */
export function restrictTo(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }
    next();
  };
}

/**
 * Requires email to be verified before accessing a route.
 */
export function requireEmailVerified(req, res, next) {
  if (!req.user?.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email before accessing this resource.",
    });
  }
  next();
}
// Extract IP from request - add this to auth.js
export function extractClientInfo(req, res, next) {
  // Get IP address (handles proxies)
  req.ip = req.headers['x-forwarded-for']?.split(',')[0].trim() 
    || req.connection.remoteAddress 
    || req.socket.remoteAddress
    || null;
  
  // Get user agent
  req.userAgent = req.get('user-agent') || null;
  
  next();
}