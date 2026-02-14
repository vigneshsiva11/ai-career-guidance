import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    activityType: {
      type: String,
      enum: [
        "LOGIN",
        "ASSESSMENT_START",
        "QUESTION_ANSWERED",
        "ROADMAP_GENERATED",
        "CHAT_MESSAGE",
        "SKILL_GAP_CHECK",
        "LOGOUT",
      ],
      required: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const ActivityLogModel =
  mongoose.models.ActivityLog || mongoose.model("ActivityLog", ActivityLogSchema);

