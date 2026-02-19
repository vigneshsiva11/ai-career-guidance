import mongoose from "mongoose";

const RoadmapSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    careerTitle: { type: String, required: true },
    targetRole: { type: String, default: "" },
    stages: {
      beginner: { type: [String], default: [] },
      intermediate: { type: [String], default: [] },
      advanced: { type: [String], default: [] },
    },
    stageDetails: {
      type: [
        {
          stageName: { type: String, required: true },
          skills: { type: [String], default: [] },
          projects: { type: [String], default: [] },
          duration: { type: String, default: "" },
        },
      ],
      default: [],
    },
    readinessScore: { type: Number, default: 0 },
    estimatedTimeline: { type: String, default: "" },
    toolsToLearn: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    realWorldProjects: { type: [String], default: [] },
    portfolioRequirements: { type: [String], default: [] },
    interviewPreparationTopics: { type: [String], default: [] },
    requiredTechnicalSkills: { type: [String], default: [] },
    requiredSoftSkills: { type: [String], default: [] },
    internshipStrategy: { type: [String], default: [] },
    freelancingStrategy: { type: [String], default: [] },
    salaryInsight: { type: String, default: "" },
    jobPlatformsToApply: { type: [String], default: [] },
    resumeTips: { type: [String], default: [] },
    jobReadyChecklist: { type: [String], default: [] },
    source: { type: String, default: "rule_based_assessment" },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const RoadmapModel =
  mongoose.models.Roadmap || mongoose.model("Roadmap", RoadmapSchema);
