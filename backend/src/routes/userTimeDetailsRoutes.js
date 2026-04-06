import express from "express";
import {
  registerUserTimeDetails,
  getAllUserTimeDetails,
  getByEmail,
  startExam,
  endExam,
  completeExam,
} from "../controllers/userTimeDetailsController.js";
import { authenticate } from "../middlewares/auth.js";
import { requireCandidateLocationAccess } from "../middlewares/locationAccess.js";

const router = express.Router();

router.post("/register", registerUserTimeDetails);
router.get("/", authenticate, getAllUserTimeDetails);
router.get("/email/:email", authenticate, requireCandidateLocationAccess, getByEmail);
router.post("/start", authenticate, requireCandidateLocationAccess, startExam);
router.post("/end", authenticate, requireCandidateLocationAccess, endExam);
router.post("/complete", authenticate, requireCandidateLocationAccess, completeExam);

export default router;
