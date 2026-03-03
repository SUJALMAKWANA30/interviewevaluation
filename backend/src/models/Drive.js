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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Drive", driveSchema);
