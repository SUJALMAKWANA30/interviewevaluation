import Exam from "../models/Exam.js";

// Create a new exam
export const createExam = async (req, res) => {
  try {
    const { title, duration, sections, driveId } = req.body;

    if (!title || !duration || !sections || !sections.length) {
      return res.status(400).json({
        success: false,
        message: "Title, duration, and at least one section are required.",
      });
    }

    const exam = new Exam({
      title,
      duration,
      sections,
      status: "Draft",
      driveId: driveId || null,
    });

    await exam.save();

    return res.status(201).json({
      success: true,
      message: "Exam created successfully.",
      data: exam,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create exam.",
      error: error.message,
    });
  }
};

// Get all exams
export const getAllExams = async (req, res) => {
  try {
    const { driveId } = req.query;
    const filter = {};

    if (driveId) {
      filter.driveId = driveId;
    }

    const exams = await Exam.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: exams,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch exams.",
      error: error.message,
    });
  }
};

// Get a single exam by ID
export const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch exam.",
      error: error.message,
    });
  }
};

// Update an exam
export const updateExam = async (req, res) => {
  try {
    const { title, duration, sections, status, driveId } = req.body;

    const updateData = { title, duration, sections, status };
    if (driveId !== undefined) {
      updateData.driveId = driveId || null;
    }

    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Exam updated successfully.",
      data: exam,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update exam.",
      error: error.message,
    });
  }
};

// Delete an exam
export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Exam deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete exam.",
      error: error.message,
    });
  }
};

// Toggle active status of an exam (only one can be active)
export const toggleActiveExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    if (exam.isActive) {
      // Deactivate it
      exam.isActive = false;
      await exam.save();
    } else {
      // Deactivate all others, activate this one
      await Exam.updateMany({ isActive: true }, { isActive: false });
      exam.isActive = true;
      exam.status = "Published";
      await exam.save();
    }

    return res.status(200).json({
      success: true,
      message: exam.isActive
        ? "Exam activated successfully."
        : "Exam deactivated successfully.",
      data: exam,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to toggle exam status.",
      error: error.message,
    });
  }
};

// Get the currently active exam (for user-side)
export const getActiveExam = async (req, res) => {
  try {
    const exam = await Exam.findOne({ isActive: true });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "No active exam found.",
      });
    }

    // Return full exam data including correctAnswer for client-side scoring
    return res.status(200).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch active exam.",
      error: error.message,
    });
  }
};
