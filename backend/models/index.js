// backend/models/index.js
// Import all models here to ensure they are registered with Mongoose
// before any queries run. Require this file once in your server entry point.

const User             = require("./User");
const MentorProfile    = require("./MentorProfile");
const MenteeProfile    = require("./MenteeProfile");
const AiAssessment     = require("./AiAssessment");
const AvailabilitySlot = require("./AvailabilitySlot");
const Session          = require("./Session");
const Payment          = require("./Payment");
const Review           = require("./Review");
const Notification     = require("./Notification");
const ChatMessage      = require("./ChatMessage");
const AuditLog         = require("./AuditLog");

module.exports = {
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
