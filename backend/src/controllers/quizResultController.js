import QuizResult from "../models/QuizResult.js";

const getRoundAction = (update = {}) => {
  const roundKeys = ["R2", "R3", "R4"];
  const statuses = [];

  roundKeys.forEach((key) => {
    if (Array.isArray(update[key]) && update[key][0]?.status) {
      statuses.push(String(update[key][0].status).toLowerCase().trim());
    }
  });

  if (statuses.some((s) => s === "drop" || s === "dropped" || s === "rejected")) {
    return "round.drop";
  }
  if (statuses.some((s) => s === "completed")) {
    return "round.complete";
  }
  return "round.update";
};

const normalizeRoundReviews = (reviews = [], roundKey = "") => {
  if (!Array.isArray(reviews)) return [];

  return reviews.slice(0, 1).map((review) => ({
    rating: review?.rating != null ? String(review.rating) : "",
    comments: review?.comments != null ? String(review.comments) : "",
    interviewer: review?.interviewer != null ? String(review.interviewer) : "",
    status: review?.status != null ? String(review.status).toLowerCase().trim() : "",
    managerialStatus:
      roundKey === "R3"
        ? String(
            review?.managerialStatus ??
              review?.["Managerial status"] ??
              review?.["managerial status"] ??
              ""
          )
            .toUpperCase()
            .trim()
        : "",
  }));
};

const buildQuizResultUpdate = (payload = {}) => {
  const update = {};

  if (payload.mobileNumber !== undefined) update.mobileNumber = payload.mobileNumber;
  if (payload.name !== undefined) update.name = payload.name;
  if (payload.sectionWiseMarks !== undefined) update.sectionWiseMarks = payload.sectionWiseMarks;
  if (payload.driveId !== undefined) update.driveId = payload.driveId || null;
  if (payload.totalMarks !== undefined) {
    update.totalMarks = Number(payload.totalMarks) || 0;
  } else if (payload["Final Score"] !== undefined) {
    update.totalMarks = Number(payload["Final Score"]) || 0;
  }
  if (payload.R2 !== undefined) update.R2 = normalizeRoundReviews(payload.R2, "R2");
  if (payload.R3 !== undefined) update.R3 = normalizeRoundReviews(payload.R3, "R3");
  if (payload.R4 !== undefined) update.R4 = normalizeRoundReviews(payload.R4, "R4");

  return update;
};

export const createQuizResult = async (req, res) => {
  try {
    const payloadEmail = String(req.body?.email || "").trim().toLowerCase();
    const authEmail = String(req.user?.email || "").trim().toLowerCase();
    const email = authEmail || payloadEmail;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (authEmail && payloadEmail && authEmail !== payloadEmail) {
      return res.status(403).json({
        success: false,
        message: "You can submit quiz results only for your own account.",
      });
    }

    const update = buildQuizResultUpdate(req.body);
    update.examDate = new Date();

    const quizResult = await QuizResult.findOneAndUpdate(
      { email },
      {
        $set: {
          email,
          ...update,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(201).json({
      success: true,
      message: "Quiz result saved successfully",
      data: quizResult,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating quiz result",
      error: error.message,
    });
  }
};

export const getAllQuizResults = async (req, res) => {
  try {
    const { driveId } = req.query;
    const filter = {};
    if (driveId) filter.driveId = driveId;

    const quizResults = await QuizResult.find(filter).sort({ createdAt: -1 }).lean();
    res.status(200).json({
      success: true,
      data: quizResults,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch quiz results",
      error: error.message,
    });
  }
};

export const getQuizResultById = async (req, res) => {
  try {
    const quizResult = await QuizResult.findById(req.params.id).lean();
    if (!quizResult) {
      return res.status(404).json({
        success: false,
        message: "Quiz result not found",
      });
    }
    res.status(200).json({
      success: true,
      data: quizResult,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching quiz result",
      error: error.message,
    });
  }
};

export const getQuizResultByEmail = async (req, res) => {
  try {
    const email = String(req.params.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (req.user?.type === "candidate" && String(req.user.email || "").trim().toLowerCase() !== email) {
      return res.status(403).json({
        success: false,
        message: "You can access only your own quiz result.",
      });
    }

    const quizResult = await QuizResult.findOne({ email }).sort({ createdAt: -1 }).lean();
    if (!quizResult) {
      return res.status(404).json({
        success: false,
        message: "Quiz result not found for this email",
      });
    }
    res.status(200).json({
      success: true,
      data: quizResult,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching quiz result",
      error: error.message,
    });
  }
};

export const updateQuizResultByEmail = async (req, res) => {
  try {
    const email = String(req.params.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const existing = await QuizResult.findOne({ email });
    const update = buildQuizResultUpdate(req.body);
    const quizResult = await QuizResult.findOneAndUpdate(
      { email },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!quizResult) {
      return res.status(404).json({
        success: false,
        message: "Quiz result not found for this email",
      });
    }

    if (req.user?.type === "hr" && typeof req.audit === "function") {
      const touchedRounds = ["R2", "R3", "R4"].filter((roundKey) => update[roundKey] !== undefined);
      const hasRoundChanges = touchedRounds.length > 0;
      const action = hasRoundChanges ? getRoundAction(update) : "candidate.update";

      await req.audit(action, {
        targetType: "QuizResult",
        targetId: quizResult._id,
        description: hasRoundChanges
          ? `Updated ${touchedRounds.join(", ")} for ${email}`
          : `Updated score data for ${email}`,
        changes: {
          before: {
            totalMarks: existing?.totalMarks ?? null,
            sectionWiseMarks: existing?.sectionWiseMarks ?? [],
            R2: existing?.R2 ?? [],
            R3: existing?.R3 ?? [],
            R4: existing?.R4 ?? [],
          },
          after: {
            totalMarks: quizResult.totalMarks ?? null,
            sectionWiseMarks: quizResult.sectionWiseMarks ?? [],
            R2: quizResult.R2 ?? [],
            R3: quizResult.R3 ?? [],
            R4: quizResult.R4 ?? [],
          },
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Quiz result updated successfully",
      data: quizResult,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating quiz result",
      error: error.message,
    });
  }
};
