import Drive from "../models/Drive.js";

// Create a new drive
export const createDrive = async (req, res) => {
  try {
    const { name, location, description, date, rounds, examCenters } = req.body;

    if (!name || !location) {
      return res.status(400).json({
        success: false,
        message: "Name and location are required.",
      });
    }

    const driveData = {
      name,
      location,
      description: description || "",
      date: date || null,
      examCenters: Array.isArray(examCenters) ? examCenters : [],
      isActive: true,
    };

    // If rounds are provided, validate and add them
    if (Array.isArray(rounds) && rounds.length > 0) {
      driveData.rounds = rounds.map((r, i) => ({
        name: r.name || `R${i + 1}`,
        type: r.type || "Interview",
        order: r.order ?? i + 1,
      }));
    }

    const drive = new Drive(driveData);

    await drive.save();

    return res.status(201).json({
      success: true,
      message: "Drive created successfully.",
      data: drive,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create drive.",
      error: error.message,
    });
  }
};

// Get all drives
export const getAllDrives = async (req, res) => {
  try {
    const drives = await Drive.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: drives,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch drives.",
      error: error.message,
    });
  }
};

// Get only active drives (for candidate registration dropdown)
export const getActiveDrives = async (req, res) => {
  try {
    const drives = await Drive.find({ isActive: true }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: drives,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch active drives.",
      error: error.message,
    });
  }
};

// Get a single drive by ID
export const getDriveById = async (req, res) => {
  try {
    const drive = await Drive.findById(req.params.id);

    if (!drive) {
      return res.status(404).json({
        success: false,
        message: "Drive not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: drive,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch drive.",
      error: error.message,
    });
  }
};

// Update a drive
export const updateDrive = async (req, res) => {
  try {
    const { name, location, description, date, rounds, examCenters } = req.body;

    const updateData = { name, location, description, date, examCenters };

    // If rounds are provided, validate and update them
    if (Array.isArray(rounds)) {
      updateData.rounds = rounds.map((r, i) => ({
        name: r.name || `R${i + 1}`,
        type: r.type || "Interview",
        order: r.order ?? i + 1,
      }));
    }

    const drive = await Drive.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!drive) {
      return res.status(404).json({
        success: false,
        message: "Drive not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Drive updated successfully.",
      data: drive,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update drive.",
      error: error.message,
    });
  }
};

// Toggle active/inactive status
export const toggleDriveStatus = async (req, res) => {
  try {
    const drive = await Drive.findById(req.params.id);

    if (!drive) {
      return res.status(404).json({
        success: false,
        message: "Drive not found.",
      });
    }

    drive.isActive = !drive.isActive;
    await drive.save();

    return res.status(200).json({
      success: true,
      message: drive.isActive
        ? "Drive activated successfully."
        : "Drive deactivated successfully.",
      data: drive,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to toggle drive status.",
      error: error.message,
    });
  }
};

// Delete a drive
export const deleteDrive = async (req, res) => {
  try {
    const drive = await Drive.findByIdAndDelete(req.params.id);

    if (!drive) {
      return res.status(404).json({
        success: false,
        message: "Drive not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Drive deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete drive.",
      error: error.message,
    });
  }
};
