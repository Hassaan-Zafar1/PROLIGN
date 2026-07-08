// backend/models/index.js
// Import all models here to ensure they are registered with Mongoose
// before any queries run. Import this file once in your server entry point.

import User from "./User.js";
import MentorProfile from "./MentorProfile.js";
import MenteeProfile from "./MenteeProfile.js";
import AiAssessment from "./AiAssessment.js";
import AvailabilitySlot from "./AvailabilitySlot.js";
import Session from "./Session.js";
import Payment from "./Payment.js";
import Review from "./Review.js";
import Notification from "./Notification.js";
import ChatMessage from "./ChatMessage.js";
import AuditLog from "./AuditLog.js";

export {
  User,
  MentorProfile,
  MenteeProfile,
  AiAssessment,
  AvailabilitySlot,
  Session,
  Payment,
  Review,
  Notification,
  ChatMessage,
  AuditLog,
};
