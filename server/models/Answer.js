import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema(
  {
    legacyId: { type: Number, unique: true, required: true },
    question_id: { type: Number, required: true },
    answer_text: { type: String, required: true },
    answer_type: { type: String, enum: ["ai", "teacher", "peer"], required: true },
    teacher_id: { type: Number },
    confidence_score: { type: Number },
    helpful_votes: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

export const AnswerModel =
  mongoose.models.Answer || mongoose.model("Answer", AnswerSchema);

