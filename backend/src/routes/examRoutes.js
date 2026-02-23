import express from "express";
import {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam,
  toggleActiveExam,
  getActiveExam,
} from "../controllers/examController.js";

const router = express.Router();

// Public route - get active exam (for user-side quiz)
router.get("/active", getActiveExam);

// HR routes
router.post("/", createExam);
router.get("/", getAllExams);
router.get("/:id", getExamById);
router.put("/:id", updateExam);
router.delete("/:id", deleteExam);
router.patch("/:id/toggle-active", toggleActiveExam);

export default router;
