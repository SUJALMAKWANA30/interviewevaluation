import express from "express";
import {
  createQuizResult,
  getAllQuizResults,
  getQuizResultById,
  getQuizResultByEmail,
  updateQuizResultByEmail,
} from "../controllers/quizResultController.js";

const router = express.Router();

router.post("/", createQuizResult);
router.get("/", getAllQuizResults);
router.put("/email/:email", updateQuizResultByEmail);
router.get("/:id", getQuizResultById);
router.get("/email/:email", getQuizResultByEmail);

export default router;
