import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    driveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drive",
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CandidateDetails",
      required: true,
    },
    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    round: {
      type: String,
      enum: ["R2", "R3", "R4"],
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      // e.g., "10:00"
    },
    endTime: {
      type: String,
      required: true,
      // e.g., "10:30"
    },
    duration: {
      type: Number,
      default: 30,
      // in minutes
    },
    status: {
      type: String,
      enum: [
        "scheduled",
        "in-progress",
        "completed",
        "cancelled",
        "no-show",
        "rescheduled",
      ],
      default: "scheduled",
    },
    // Meeting details
    meetingLink: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    roomNumber: {
      type: String,
      default: "",
    },
    // Notifications
    candidateNotified: {
      type: Boolean,
      default: false,
    },
    interviewerNotified: {
      type: Boolean,
      default: false,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: "",
    },
    rescheduledFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent double-booking interviewer
scheduleSchema.index(
  { interviewerId: 1, scheduledDate: 1, startTime: 1 },
  { unique: true }
);
// One schedule per candidate per round
scheduleSchema.index({ candidateId: 1, round: 1 }, { unique: true });
// Query indexes
scheduleSchema.index({ driveId: 1, scheduledDate: 1 });
scheduleSchema.index({ status: 1 });

export default mongoose.model("Schedule", scheduleSchema);
