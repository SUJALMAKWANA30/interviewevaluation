import mongoose from "mongoose";

const roundSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["Exam", "Interview"],
      default: "Interview",
    },
    order: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const examCenterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    lon: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    radiusMeters: {
      type: Number,
      required: true,
      min: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const driveSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    date: {
      type: Date,
      default: null,
    },
    rounds: {
      type: [roundSchema],
      default: [
        { name: "R1", type: "Exam", order: 1 },
        { name: "R2", type: "Interview", order: 2 },
        { name: "R3", type: "Interview", order: 3 },
        { name: "R4", type: "Interview", order: 4 },
      ],
    },
    examCenters: {
      type: [examCenterSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Drive", driveSchema);
