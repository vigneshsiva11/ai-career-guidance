import mongoose from "mongoose";

const ChatHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    messages: {
      type: [
        {
          role: { type: String, enum: ["user", "assistant", "system"], required: true },
          content: { type: String, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ChatHistoryModel =
  mongoose.models.ChatHistory || mongoose.model("ChatHistory", ChatHistorySchema);

