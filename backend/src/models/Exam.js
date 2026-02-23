import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: { type: String, default: "" },
  options: [{ type: String }],
  correctAnswer: { type: Number, default: 0 },
});

const sectionSchema = new mongoose.Schema({
  title: { type: String, default: "Untitled Section" },
  duration: { type: Number, default: 10 },
  questions: [questionSchema],
});

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    duration: { type: Number, default: 30 },
    sections: [sectionSchema],
    isActive: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["Draft", "Published"],
      default: "Draft",
    },
    createdBy: { type: String, default: "" },
  },
  { timestamps: true }
);

// Ensure only one exam can be active at a time
examSchema.pre("save", async function () {
  if (this.isActive) {
    await mongoose.model("Exam").updateMany(
      { _id: { $ne: this._id }, isActive: true },
      { isActive: false }
    );
  }
});

export default mongoose.model("Exam", examSchema);
