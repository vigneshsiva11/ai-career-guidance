import mongoose from "mongoose";

const ResumeAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resumeFileName: { type: String, default: "" },
    resumeText: { type: String, default: "" },
    matchedSkills: { type: [String], default: [] },
    weakSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    jobSuggestions: {
      type: [
        {
          jobTitle: { type: String, default: "" },
          description: { type: String, default: "" },
          linkedInUrl: { type: String, default: "" },
          requiredSkills: { type: [String], default: [] },
          missingSkills: { type: [String], default: [] },
        },
      ],
      default: [],
    },
    suggestions: { type: [String], default: [] },
    selectedRole: { type: String, default: "" },
    relevantSkills: { type: [String], default: [] },
    skillImprovementPlan: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const ResumeAnalysisModel =
  mongoose.models.ResumeAnalysis ||
  mongoose.model("ResumeAnalysis", ResumeAnalysisSchema, "resume_analysis");
