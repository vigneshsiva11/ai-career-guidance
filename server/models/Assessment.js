import mongoose from "mongoose";

const AssessmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    assessmentStep: { type: Number, default: 0 },
    currentQuestion: { type: String, default: "" },
    isCompleted: { type: Boolean, default: false },
    fallbackQuestionUsed: { type: Boolean, default: false },
    answers: {
      type: [
        {
          question: { type: String, required: true },
          answer: { type: String, required: true },
        },
      ],
      default: [],
    },
    conversationHistory: {
      type: [
        {
          role: { type: String, enum: ["user", "assistant", "system"], required: true },
          content: { type: String, required: true },
        },
      ],
      default: [],
    },
    strengthProfile: { type: String, default: "" },
    persona: { type: String, default: "" },
    suggestedCareer: { type: String, default: "" },
    skillGapPreview: {
      type: [
        {
          skill: { type: String, required: true },
          gap: { type: Number, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AssessmentModel =
  mongoose.models.Assessment || mongoose.model("Assessment", AssessmentSchema);
