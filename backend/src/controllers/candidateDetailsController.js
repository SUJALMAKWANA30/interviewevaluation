import CandidateDetails from "../models/CandidateDetails.js";
import { uploadFileToDrive } from "../services/googleDriveService.js";
import jwt from "jsonwebtoken";
import UserTimeDetails from "../models/UserTimeDetails.js";
import crypto from "crypto";
import { sendCandidatePasswordResetEmail } from "../services/notificationService.js";

const DEFAULT_DEV_JWT_SECRET = "dev-only-change-me";
const isProduction = process.env.NODE_ENV === "production";
const JWT_SECRET = process.env.JWT_SECRET || (isProduction ? null : DEFAULT_DEV_JWT_SECRET);

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be configured in production environment.");
}

const PASSWORD_RESET_TTL_MINUTES = Number(process.env.CANDIDATE_RESET_TTL_MINUTES || 15);

const hashResetToken = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

/* ===============================
   REGISTER CANDIDATE
================================ */
export const registerCandidate = async (req, res) => {
  try {
    const {
      // Personal Information
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      preferredLocation,
      willingToRelocate,

      // Professional Details
      positionApplied,
      totalExperience,
      highestEducation,
      skills,
      noticePeriod,
      currentDesignation,
      currentCTC,
      experienceLevels,

      // Authentication
      password,

      // Terms
      termsAccepted,

      // Document URLs (from URL-based upload)
      documentUrls,

      // Walk-in Drive
      driveId,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields (firstName, lastName, email, phone, password)",
      });
    }

    // Check if candidate already exists
    const existingCandidate = await CandidateDetails.findOne({ email: email.toLowerCase() });
    if (existingCandidate) {
      return res.status(400).json({
        success: false,
        message: "A candidate with this email already exists",
      });
    }

    // Handle file uploads to Google Drive (optional - registration continues even if uploads fail)
    let documentLinks = {
      resume: "",
      idProof: "",
      photo: "",
      payslips: "",
      lastBreakup: "",
    };

    // First, apply any URL-based document links from the frontend
    if (documentUrls) {
      try {
        const parsedUrls = typeof documentUrls === "string" ? JSON.parse(documentUrls) : documentUrls;
        for (const [key, url] of Object.entries(parsedUrls)) {
          if (url && documentLinks.hasOwnProperty(key)) {
            documentLinks[key] = url;
          }
        }
      } catch (e) {
        console.error("[Register] Failed to parse documentUrls:", e.message);
      }
    }

    // Upload files to Google Drive
    const uploadErrors = [];
    try {
      const fileKeys = Object.keys(req.files || {});
      if (fileKeys.length > 0) {
        const uploadFile = async (file, folder, linkKey) => {
          try {
            const result = await uploadFileToDrive(file, folder);
            if (result && result.fileId) {
              // Store fileId directly — frontend constructs thumbnail URLs from it
              documentLinks[linkKey] = result.fileId;
            } else {
              uploadErrors.push(`${linkKey}: upload returned null (Drive API may not be configured)`);
            }
          } catch (err) {
            uploadErrors.push(`${linkKey}: ${err.message}`);
          }
        };

        const uploadPromises = [];

        if (req.files.resume && req.files.resume[0]) {
          uploadPromises.push(uploadFile(req.files.resume[0], "resumes", "resume"));
        }
        if (req.files.idProof && req.files.idProof[0]) {
          uploadPromises.push(uploadFile(req.files.idProof[0], "id-proofs", "idProof"));
        }
        if (req.files.photo && req.files.photo[0]) {
          uploadPromises.push(uploadFile(req.files.photo[0], "photos", "photo"));
        }
        if (req.files.payslips && req.files.payslips[0]) {
          uploadPromises.push(uploadFile(req.files.payslips[0], "payslips", "payslips"));
        }
        if (req.files.lastBreakup && req.files.lastBreakup[0]) {
          uploadPromises.push(uploadFile(req.files.lastBreakup[0], "last-breakup", "lastBreakup"));
        }

        await Promise.allSettled(uploadPromises);
      }
    } catch (uploadError) {
      console.error("[Register] File upload process error:", uploadError.message);
    }

    if (uploadErrors.length > 0) {
      console.error("[Register] Document upload issues:", uploadErrors);
    }

    // Parse skills if it's a string
    let parsedSkills = skills;
    if (typeof skills === "string") {
      try {
        parsedSkills = JSON.parse(skills);
      } catch {
        parsedSkills = skills.split(",").map((s) => s.trim());
      }
    }

    // Parse experienceLevels if it's a string
    let parsedExperienceLevels = experienceLevels;
    if (typeof experienceLevels === "string") {
      try {
        parsedExperienceLevels = JSON.parse(experienceLevels);
      } catch {
        parsedExperienceLevels = {};
      }
    }

    // Create new candidate
    const candidate = new CandidateDetails({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      preferredLocation,
      willingToRelocate,
      positionApplied,
      totalExperience,
      highestEducation,
      skills: parsedSkills || [],
      noticePeriod,
      currentDesignation,
      currentCTC,
      experienceLevels: parsedExperienceLevels || {},
      documents: documentLinks,
      password,
      termsAccepted: termsAccepted === true || termsAccepted === "true",
      driveId: driveId || null,
    });

    await candidate.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: candidate._id, email: candidate.email, type: "candidate" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      candidate: {
        id: candidate._id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone,
        uniqueId: candidate.uniqueId,
        documents: candidate.documents,
      },
    });
    try {
      const existing = await UserTimeDetails.findOne({ email: candidate.email.toLowerCase() });
      if (!existing) {
        await UserTimeDetails.create({
          email: candidate.email.toLowerCase(),
          phone: candidate.phone,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          photo: (candidate?.documents?.photo || "").toString(),
          driveId: driveId || null,
        });
      }
    } catch (e) {
      // Failed to initialize UserTimeDetails
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
      error: error.message,
    });
  }
};

