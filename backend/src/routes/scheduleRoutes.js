import express from "express";
import {
  autoScheduleCandidates,
  createSchedule,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
  cancelSchedule,
  getMySchedule,
  getScheduleStats,
} from "../controllers/scheduleController.js";
import { authenticate, authorizeLevel, authorizePermission } from "../middlewares/auth.js";
import { auditMiddleware } from "../middlewares/audit.js";
import { validateSchedule, validateObjectId } from "../middlewares/validators.js";

const router = express.Router();

// All routes require HR authentication
router.use(authenticate);
router.use(auditMiddleware);

// Stats
router.get("/stats", authorizePermission("scheduling", "view"), getScheduleStats);

// Get my schedule (for the logged-in interviewer)
router.get("/my-schedule", getMySchedule);

// Get all schedules with filters
router.get("/", authorizePermission("scheduling", "view"), getAllSchedules);

// Get single schedule
router.get("/:id", authorizePermission("scheduling", "view"), validateObjectId("id"), getScheduleById);

// Create manual schedule
router.post("/", authorizePermission("scheduling", "create"), createSchedule);

// Auto-schedule candidates
router.post("/auto-schedule", authorizePermission("scheduling", "assign"), validateSchedule, autoScheduleCandidates);

// Update schedule
router.put("/:id", authorizePermission("scheduling", "edit"), validateObjectId("id"), updateSchedule);

// Cancel schedule
router.patch("/:id/cancel", authorizePermission("scheduling", "edit"), validateObjectId("id"), cancelSchedule);

export default router;
