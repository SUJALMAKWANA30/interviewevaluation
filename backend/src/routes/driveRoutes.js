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

const router = express.Router();

// Public route - get active drives (for candidate registration dropdown)
router.get("/active", getActiveDrives);

// HR routes
router.post("/", createDrive);
router.get("/", getAllDrives);
router.get("/:id", getDriveById);
router.put("/:id", updateDrive);
router.patch("/:id/toggle-status", toggleDriveStatus);
router.delete("/:id", deleteDrive);

export default router;
