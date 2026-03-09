import mongoose from "mongoose";

const QuestionHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    modelUsed: { type: String, default: "gemini" },
    category: { type: String, default: "" },
  },
  { timestamps: true }
);

export const QuestionHistoryModel =
  mongoose.models.QuestionHistory ||
  mongoose.model("QuestionHistory", QuestionHistorySchema);

