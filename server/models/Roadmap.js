import mongoose from "mongoose";

const RoadmapSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    careerTitle: { type: String, required: true },
    stages: {
      beginner: { type: [String], default: [] },
      intermediate: { type: [String], default: [] },
      advanced: { type: [String], default: [] },
    },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const RoadmapModel =
  mongoose.models.Roadmap || mongoose.model("Roadmap", RoadmapSchema);

