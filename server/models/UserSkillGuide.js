  import mongoose from "mongoose";

const UserSkillGuideSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: { type: String, required: true, default: "" },
    skillName: { type: String, required: true, default: "" },
    skillKey: { type: String, required: true, default: "" },
    guide: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      topics: { type: [String], default: [] },
      youtubePlaylists: { type: [String], default: [] },
      advice: { type: [String], default: [] },
    },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserSkillGuideSchema.index(
  { userId: 1, role: 1, skillKey: 1 },
  { unique: true, name: "uniq_user_role_skill" }
);

export const UserSkillGuideModel =
  mongoose.models.UserSkillGuide ||
  mongoose.model("UserSkillGuide", UserSkillGuideSchema);

