import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { connectDatabase } from "@/server/config/database";
import { CareerKnowledgeModel } from "@/server/models/CareerKnowledge";
import { generateEmbeddingWithMeta } from "@/lib/embeddings";

type CareerDoc = {
  roleName: string;
  roleOverview: string;
  requiredSkills: string[];
  beginnerStage: string[];
  intermediateStage: string[];
  advancedStage: string[];
  certifications: string[];
  realWorldProjects: string[];
  careerOpportunities: string[];
  salaryInsights: string;
};

dotenv.config({ path: ".env.local" });
dotenv.config();

function toRoleKey(roleName: string): string {
  return roleName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildContent(doc: CareerDoc): string {
  return [
    `Role: ${doc.roleName}`,
    `Role Overview: ${doc.roleOverview}`,
    `Required Skills: ${doc.requiredSkills.join(", ")}`,
    `Beginner Stage: ${doc.beginnerStage.join(" | ")}`,
    `Intermediate Stage: ${doc.intermediateStage.join(" | ")}`,
    `Advanced Stage: ${doc.advancedStage.join(" | ")}`,
    `Certifications: ${doc.certifications.join(", ")}`,
    `Real-world Projects: ${doc.realWorldProjects.join(" | ")}`,
    `Career Opportunities: ${doc.careerOpportunities.join(", ")}`,
    `Salary Insights: ${doc.salaryInsights}`,
  ].join("\n");
}

async function main() {
  const basePath = path.join(process.cwd(), "career-knowledge");
  if (!fs.existsSync(basePath)) {
    throw new Error(`career-knowledge folder not found at ${basePath}`);
  }

  const files = fs
    .readdirSync(basePath)
    .filter((name) => name.toLowerCase().endsWith(".json"));

  if (files.length === 0) {
    throw new Error("No JSON files found in career-knowledge");
  }

  await connectDatabase();
  console.log("[ingest-career-data] Clearing existing CareerKnowledge collection for clean re-ingest...");
  await CareerKnowledgeModel.deleteMany({});

  for (const fileName of files) {
    const fullPath = path.join(basePath, fileName);
    const raw = fs.readFileSync(fullPath, "utf-8");
    const doc = JSON.parse(raw) as CareerDoc;

    if (!doc.roleName || !doc.roleOverview) {
      console.warn(`[ingest-career-data] Skipping invalid file: ${fileName}`);
      continue;
    }

    const content = buildContent(doc);
    const embeddingResult = await generateEmbeddingWithMeta(content, {
      allowLocalFallback: false,
    });

    await CareerKnowledgeModel.findOneAndUpdate(
      { roleName: doc.roleName },
      {
        roleName: doc.roleName,
        roleKey: toRoleKey(doc.roleName),
        roleOverview: doc.roleOverview,
        requiredSkills: doc.requiredSkills || [],
        beginnerStage: doc.beginnerStage || [],
        intermediateStage: doc.intermediateStage || [],
        advancedStage: doc.advancedStage || [],
        certifications: doc.certifications || [],
        realWorldProjects: doc.realWorldProjects || [],
        careerOpportunities: doc.careerOpportunities || [],
        salaryInsights: doc.salaryInsights || "",
        content,
        embedding: embeddingResult.vector,
        embeddingProvider: embeddingResult.metadata.provider,
        embeddingModel: embeddingResult.metadata.model,
        embeddingDimension: embeddingResult.metadata.dimension,
        embeddingUsedFallback: embeddingResult.metadata.usedFallback,
        embeddingGeneratedAt: new Date(),
        updatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(
      `[ingest-career-data] Upserted ${doc.roleName} (model=${embeddingResult.metadata.model}, dim=${embeddingResult.metadata.dimension})`
    );
  }

  console.log(`[ingest-career-data] Completed. Processed ${files.length} files.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[ingest-career-data] Failed:", error);
    process.exit(1);
  });
