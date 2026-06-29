import AuditLog from "../models/AuditLog.js";

/**
 * Log an audit event to MongoDB
 * @param {Object} options - Logging options
 * @param {String} options.actorId - User ID performing the action
 * @param {String} options.actorRole - Role of the user (admin, mentor, mentee, system)
 * @param {String} options.action - Action being logged
 * @param {String} options.targetId - ID of the affected resource (optional)
 * @param {String} options.targetType - Type of resource (user, session, payment, etc.)
 * @param {Object} options.before - State before change (optional)
 * @param {Object} options.after - State after change (optional)
 * @param {Object} options.request - Express request object (to extract IP and userAgent)
 */
export async function logAudit(options) {
  try {
    const {
      actorId,
      actorRole,
      action,
      targetId,
      targetType = "user",
      before = null,
      after = null,
      request = null,
    } = options;

    // Extract IP and userAgent from request
    let ip = null;
    let userAgent = null;

    if (request) {
      ip = request.ip || request.connection.remoteAddress || null;
      userAgent = request.get("user-agent") || null;
    }

    const auditEntry = await AuditLog.create({
      actorId,
      actorRole,
      action,
      targetId: targetId || null,
      targetType,
      before,
      after,
      ip,
      userAgent,
    });

    console.log(`✅ Audit log created: ${action} by ${actorId}`);
    return auditEntry;
  } catch (error) {
    console.error("❌ Failed to create audit log:", error.message);
    // Don't throw - logging failures shouldn't break the main operation
    return null;
  }
}
