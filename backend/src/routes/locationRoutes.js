import express from "express";
import {
	validateLocationToken,
	verifyDriveAccess,
} from "../controllers/locationController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.get("/validate", validateLocationToken);
router.post("/verify-drive-access", authenticate, verifyDriveAccess);

export default router;
