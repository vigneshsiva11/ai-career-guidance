import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectDatabase } from "@/server/config/database";
import { UserModel } from "@/server/models/User";
import { AssessmentModel } from "@/server/models/Assessment";
import { RoadmapModel } from "@/server/models/Roadmap";
import { logUserActivity } from "@/server/utils/activityLogger";

type QAPair = { question: string; answer: string };

const GEMINI_MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
].filter(Boolean) as string[];

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenerativeAI(apiKey);
}

async function generateContentWithModelFallback(prompt: string) {
  const client = getGeminiClient();
  let lastError: unknown = null;

  for (const modelName of GEMINI_MODEL_CANDIDATES) {
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      lastError = error;
      console.warn("[RoadmapGenerate] Gemini model failed", { modelName, error });
    }
  }

  throw lastError || new Error("All Gemini model candidates failed");
}

function parseJsonFromModel(rawText: string) {
  const jsonText = rawText
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(jsonText);
}

async function resolveUser(userId: string) {
  if (String(userId).match(/^[a-f0-9]{24}$/i)) {
    return UserModel.findById(userId);
  }
  return UserModel.findOne({ legacyId: Number(userId) });
}

async function classifyCareerDomain(careerInterest: string) {
  const prompt = `Classify the career "${careerInterest}" into a professional domain.
Return strict JSON only:
{
  "detectedCategory": "string"
}`;

  const response = await generateContentWithModelFallback(prompt);
  const parsed = parseJsonFromModel(response);
  return String(parsed.detectedCategory || "").trim() || "General";
}

async function generateRoadmap(params: {
  careerInterest: string;
  detectedCategory: string;
  answers: QAPair[];
  strengthProfile: string;
  persona: string;
}) {
  const { careerInterest, detectedCategory, answers, strengthProfile, persona } = params;

  const systemPrompt = `You are a professional AI Career Roadmap Generator.

Generate a detailed, domain-specific roadmap strictly based on the user's selected career.

Rules:
- Do NOT generate generic corporate or tech roadmap unless career is tech.
- Make roadmap specific to the career domain.
- Include realistic practical steps.
- Do NOT include unrelated suggestions.
- Structure output as:
  - Strength Profile (2-3 lines)
  - Career Persona (1 short label)
  - Beginner Stage (bullet list)
  - Intermediate Stage (bullet list)
  - Advanced Stage (bullet list)
- Make roadmap actionable and industry-specific.

Special rule for career "cricketer":
- Include academy training, physical fitness training, match participation,
  skill specialization (batting/bowling/fielding), state/national trials,
  coaching exposure, and performance analytics.
- Do NOT include portfolios, internships, corporate jobs, software development, or job applications.

Return strict JSON only:
{
  "strengthProfile": "string",
  "careerPersona": "string",
  "roadmap": {
    "beginner": ["string"],
    "intermediate": ["string"],
    "advanced": ["string"]
  }
}`;

  const userPrompt = `Career: ${careerInterest}
Category: ${detectedCategory}
Existing Strength Profile: ${strengthProfile || "Not available"}
Existing Persona: ${persona || "Not available"}

Assessment Answers:
${JSON.stringify(answers)}

Generate a complete structured roadmap.`;

  console.log("Career:", careerInterest);
  console.log("Answers:", answers);

  const response = await generateContentWithModelFallback(`${systemPrompt}\n\n${userPrompt}`);
  console.log("Gemini response:", response);

  if (!response || !response.trim()) {
    throw new Error("Gemini returned empty roadmap response");
  }

  const parsed = parseJsonFromModel(response);

  const normalized = {
    strengthProfile: String(parsed.strengthProfile || "").trim(),
    careerPersona: String(parsed.careerPersona || "").trim(),
    roadmap: {
      beginner: Array.isArray(parsed.roadmap?.beginner)
        ? parsed.roadmap.beginner.map(String).filter(Boolean)
        : [],
      intermediate: Array.isArray(parsed.roadmap?.intermediate)
        ? parsed.roadmap.intermediate.map(String).filter(Boolean)
        : [],
      advanced: Array.isArray(parsed.roadmap?.advanced)
        ? parsed.roadmap.advanced.map(String).filter(Boolean)
        : [],
    },
  };

  if (
    !normalized.strengthProfile ||
    !normalized.careerPersona ||
    (normalized.roadmap.beginner.length === 0 &&
      normalized.roadmap.intermediate.length === 0 &&
      normalized.roadmap.advanced.length === 0)
  ) {
    throw new Error("Gemini response missing required roadmap fields");
  }

  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = String(body?.userId || "").trim();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 }
      );
    }

    await connectDatabase();

    const user = await resolveUser(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const assessment = await AssessmentModel.findOne({ userId: user._id });
    if (!assessment) {
      return NextResponse.json(
        { success: false, error: "Assessment not found for this user" },
        { status: 400 }
      );
    }

    const answers = (assessment.answers || []) as QAPair[];
    if (!answers.length) {
      return NextResponse.json(
        { success: false, error: "Assessment answers not found" },
        { status: 400 }
      );
    }

    const careerInterest = String(
      assessment.suggestedCareer || answers[0]?.answer || ""
    ).trim();
    if (!careerInterest) {
      return NextResponse.json(
        { success: false, error: "Career interest not found in assessment" },
        { status: 400 }
      );
    }

    const detectedCategory = await classifyCareerDomain(careerInterest);
    const generated = await generateRoadmap({
      careerInterest,
      detectedCategory,
      answers,
      strengthProfile: String(assessment.strengthProfile || ""),
      persona: String(assessment.persona || ""),
    });

    assessment.strengthProfile = generated.strengthProfile;
    assessment.persona = generated.careerPersona;
    assessment.suggestedCareer = careerInterest;
    assessment.isCompleted = true;
    await assessment.save();

    await RoadmapModel.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        careerTitle: careerInterest,
        stages: generated.roadmap,
        generatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await UserModel.updateOne(
      { _id: user._id },
      { $set: { assessmentCompleted: true } }
    );

    await logUserActivity(String(user._id), "ROADMAP_GENERATED", {
      source: "roadmap_generate_api",
      career: careerInterest,
      category: detectedCategory,
      persona: generated.careerPersona,
    });

    return NextResponse.json({
      success: true,
      data: {
        strengthProfile: generated.strengthProfile,
        careerPersona: generated.careerPersona,
        suggestedCareerPath: careerInterest,
        roadmap: generated.roadmap,
      },
    });
  } catch (error) {
    console.error("Roadmap generate API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate roadmap",
      },
      { status: 500 }
    );
  }
}

