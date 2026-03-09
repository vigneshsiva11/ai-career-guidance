import mongoose from "mongoose";

const CareerProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    selectedRole: { type: String, default: "" },
    educationLevel: { type: String, default: "" },
    fieldOfStudy: { type: String, default: "" },
    experienceLevel: { type: String, default: "" },
    learningGoal: { type: String, default: "" },
    roleSkills: { type: [String], default: [] },
    skillLevels: {
      type: Map,
      of: { type: String, enum: ["Beginner", "Intermediate", "Advanced"] },
      default: {},
    },
    strongSkills: { type: [String], default: [] },
    weakSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    domainExpertiseScore: { type: Number, default: 0 },
    practicalExposureScore: { type: Number, default: 0 },
    communicationScore: { type: Number, default: 0 },
    executionDisciplineScore: { type: Number, default: 0 },
    recommendedSkills: { type: [String], default: [] },
    recommendedActions: { type: [String], default: [] },
    completedSkills: { type: [String], default: [] },
    completedSteps: { type: [String], default: [] },
    completedTasks: { type: [String], default: [] },
    roadmapProgress: {
      beginnerCompleted: { type: Boolean, default: false },
      intermediateCompleted: { type: Boolean, default: false },
      advancedCompleted: { type: Boolean, default: false },
    },
    lastProfileUpdate: { type: Date, default: Date.now },
    analysisSource: { type: String, default: "rule_based" },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const CareerProgressModel =
  mongoose.models.CareerProgress ||
  mongoose.model("CareerProgress", CareerProgressSchema);
