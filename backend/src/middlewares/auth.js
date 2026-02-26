import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Role from "../models/Role.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

/**
 * Authenticate JWT token — attaches req.user with user data + populated role
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // HR/Admin user
    if (decoded.type === "hr" || decoded.type === "admin") {
      const user = await User.findById(decoded.id).populate("role");
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: "User account not found or inactive.",
        });
      }
      req.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role?.slug || "unknown",
        roleName: user.role?.name || "Unknown",
        level: user.role?.level ?? 99,
        permissions: user.role?.permissions || [],
        type: "hr",
      };
      return next();
    }

    // Candidate user — pass through with basic info
    if (decoded.type === "candidate") {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        type: "candidate",
      };
      return next();
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token type.",
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Authentication failed.",
      error: error.message,
    });
  }
};

/**
 * Authorize by role level — only users at or below the specified level can access
 * Level 0 = Super Admin (most privileged), higher = less privileged
 */
export const authorizeLevel = (...maxLevels) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Candidates are never authorized for admin routes
    if (req.user.type === "candidate") {
      return res.status(403).json({
        success: false,
        message: "Candidates cannot access admin resources.",
      });
    }

    const userLevel = req.user.level ?? 99;
    const maxLevel = Math.max(...maxLevels);

    if (userLevel > maxLevel) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions for this action.",
      });
    }

    next();
  };
};

/**
 * Authorize by specific permission — check module + action
 */
export const authorizePermission = (module, action) => {
  return (req, res, next) => {
    if (!req.user || req.user.type === "candidate") {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions.",
      });
    }

    // Super admin (level 0) bypasses all permission checks
    if (req.user.level === 0) {
      return next();
    }

    const hasPermission = (req.user.permissions || []).some(
      (p) => p.module === module && p.actions.includes(action)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Permission denied: ${action} on ${module}.`,
      });
    }

    next();
  };
};

/**
 * Optional authentication — doesn't fail if no token, just sets req.user = null
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type === "hr" || decoded.type === "admin") {
      const user = await User.findById(decoded.id).populate("role");
      if (user && user.isActive) {
        req.user = {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role?.slug || "unknown",
          level: user.role?.level ?? 99,
          permissions: user.role?.permissions || [],
          type: "hr",
        };
      } else {
        req.user = null;
      }
    } else if (decoded.type === "candidate") {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        type: "candidate",
      };
    } else {
      req.user = null;
    }

    next();
  } catch {
    req.user = null;
    next();
  }
};
