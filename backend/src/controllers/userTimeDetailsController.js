import UserTimeDetails from "../models/UserTimeDetails.js";
import CandidateDetails from "../models/CandidateDetails.js";

export const getAllUserTimeDetails = async (req, res) => {
  try {
    const { driveId } = req.query;
    const filter = {};
    if (driveId) filter.driveId = driveId;

    const records = await UserTimeDetails.find(filter).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch all user time details", error: error.message });
  }
};

export const registerUserTimeDetails = async (req, res) => {
  try {
    const { email, phone, firstName, lastName } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    const existing = await UserTimeDetails.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(200).json({ success: true, message: "UserTimeDetails already exists", data: existing });
    }
    const record = await UserTimeDetails.create({
      email: email.toLowerCase(),
      phone,
      firstName,
      lastName,
    });
    res.status(201).json({ success: true, message: "UserTimeDetails created", data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create UserTimeDetails", error: error.message });
  }
};

export const getByEmail = async (req, res) => {
  try {
    const email = req.params.email?.toLowerCase();

    if (req.user?.type === "candidate" && req.user.email !== email) {
      return res.status(403).json({
        success: false,
        message: "Candidates can only access their own timing details.",
      });
    }

    const record = await UserTimeDetails.findOne({ email }).lean();
    if (!record) {
      return res.status(404).json({ success: false, message: "UserTimeDetails not found" });
    }
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch", error: error.message });
  }
};

export const startExam = async (req, res) => {
  try {
    const candidate = await CandidateDetails.findById(req.user.id);
    if (!candidate) return res.status(404).json({ success: false, message: "Candidate not found" });

    const email = candidate.email.toLowerCase();
    const existing = await UserTimeDetails.findOne({ email });

    if (existing?.completionTime != null || existing?.endTime) {
      return res.status(409).json({
        success: false,
        message: "Exam is already completed for this candidate.",
        data: existing,
      });
    }

    if (existing?.startTime) {
      return res.status(200).json({
        success: true,
        alreadyStarted: true,
        data: existing,
      });
    }

    const now = new Date();
    const photo = (candidate?.documents?.photo || "").toString();
    const record = await UserTimeDetails.findOneAndUpdate(
      { email },
      {
        $set: {
          email,
          phone: candidate.phone,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          photo,
          startTime: now,
          driveId: candidate.driveId || null,
        },
      },
      { upsert: true, new: true }
    );
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to set startTime", error: error.message });
  }
};

export const endExam = async (req, res) => {
  try {
    const candidate = await CandidateDetails.findById(req.user.id);
    if (!candidate) return res.status(404).json({ success: false, message: "Candidate not found" });
    const now = new Date();
    const email = candidate.email.toLowerCase();
    const photo = (candidate?.documents?.photo || "").toString();
    const record = await UserTimeDetails.findOneAndUpdate(
      { email },
      {
        $set: { endTime: now, photo, driveId: candidate.driveId || null },
        $setOnInsert: {
          email,
          phone: candidate.phone,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          startTime: now,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to set endTime", error: error.message });
  }
};

export const completeExam = async (req, res) => {
  try {
    const candidate = await CandidateDetails.findById(req.user.id);
    if (!candidate) return res.status(404).json({ success: false, message: "Candidate not found" });
    const now = new Date();
    const email = candidate.email.toLowerCase();
    // ensure endTime exists
    const existing = await UserTimeDetails.findOne({ email });
    let endTime = existing?.endTime || now;
    if (!existing?.endTime) {
      await UserTimeDetails.updateOne(
        { email },
        {
          $set: { endTime },
          $setOnInsert: {
            email,
            phone: candidate.phone,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
          },
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }
    const refreshed = existing || (await UserTimeDetails.findOne({ email }));
    const startTime = refreshed?.startTime;
    const completionSeconds =
      startTime && endTime ? Math.max(0, Math.floor((endTime.getTime() - new Date(startTime).getTime()) / 1000)) : null;
    const photo = (candidate?.documents?.photo || "").toString();
    const record = await UserTimeDetails.findOneAndUpdate(
      { email },
      {
        $set: { completionTime: completionSeconds, photo, driveId: candidate.driveId || null },
        $setOnInsert: {
          email,
          phone: candidate.phone,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          endTime,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to set completionTime", error: error.message });
  }
};
