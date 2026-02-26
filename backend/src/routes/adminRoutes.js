import express from "express";
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getInterviewerNames,
  getPermissionModules,
} from "../controllers/roleUserController.js";
import { authenticate, authorizeLevel } from "../middlewares/auth.js";
import { auditMiddleware } from "../middlewares/audit.js";
import { validateRole, validateUserCreation, validateObjectId } from "../middlewares/validators.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(auditMiddleware);

// ============ ROLE ROUTES ============

// Get permission modules (for role creation UI)
router.get("/permissions/modules", getPermissionModules);

// Get all roles (accessible to level 0-1: Super Admin, Admin)
router.get("/roles", authorizeLevel(1), getAllRoles);
router.get("/roles/:id", authorizeLevel(1), validateObjectId("id"), getRoleById);
router.post("/roles", authorizeLevel(0), validateRole, createRole);           // Only super admin
router.put("/roles/:id", authorizeLevel(0), validateObjectId("id"), updateRole); // Only super admin
router.delete("/roles/:id", authorizeLevel(0), validateObjectId("id"), deleteRole); // Only super admin

// ============ USER ROUTES ============

// Get interviewer names (for candidate modals - accessible to all HR)
router.get("/interviewers", getInterviewerNames);

// User CRUD (accessible to level 0-1: Super Admin, Admin)
router.get("/users", authorizeLevel(1), getAllUsers);
router.get("/users/:id", authorizeLevel(1), validateObjectId("id"), getUserById);
router.post("/users", authorizeLevel(0), validateUserCreation, createUser);  // Only super admin
router.put("/users/:id", authorizeLevel(0), validateObjectId("id"), updateUser); // Only super admin
router.patch("/users/:id/toggle-status", authorizeLevel(0), validateObjectId("id"), toggleUserStatus);
router.delete("/users/:id", authorizeLevel(0), validateObjectId("id"), deleteUser);

export default router;