/* ===============================
   LOGIN CANDIDATE
================================ */
export const loginCandidate = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find candidate by email
    const candidate = await CandidateDetails.findOne({ email: email.toLowerCase() });

    if (!candidate) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if account is active
    if (!candidate.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    // Compare password
    const isPasswordValid = await candidate.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Mark attendance as true on successful login
    if (!candidate.attendance) {
      candidate.attendance = true;
      await candidate.save();
    }
    // Do not reset timing data on login; preserve start/end/completion to enforce single attempt

    // Generate JWT token
    const token = jwt.sign(
      { id: candidate._id, email: candidate.email, type: "candidate" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      candidate: {
        id: candidate._id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone,
        uniqueId: candidate.uniqueId,
        examStatus: candidate.examStatus,
        attendance: candidate.attendance,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
      error: error.message,
    });
  }
};

/* ===============================
   GET ALL CANDIDATES (for HR Dashboard)
================================ */
export const getAllCandidateDetails = async (req, res) => {
  try {
    const { driveId } = req.query;
    const filter = {};
    if (driveId) filter.driveId = driveId;

    const candidates = await CandidateDetails.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch candidates",
      error: error.message,
    });
  }
};

/* ===============================
   GET CANDIDATE BY ID
================================ */
export const getCandidateDetailsById = async (req, res) => {
  try {
    const candidate = await CandidateDetails.findById(req.params.id).select("-password").lean();

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.status(200).json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching candidate",
      error: error.message,
    });
  }
};

/* ===============================
   GET CURRENT USER (via JWT)
================================ */
export const getMe = async (req, res) => {
  try {
    if (!req.user || req.user.type !== "candidate") {
      return res.status(403).json({ success: false, message: "Only candidate users can access this resource." });
    }

    const candidate = await CandidateDetails.findById(req.user.id)
      .select("-password")
      .populate("driveId")
      .lean();
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }
    res.status(200).json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch current user", error: error.message });
  }
};

/* ===============================
   UPDATE CANDIDATE
================================ */
export const updateCandidateDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Don't allow password update through this endpoint
    delete updateData.password;

    const candidate = await CandidateDetails.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Candidate updated successfully",
      data: candidate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating candidate",
      error: error.message,
    });
  }
};

/* ===============================
   FORGOT CANDIDATE PASSWORD
================================ */
export const forgotCandidatePassword = async (req, res) => {
  const genericResponse = {
    success: true,
    message:
      "If an account exists for this email, a password reset link has been sent.",
  };

  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(200).json(genericResponse);
    }

    const candidate = await CandidateDetails.findOne({ email });
    if (!candidate || !candidate.isActive) {
      return res.status(200).json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);

    candidate.resetPasswordToken = hashedToken;
    candidate.resetPasswordExpires = expiresAt;
    await candidate.save({ validateBeforeSave: false });

    const emailResult = await sendCandidatePasswordResetEmail(candidate, rawToken);
    if (!emailResult?.success) {
      console.error("[ForgotPassword] Failed to send reset email:", emailResult?.error || "unknown error");
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("[ForgotPassword] Request failed:", error.message);
    return res.status(200).json(genericResponse);
  }
};

/* ===============================
   RESET CANDIDATE PASSWORD
================================ */
export const resetCandidatePassword = async (req, res) => {
  try {
    const token = String(req.body?.token || "").trim();
    const newPassword = String(req.body?.newPassword || "");

    const hashedToken = hashResetToken(token);
    const candidate = await CandidateDetails.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!candidate || !candidate.isActive) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset token.",
      });
    }

    candidate.password = newPassword;
    candidate.resetPasswordToken = null;
    candidate.resetPasswordExpires = null;
    await candidate.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful. You can now login with your new password.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to reset password.",
    });
  }
};
