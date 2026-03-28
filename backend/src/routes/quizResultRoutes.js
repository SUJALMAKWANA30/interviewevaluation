import express from "express";
import {
  createQuizResult,
  getAllQuizResults,
  getQuizResultById,
  getQuizResultByEmail,
  updateQuizResultByEmail,
} from "../controllers/quizResultController.js";
import { authenticate, authorizeLevel } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", createQuizResult);
router.get("/", getAllQuizResults);
router.put("/email/:email", authenticate, authorizeLevel(4), updateQuizResultByEmail);
router.get("/:id", getQuizResultById);
router.get("/email/:email", getQuizResultByEmail);

export default router;
