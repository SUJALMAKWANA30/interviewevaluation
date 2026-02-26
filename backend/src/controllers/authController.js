import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Role from "../models/Role.js";
import { createAuditLog } from "../middlewares/audit.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "8h";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

/**
 * HR / Admin Login
 */
export const loginHR = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).populate("role");

    if (!user) {
      await createAuditLog({
        action: "auth.failed_login",
        description: `Failed login attempt for email: ${email}`,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Contact your administrator.",
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await createAuditLog({
        userId: user._id,
        userName: user.name,
        action: "auth.failed_login",
        description: `Failed login attempt (wrong password)`,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const tokenPayload = {
      id: user._id,
      email: user.email,
      type: "hr",
      role: user.role?.slug,
      level: user.role?.level,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign(
      { id: user._id, type: "refresh" },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    user.lastLogin = new Date();
    user.refreshToken = refreshToken;
    await user.save();

    await createAuditLog({
      userId: user._id,
      userName: user.name,
      action: "auth.login",
      description: `${user.name} logged in`,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role?.name || "Unknown",
        roleSlug: user.role?.slug || "unknown",
        level: user.role?.level ?? 99,
        permissions: user.role?.permissions || [],
        drives: user.drives || [],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed.",
      error: error.message,
    });
  }
};

/**
 * Refresh token
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required.",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).populate("role");

    if (!user || !user.isActive || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token.",
      });
    }

    const newToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        type: "hr",
        role: user.role?.slug,
        level: user.role?.level,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      token: newToken,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid refresh token.",
    });
  }
};

/**
 * Get current HR user profile
 */
export const getHRProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("role")
      .populate("drives", "name location isActive");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role?.name || "Unknown",
        roleSlug: user.role?.slug || "unknown",
        level: user.role?.level ?? 99,
        permissions: user.role?.permissions || [],
        drives: user.drives || [],
        lastLogin: user.lastLogin,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile.",
      error: error.message,
    });
  }
};

/**
 * Logout — clear refresh token
 */
export const logoutHR = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });

    await createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: "auth.logout",
      description: `${req.user.name} logged out`,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Logout failed.",
      error: error.message,
    });
  }
};
