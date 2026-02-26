import AuditLog from "../models/AuditLog.js";

/**
 * Create an audit log entry
 */
export const createAuditLog = async ({
  userId = null,
  userName = "System",
  action,
  targetType = null,
  targetId = null,
  description = "",
  changes = null,
  ip = null,
  userAgent = null,
}) => {
  try {
    await AuditLog.create({
      userId,
      userName,
      action,
      targetType,
      targetId,
      description,
      changes,
      ip,
      userAgent,
    });
  } catch (error) {
    // Don't let audit logging failures break the app
    console.error("Audit log error:", error.message);
  }
};

/**
 * Express middleware to attach audit helper to req
 */
export const auditMiddleware = (req, res, next) => {
  req.audit = async (action, details = {}) => {
    await createAuditLog({
      userId: req.user?.id || null,
      userName: req.user?.name || req.user?.email || "Anonymous",
      action,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers["user-agent"],
      ...details,
    });
  };
  next();
};
