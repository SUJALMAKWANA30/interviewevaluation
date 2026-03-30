import { getLocationTokens } from "../utils/locationTokens.js";
import jwt from "jsonwebtoken";
import CandidateDetails from "../models/CandidateDetails.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const LOCATION_ACCESS_SECRET = process.env.LOCATION_ACCESS_SECRET || JWT_SECRET;
const LOCATION_ACCESS_TTL_SECONDS = Number(process.env.LOCATION_ACCESS_TTL_SECONDS || 600);

const toRadians = (deg) => (deg * Math.PI) / 180;

const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

/* ===============================
   VALIDATE TOKEN
================================ */
export const validateLocationToken = (req, res) => {
  try {
    const { token } = req.query;

    if (!token)
      return res.status(400).json({ success: false, message: "Token required" });

    const tokens = getLocationTokens();
    const location = tokens[token];

    if (!location)
      return res.status(404).json({ success: false, message: "Invalid token" });

    res.json({
      success: true,
      ...location,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Token validation failed",
      error: error.message,
    });
  }
};

/* ===============================
   VERIFY CANDIDATE ACCESS AGAINST DRIVE CENTERS
================================ */
export const verifyDriveAccess = async (req, res) => {
  try {
    if (!req.user || req.user.type !== "candidate") {
      return res.status(403).json({
        success: false,
        message: "Only candidate users can verify location access.",
      });
    }

    const lat = Number(req.body?.lat);
    const lon = Number(req.body?.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required.",
      });
    }

    const candidate = await CandidateDetails.findById(req.user.id)
      .select("driveId")
      .populate("driveId");

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found.",
      });
    }

    const drive = candidate.driveId;
    if (!drive) {
      return res.status(403).json({
        success: false,
        message: "No drive is assigned to this candidate.",
      });
    }

    const activeCenters = (Array.isArray(drive.examCenters) ? drive.examCenters : []).filter(
      (center) => center && center.isActive !== false
    );

    if (activeCenters.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Drive exam centers are not configured. Please contact HR.",
      });
    }

    const centerResults = activeCenters.map((center) => {
      const distanceMeters = calculateDistanceMeters(lat, lon, center.lat, center.lon);
      return {
        name: center.name,
        lat: center.lat,
        lon: center.lon,
        radiusMeters: center.radiusMeters,
        distanceMeters,
        isWithin: distanceMeters <= center.radiusMeters,
      };
    });

    const matchedCenter = centerResults.find((result) => result.isWithin);
    const nearestCenter = [...centerResults].sort((a, b) => a.distanceMeters - b.distanceMeters)[0];

    if (!matchedCenter) {
      return res.status(403).json({
        success: false,
        accessGranted: false,
        message: `You are ${nearestCenter.distanceMeters} meters away from the nearest allowed center (${nearestCenter.name}).`,
        nearestCenter,
      });
    }

    const locationAccessToken = jwt.sign(
      {
        type: "location_access",
        candidateId: String(candidate._id),
        driveId: String(drive._id),
        centerName: matchedCenter.name,
      },
      LOCATION_ACCESS_SECRET,
      { expiresIn: LOCATION_ACCESS_TTL_SECONDS }
    );

    return res.status(200).json({
      success: true,
      accessGranted: true,
      message: "Location verified successfully.",
      locationAccessToken,
      expiresInSeconds: LOCATION_ACCESS_TTL_SECONDS,
      matchedCenter,
      nearestCenter,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Drive location verification failed.",
      error: error.message,
    });
  }
};
