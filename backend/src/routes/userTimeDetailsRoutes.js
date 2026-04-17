import express from "express";
import {
  registerUserTimeDetails,
  getAllUserTimeDetails,
  getByEmail,
  startExam,
  endExam,
  completeExam,
} from "../controllers/userTimeDetailsController.js";
import { authenticate, requireHRUser, requireCandidateUser } from "../middlewares/auth.js";
import { requireCandidateLocationAccess } from "../middlewares/locationAccess.js";

const router = express.Router();

router.post("/register", authenticate, requireHRUser, registerUserTimeDetails);
router.get("/", authenticate, requireHRUser, getAllUserTimeDetails);
router.get("/email/:email", authenticate, requireCandidateLocationAccess, getByEmail);
router.post("/start", authenticate, requireCandidateUser, requireCandidateLocationAccess, startExam);
router.post("/end", authenticate, requireCandidateUser, requireCandidateLocationAccess, endExam);
router.post("/complete", authenticate, requireCandidateUser, requireCandidateLocationAccess, completeExam);

export default router;
