import mongoose from "mongoose";

const roundReviewSchema = new mongoose.Schema(
  {
    rating: { type: String, default: "" },
    comments: { type: String, default: "" },
    interviewer: { type: String, default: "" },
    status: {
      type: String,
      enum: ["", "in progress", "completed", "drop", "rejected"],
      default: "",
    },
    managerialStatus: {
      type: String,
      enum: ["", "GO", "HOLD", "NO GO"],
      default: "",
    },
  },
  { _id: false }
);

const quizResultSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    mobileNumber: { type: String },
    name: { type: String },
    sectionWiseMarks: [
      {
        sectionName: { type: String, required: true },
        marks: { type: Number, required: true },
        totalQuestions: { type: Number, required: true },
        correctAnswers: { type: Number, required: true },
      },
    ],
    totalMarks: { type: Number, required: true },
    R2: { type: [roundReviewSchema], default: [] },
    R3: { type: [roundReviewSchema], default: [] },
    R4: { type: [roundReviewSchema], default: [] },
    examDate: { type: Date, default: Date.now },
    driveId: { type: mongoose.Schema.Types.ObjectId, ref: "Drive", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("QuizResult", quizResultSchema);
