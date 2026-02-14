import mongoose from "mongoose";

const ReplySchema = new mongoose.Schema(
  {
    legacyId: { type: Number, unique: true, required: true },
    question_id: { type: Number, required: true },
    user_id: { type: Number, required: true },
    text: { type: String, required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

export const ReplyModel =
  mongoose.models.Reply || mongoose.model("Reply", ReplySchema);

