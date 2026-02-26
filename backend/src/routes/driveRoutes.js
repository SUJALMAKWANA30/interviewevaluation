import express from "express";
import {
  createDrive,
  getAllDrives,
  getActiveDrives,
  getDriveById,
  updateDrive,
  toggleDriveStatus,
  deleteDrive,
} from "../controllers/driveController.js";
import { authenticate, authorizePermission } from "../middlewares/auth.js";
import { auditMiddleware } from "../middlewares/audit.js";
import { validateDrive, validateObjectId } from "../middlewares/validators.js";

const router = express.Router();

// Public route - get active drives (for candidate registration dropdown)
router.get("/active", getActiveDrives);

// Protected HR routes
router.get("/", authenticate, getAllDrives);
router.get("/:id", authenticate, validateObjectId("id"), getDriveById);
router.post("/", authenticate, authorizePermission("drives", "create"), validateDrive, createDrive);
router.put("/:id", authenticate, authorizePermission("drives", "edit"), validateObjectId("id"), validateDrive, updateDrive);
router.patch("/:id/toggle-status", authenticate, authorizePermission("drives", "edit"), validateObjectId("id"), toggleDriveStatus);
router.delete("/:id", authenticate, authorizePermission("drives", "delete"), validateObjectId("id"), deleteDrive);

export default router;
