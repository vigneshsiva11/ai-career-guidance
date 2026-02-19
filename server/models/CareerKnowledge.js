import mongoose from "mongoose";

const CareerKnowledgeSchema = new mongoose.Schema(
  {
    roleName: { type: String, required: true, unique: true, index: true },
    roleKey: { type: String, required: true, index: true },
    roleOverview: { type: String, required: true },
    requiredSkills: { type: [String], default: [] },
    beginnerStage: { type: [String], default: [] },
    intermediateStage: { type: [String], default: [] },
    advancedStage: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    realWorldProjects: { type: [String], default: [] },
    careerOpportunities: { type: [String], default: [] },
    salaryInsights: { type: String, default: "" },
    content: { type: String, required: true },
    embedding: { type: [Number], default: [] },
    embeddingProvider: { type: String, default: "unknown", index: true },
    embeddingModel: { type: String, default: "unknown", index: true },
    embeddingDimension: { type: Number, default: 0, index: true },
    embeddingUsedFallback: { type: Boolean, default: false, index: true },
    embeddingGeneratedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

CareerKnowledgeSchema.pre("save", function preSave(next) {
  this.updatedAt = new Date();
  next();
});

export const CareerKnowledgeModel =
  mongoose.models.CareerKnowledge ||
  mongoose.model("CareerKnowledge", CareerKnowledgeSchema);
