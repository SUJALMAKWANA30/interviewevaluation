import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import rateLimiter from "./middlewares/rateLimiter.js";
import { auditMiddleware } from "./middlewares/audit.js";

// Existing routes
import candidateDetailsRoutes from "./routes/candidateDetailsRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import quizResultRoutes from "./routes/quizResultRoutes.js";
import userTimeDetailsRoutes from "./routes/userTimeDetailsRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import driveRoutes from "./routes/driveRoutes.js";

// New secure routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";

import { loadLocationTokens } from "./utils/locationTokens.js";
import { seedSuperAdmin } from "./utils/seedSuperAdmin.js";

dotenv.config();

const app = express();

connectDB().then(() => {
  // Seed super admin on first run
  seedSuperAdmin();
});
loadLocationTokens();

// Security & performance middleware
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(rateLimiter);
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
    : ["http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Audit middleware (attaches req.audit helper)
app.use(auditMiddleware);

// ============ PUBLIC / CANDIDATE ROUTES ============
app.use("/api/candidate-details", candidateDetailsRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/quizresult", quizResultRoutes);
app.use("/api/user-time-details", userTimeDetailsRoutes);

// ============ HR AUTH ROUTES ============
app.use("/api/auth", authRoutes);

// ============ ADMIN ROUTES (protected) ============
app.use("/api/admin", adminRoutes);

// ============ EXAM & DRIVE ROUTES ============
app.use("/api/exams", examRoutes);
app.use("/api/drives", driveRoutes);

// ============ SCHEDULE ROUTES (protected) ============
app.use("/api/schedules", scheduleRoutes);

export default app;
