import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema(
  {
    legacyId: { type: Number, unique: true, required: true },
    user_id: { type: Number, required: true },
    subject_id: { type: Number },
    question_text: { type: String, required: true },
    question_type: { type: String, enum: ["text", "image", "voice"], default: "text" },
    image_url: { type: String },
    audio_url: { type: String },
    language: { type: String, default: "en" },
    response_language: { type: String, default: "en" },
    status: { type: String, enum: ["pending", "answered", "escalated"], default: "pending" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

export const QuestionModel =
  mongoose.models.Question || mongoose.model("Question", QuestionSchema);

