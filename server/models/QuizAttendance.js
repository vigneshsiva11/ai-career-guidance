import mongoose from "mongoose";

const QuizAttendanceSchema = new mongoose.Schema(
  {
    legacyId: { type: Number, unique: true, required: true },
    student_id: { type: Number, required: true },
    quiz_id: { type: String, required: true },
    subject: { type: String, required: true },
    level: { type: String, required: true },
    attended_at: { type: String, required: true },
    completed_at: { type: String },
    status: {
      type: String,
      enum: ["attended", "completed", "abandoned"],
      default: "attended",
    },
    score: { type: Number },
    total_questions: { type: Number },
    completion_time: { type: Number },
  },
  { timestamps: false }
);

export const QuizAttendanceModel =
  mongoose.models.QuizAttendance ||
  mongoose.model("QuizAttendance", QuizAttendanceSchema);

