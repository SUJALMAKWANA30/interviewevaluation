import Schedule from "../models/Schedule.js";
import {
  autoSchedule,
  getInterviewerSchedule,
  getCandidateSchedule,
  getDriveSchedule,
} from "../services/schedulingService.js";
import {
  sendInterviewSchedule,
  sendInterviewerNotification,
} from "../services/notificationService.js";
import CandidateDetails from "../models/CandidateDetails.js";
import User from "../models/User.js";

/**
 * Auto-schedule candidates to available interviewers
 */
export const autoScheduleCandidates = async (req, res) => {
  try {
    const {
      candidateIds,
      round,
      date,
      driveId,
      startHour,
      endHour,
      slotDuration,
    } = req.body;

    if (!candidateIds || !candidateIds.length) {
      return res.status(400).json({
        success: false,
        message: "At least one candidate is required.",
      });
    }

    const result = await autoSchedule({
      driveId: driveId || null,
      candidateIds,
      round,
      date,
      startHour: startHour || 10,
      endHour: endHour || 18,
      slotDuration: slotDuration || 30,
      createdBy: req.user?.id || null,
    });

    // Audit log
    if (req.audit) {
      await req.audit("schedule.auto_assign", {
        targetType: "Schedule",
        description: `Auto-scheduled ${result.scheduled.length} interviews for ${round} on ${date}. ${result.waitlisted.length} waitlisted.`,
      });
    }

    // Send notifications (non-blocking)
    sendNotificationsForSchedules(result.scheduled).catch((err) =>
      console.error("Notification error:", err.message)
    );

    res.status(201).json({
      success: true,
      message: `Scheduled ${result.scheduled.length} interview(s). ${result.waitlisted.length} waitlisted.`,
      data: {
        scheduled: result.scheduled,
        waitlisted: result.waitlisted,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Auto-scheduling failed.",
      error: error.message,
    });
  }
};

/**
 * Create a single manual schedule
 */
export const createSchedule = async (req, res) => {
  try {
    const {
      candidateId,
      interviewerId,
      round,
      scheduledDate,
      startTime,
      endTime,
      duration,
      driveId,
      meetingLink,
      location,
      roomNumber,
      notes,
    } = req.body;

    const schedule = await Schedule.create({
      driveId: driveId || null,
      candidateId,
      interviewerId,
      round,
      scheduledDate,
      startTime,
      endTime,
      duration: duration || 30,
      meetingLink: meetingLink || "",
      location: location || "",
      roomNumber: roomNumber || "",
      notes: notes || "",
      createdBy: req.user?.id || null,
    });

    if (req.audit) {
      await req.audit("schedule.create", {
        targetType: "Schedule",
        targetId: schedule._id,
        description: `Created schedule for ${round}`,
      });
    }

    // Send notification
    sendNotificationsForSchedules([schedule]).catch(() => {});

    const populated = await Schedule.findById(schedule._id)
      .populate("candidateId", "firstName lastName email phone")
      .populate("interviewerId", "name email");

    res.status(201).json({
      success: true,
      message: "Schedule created successfully.",
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Scheduling conflict: this slot is already booked.",
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to create schedule.",
      error: error.message,
    });
  }
};

/**
 * Get all schedules (with filters)
 */
export const getAllSchedules = async (req, res) => {
  try {
    const { driveId, date, round, interviewerId, status } = req.query;
    const query = {};

    if (driveId) query.driveId = driveId;
    if (round) query.round = round;
    if (interviewerId) query.interviewerId = interviewerId;
    if (status) query.status = status;

    if (date) {
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);
      query.scheduledDate = { $gte: dateStart, $lte: dateEnd };
    }

    const schedules = await Schedule.find(query)
      .populate("candidateId", "firstName lastName email phone")
      .populate("interviewerId", "name email")
      .populate("createdBy", "name")
      .sort({ scheduledDate: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch schedules.",
      error: error.message,
    });
  }
};

/**
 * Get schedule by ID
 */
export const getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate("candidateId", "firstName lastName email phone documents")
      .populate("interviewerId", "name email")
      .populate("createdBy", "name");

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch schedule.",
      error: error.message,
    });
  }
};

/**
 * Update schedule status
 */
export const updateSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found.",
      });
    }

    const allowedUpdates = [
      "status",
      "startTime",
      "endTime",
      "scheduledDate",
      "meetingLink",
      "location",
      "roomNumber",
      "notes",
    ];

    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updated = await Schedule.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate("candidateId", "firstName lastName email phone")
      .populate("interviewerId", "name email");

    if (req.audit) {
      await req.audit("schedule.update", {
        targetType: "Schedule",
        targetId: updated._id,
        description: `Updated schedule status to ${updates.status || "modified"}`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Schedule updated successfully.",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update schedule.",
      error: error.message,
    });
  }
};

/**
 * Cancel a schedule
 */
export const cancelSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found.",
      });
    }

    schedule.status = "cancelled";
    await schedule.save();

    if (req.audit) {
      await req.audit("schedule.cancel", {
        targetType: "Schedule",
        targetId: schedule._id,
        description: `Cancelled schedule for round ${schedule.round}`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Schedule cancelled.",
      data: schedule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to cancel schedule.",
      error: error.message,
    });
  }
};

/**
 * Get interviewer's schedule for a date
 */
export const getMySchedule = async (req, res) => {
  try {
    const { date } = req.query;
    const interviewerId = req.user.id;

    const schedules = await getInterviewerSchedule(
      interviewerId,
      date || new Date()
    );

    res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch your schedule.",
      error: error.message,
    });
  }
};

/**
 * Get scheduling stats/summary
 */
export const getScheduleStats = async (req, res) => {
  try {
    const { driveId } = req.query;
    const filter = {};
    if (driveId) filter.driveId = driveId;

    const [total, scheduled, completed, cancelled, inProgress] =
      await Promise.all([
        Schedule.countDocuments(filter),
        Schedule.countDocuments({ ...filter, status: "scheduled" }),
        Schedule.countDocuments({ ...filter, status: "completed" }),
        Schedule.countDocuments({ ...filter, status: "cancelled" }),
        Schedule.countDocuments({ ...filter, status: "in-progress" }),
      ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        scheduled,
        completed,
        cancelled,
        inProgress,
        noShow: total - scheduled - completed - cancelled - inProgress,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch schedule stats.",
      error: error.message,
    });
  }
};

/**
 * Helper: Send notifications for newly created schedules
 */
async function sendNotificationsForSchedules(schedules) {
  for (const schedule of schedules) {
    try {
      const candidate = await CandidateDetails.findById(schedule.candidateId);
      const interviewer = await User.findById(schedule.interviewerId);

      if (candidate && interviewer) {
        await sendInterviewSchedule(candidate, schedule, interviewer);
        await Schedule.findByIdAndUpdate(schedule._id, {
          candidateNotified: true,
          interviewerNotified: true,
        });
      }
    } catch (err) {
      console.error("Notification send error:", err.message);
    }
  }
}
