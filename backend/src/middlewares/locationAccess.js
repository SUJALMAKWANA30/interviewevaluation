import jwt from "jsonwebtoken";
import CandidateDetails from "../models/CandidateDetails.js";

const DEFAULT_DEV_JWT_SECRET = "dev-only-change-me";
const isProduction = process.env.NODE_ENV === "production";
const JWT_SECRET = process.env.JWT_SECRET || (isProduction ? null : DEFAULT_DEV_JWT_SECRET);

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be configured in production environment.");
}
const LOCATION_ACCESS_SECRET = process.env.LOCATION_ACCESS_SECRET || JWT_SECRET;

export const requireCandidateLocationAccess = async (req, res, next) => {
  try {
    if (!req.user || req.user.type !== "candidate") {
      return next();
    }

    const token =
      req.headers["x-location-access-token"] ||
      req.headers["x-location-token"] ||
      "";

    if (!token) {
      return res.status(403).json({
        success: false,
        message: "Location verification required before accessing the candidate portal.",
      });
    }

    const decoded = jwt.verify(token, LOCATION_ACCESS_SECRET);

    if (decoded?.type !== "location_access") {
      return res.status(403).json({
        success: false,
        message: "Invalid location access token.",
      });
    }

    if (String(decoded.candidateId) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "Location token does not belong to the current candidate.",
      });
    }

    const candidate = await CandidateDetails.findById(req.user.id).select("driveId");
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found.",
      });
    }

    if (String(candidate.driveId || "") !== String(decoded.driveId || "")) {
      return res.status(403).json({
        success: false,
        message: "Candidate drive was changed. Please verify location again.",
      });
    }

    req.locationAccess = decoded;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(403).json({
        success: false,
        message: "Location access expired. Please verify your location again.",
      });
    }

    return res.status(403).json({
      success: false,
      message: "Invalid location access token.",
    });
  }
};
