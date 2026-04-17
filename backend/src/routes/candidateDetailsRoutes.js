import express from "express";
import multer from "multer";
import {
  registerCandidate,
  loginCandidate,
  forgotCandidatePassword,
  resetCandidatePassword,
  getAllCandidateDetails,
  getCandidateDetailsById,
  updateCandidateDetails,
  getMe,
} from "../controllers/candidateDetailsController.js";
import { authenticate, requireHRUser } from "../middlewares/auth.js";
import { requireCandidateLocationAccess } from "../middlewares/locationAccess.js";
import {
  validateCandidateRegistration,
  validateLogin,
  validateObjectId,
  validateForgotPasswordRequest,
  validateResetPasswordRequest,
} from "../middlewares/validators.js";
import {
  candidateForgotPasswordLimiter,
  candidateResetPasswordLimiter,
} from "../middlewares/rateLimiter.js";

const router = express.Router();

// Configure multer for memory storage (for Google Drive upload)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/jpg",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF, DOC, DOCX, JPEG, PNG allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Multi-file upload fields
const uploadFields = upload.fields([
  { name: "resume", maxCount: 1 },
  { name: "idProof", maxCount: 1 },
  { name: "photo", maxCount: 1 },
  { name: "payslips", maxCount: 1 },
  { name: "lastBreakup", maxCount: 1 },
]);

// Auth routes (public)
router.post("/register", uploadFields, validateCandidateRegistration, registerCandidate);
router.post("/login", validateLogin, loginCandidate);
router.post(
  "/forgot-password",
  candidateForgotPasswordLimiter,
  validateForgotPasswordRequest,
  forgotCandidatePassword
);
router.post(
  "/reset-password",
  candidateResetPasswordLimiter,
  validateResetPasswordRequest,
  resetCandidatePassword
);

// Candidate self-service (requires candidate JWT)
router.get("/me", authenticate, requireCandidateLocationAccess, getMe);

// HR routes (protected — require HR JWT)
router.get("/", authenticate, requireHRUser, getAllCandidateDetails);
router.get("/:id", authenticate, requireHRUser, validateObjectId("id"), getCandidateDetailsById);
router.put("/:id", authenticate, requireHRUser, validateObjectId("id"), updateCandidateDetails);

export default router;
