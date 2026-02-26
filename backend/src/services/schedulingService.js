import Schedule from "../models/Schedule.js";
import User from "../models/User.js";

/**
 * Generate time slots between start and end hours
 */
function generateTimeSlots(startHour, endHour, duration) {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += duration) {
      slots.push(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
      );
    }
  }
  return slots;
}

/**
 * Add minutes to a time string "HH:MM"
 */
function addMinutes(time, minutes) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Get day abbreviation from date
 */
function getDayName(date) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
    new Date(date).getDay()
  ];
}

/**
 * Auto-distribute candidates among available interviewers using round-robin
 * with load balancing
 */
export async function autoSchedule({
  driveId,
  candidateIds,
  round,
  date,
  startHour = 10,
  endHour = 18,
  slotDuration = 30,
  createdBy = null,
}) {
  // Get available interviewers for this drive
  const interviewers = await User.find({
    isActive: true,
    $or: [{ drives: driveId }, { drives: { $size: 0 } }],
  }).populate("role");

  // Filter to interviewers who have scheduling-related permissions or are admins
  const eligibleInterviewers = interviewers.filter((i) => {
    if (!i.role) return false;
    // Level 0-2 can conduct interviews (Super Admin, Admin, Manager)
    return i.role.level <= 2;
  });

  if (eligibleInterviewers.length === 0) {
    throw new Error("No interviewers available for the selected date and drive.");
  }

  const dayName = getDayName(date);

  // Get existing schedules for the date to avoid conflicts
  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(date);
  dateEnd.setHours(23, 59, 59, 999);

  const existingSchedules = await Schedule.find({
    scheduledDate: { $gte: dateStart, $lte: dateEnd },
    status: { $nin: ["cancelled"] },
  });

  // Build availability grid for each interviewer
  const interviewerSlots = eligibleInterviewers.map((interviewer) => {
    // Get this interviewer's availability for the day
    const dayAvail = interviewer.availability?.find((a) => a.day === dayName);
    const iStartHour = dayAvail
      ? parseInt(dayAvail.startTime.split(":")[0])
      : startHour;
    const iEndHour = dayAvail
      ? parseInt(dayAvail.endTime.split(":")[0])
      : endHour;

    const slots = generateTimeSlots(iStartHour, iEndHour, slotDuration);

    // Remove already booked slots
    const busySlots = existingSchedules
      .filter((s) => s.interviewerId.toString() === interviewer._id.toString())
      .map((s) => s.startTime);

    return {
      interviewer,
      availableSlots: slots.filter((s) => !busySlots.includes(s)),
      currentLoad: busySlots.length,
    };
  });

  // Sort by current load (least busy first) for even distribution
  interviewerSlots.sort((a, b) => a.currentLoad - b.currentLoad);

  const scheduled = [];
  const waitlisted = [];
  let interviewerIndex = 0;

  for (const candidateId of candidateIds) {
    // Check if this candidate is already scheduled for this round
    const existingForCandidate = await Schedule.findOne({
      candidateId,
      round,
      status: { $nin: ["cancelled"] },
    });

    if (existingForCandidate) {
      waitlisted.push({
        candidateId,
        reason: `Already scheduled for ${round}`,
      });
      continue;
    }

    let assigned = false;
    let attempts = 0;

    while (!assigned && attempts < eligibleInterviewers.length) {
      const current =
        interviewerSlots[interviewerIndex % interviewerSlots.length];

      if (current.availableSlots.length > 0) {
        const slot = current.availableSlots.shift();
        const endTime = addMinutes(slot, slotDuration);

        try {
          const schedule = await Schedule.create({
            driveId,
            candidateId,
            interviewerId: current.interviewer._id,
            round,
            scheduledDate: date,
            startTime: slot,
            endTime,
            duration: slotDuration,
            createdBy,
          });

          scheduled.push(schedule);
          current.currentLoad++;
          assigned = true;
        } catch (err) {
          // Duplicate index error — skip
          if (err.code === 11000) {
            attempts++;
            interviewerIndex++;
            continue;
          }
          throw err;
        }
      }

      interviewerIndex++;
      attempts++;
    }

    if (!assigned) {
      waitlisted.push({
        candidateId,
        reason: "No available time slots",
      });
    }
  }

  return { scheduled, waitlisted };
}

/**
 * Get interviewer's schedule for a specific date
 */
export async function getInterviewerSchedule(interviewerId, date) {
  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(date);
  dateEnd.setHours(23, 59, 59, 999);

  return Schedule.find({
    interviewerId,
    scheduledDate: { $gte: dateStart, $lte: dateEnd },
    status: { $nin: ["cancelled"] },
  })
    .populate("candidateId", "firstName lastName email phone")
    .sort({ startTime: 1 });
}

/**
 * Get candidate's schedule
 */
export async function getCandidateSchedule(candidateId) {
  return Schedule.find({
    candidateId,
    status: { $nin: ["cancelled"] },
  })
    .populate("interviewerId", "name email")
    .sort({ scheduledDate: 1 });
}

/**
 * Get all schedules for a drive on a date
 */
export async function getDriveSchedule(driveId, date) {
  const query = { status: { $nin: ["cancelled"] } };
  if (driveId) query.driveId = driveId;

  if (date) {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);
    query.scheduledDate = { $gte: dateStart, $lte: dateEnd };
  }

  return Schedule.find(query)
    .populate("candidateId", "firstName lastName email phone")
    .populate("interviewerId", "name email")
    .sort({ scheduledDate: 1, startTime: 1 });
}
