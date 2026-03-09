import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  ProgressTrackerAnalysis,
  ProgressTrackerProfile,
  SkillLevel,
} from "@/lib/progress-tracker";

type AnalyzeInput = {
  role: string;
  profile: ProgressTrackerProfile;
  roleSkills: string[];
};

export type LearningGuide = {
  title: string;
  description: string;
  topics: string[];
  youtubePlaylists: string[];
  advice: string[];
};

function uniqueSkills(skills: string[]) {
  return Array.from(
    new Set(
      skills
        .map((skill) => String(skill || "").trim())
        .filter(Boolean)
    )
  );
}

function extractJson(raw: string) {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) return raw.slice(start, end + 1);
  return raw;
}

function clampScore(value: unknown, fallback = 50) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function levelToScore(level: SkillLevel | undefined) {
  if (level === "Advanced") return 100;
  if (level === "Intermediate") return 65;
  return 30;
}

function buildRuleBasedAnalysis(input: AnalyzeInput): ProgressTrackerAnalysis {
  const { profile, roleSkills } = input;
  const skills = profile.skillLevels || {};

  const missingSkills: string[] = [];
  const weakSkills: string[] = [];
  const strongSkills: string[] = [];

  for (const skill of roleSkills) {
    const level = skills[skill];
    if (!level || level === "Beginner") missingSkills.push(skill);
    else if (level === "Intermediate") weakSkills.push(skill);
    else strongSkills.push(skill);
  }

  const values = roleSkills.map((skill) => levelToScore(skills[skill]));
  const avg =
    values.length > 0
      ? Math.round(values.reduce((sum, item) => sum + item, 0) / values.length)
      : 0;

  return {
    strongSkills,
    weakSkills,
    missingSkills,
    recommendedSkills: [...missingSkills, ...weakSkills].slice(0, 6),
    recommendedActions: [
      "Build 2-3 portfolio projects focused on missing skills.",
      "Practice daily problem-solving and document weekly progress.",
      "Collaborate on Git-based projects to improve execution discipline.",
      "Present your project decisions to improve communication clarity.",
    ],
    metrics: {
      domainExpertise: clampScore(avg),
      practicalExposure: clampScore(avg - 15),
      communication: clampScore(avg - 5),
      executionDiscipline: clampScore(avg - 10),
    },
    generatedAt: new Date().toISOString(),
    source: "rule_based",
  };
}

function fallbackRoleSkills(role: string) {
  const normalized = String(role || "").toLowerCase();
  if (normalized.includes("machine learning") || normalized.includes("ml")) {
    return [
      "Python",
      "Statistics",
      "Machine Learning",
      "Deep Learning",
      "Data Processing",
      "Model Deployment",
    ];
  }
  if (normalized.includes("data scientist")) {
    return [
      "Python",
      "Statistics",
      "Machine Learning",
      "Data Visualization",
      "SQL",
      "Pandas",
    ];
  }
  if (normalized.includes("backend")) {
    return [
      "Node.js",
      "Databases",
      "API Design",
      "System Design",
      "Security",
      "Testing",
    ];
  }
  if (normalized.includes("full stack") || normalized.includes("fullstack")) {
    return [
      "Frontend Development",
      "Backend Development",
      "Databases",
      "API Integration",
      "System Design",
      "Deployment",
    ];
  }
  if (normalized.includes("cyber")) {
    return [
      "Network Security",
      "Threat Analysis",
      "Incident Response",
      "Security Testing",
      "Cloud Security",
      "Compliance",
    ];
  }

  return [
    "Core Fundamentals",
    "Problem Solving",
    "Tools & Workflow",
    "System Understanding",
    "Testing & Quality",
    "Deployment",
  ];
}

export async function generateRoleSkillsWithGemini(role: string): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    return fallbackRoleSkills(role);
  }

  try {
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
Generate the 6 most important core skills required for a ${role}.
Return STRICT JSON only in this schema:
{
  "skills": string[]
}
Rules:
- Exactly 6 skills.
- Keep labels concise (1-4 words each).
- No numbering.
`.trim();

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const raw = (await result.response).text();
    const parsed = JSON.parse(extractJson(raw));
    const skills = Array.isArray(parsed?.skills)
      ? uniqueSkills(parsed.skills.map(String)).slice(0, 6)
      : [];
    if (skills.length >= 4) return skills;
    return fallbackRoleSkills(role);
  } catch (error) {
    console.error("[ProgressTracker] Gemini role skill generation failed:", error);
    return fallbackRoleSkills(role);
  }
}

function fallbackLearningGuide(
  role: string,
  itemType: "skill" | "step",
  itemName: string
): LearningGuide {
  const topicSeed =
    itemType === "step"
      ? [
          "Scope the objective and expected outcome",
          "Break the work into measurable milestones",
          "Build and test a practical implementation",
          "Document decisions and trade-offs",
          "Review and improve with feedback loops",
        ]
      : [
          "Core concepts and terminology",
          "Hands-on fundamentals",
          "Role-specific real-world workflows",
          "Tools and best practices",
          "Common pitfalls and optimization",
        ];

  return {
    title: itemName,
    description: `${itemName} is important for the ${role} path because it directly improves execution quality, real-world readiness, and interview confidence.`,
    topics: topicSeed,
    youtubePlaylists: [
      `https://www.youtube.com/results?search_query=${encodeURIComponent(itemName + " " + role + " tutorial playlist")}`,
      `https://www.youtube.com/results?search_query=${encodeURIComponent(itemName + " practical projects playlist")}`,
      `https://www.youtube.com/results?search_query=${encodeURIComponent(role + " roadmap " + itemName)}`,
    ],
    advice: [
      "Practice in small daily sessions and track completion weekly.",
      "Build one portfolio artifact demonstrating this capability.",
      "Explain your implementation choices clearly to strengthen communication.",
    ],
  };
}

export async function generateLearningGuideWithGemini(input: {
  role: string;
  itemType: "skill" | "step";
  itemName: string;
}): Promise<LearningGuide> {
  const { role, itemType, itemName } = input;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    return fallbackLearningGuide(role, itemType, itemName);
  }

  try {
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `
Generate a structured learning guide for the ${itemType} "${itemName}" for a "${role}" career path.
Return STRICT JSON only in this schema:
{
  "title": string,
  "description": string,
  "topics": string[],
  "youtubePlaylists": string[],
  "advice": string[]
}
Rules:
- description: 2-4 concise sentences, role-specific and practical.
- topics: exactly 5 items.
- youtubePlaylists: exactly 3 YouTube URLs.
- advice: 3 to 5 actionable bullet points.
`.trim();

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const raw = (await result.response).text();
    const parsed = JSON.parse(extractJson(raw));
    const topics = Array.isArray(parsed?.topics)
      ? uniqueSkills(parsed.topics.map(String)).slice(0, 5)
      : [];
    const playlists = Array.isArray(parsed?.youtubePlaylists)
      ? uniqueSkills(parsed.youtubePlaylists.map(String)).slice(0, 3)
      : [];
    const advice = Array.isArray(parsed?.advice)
      ? uniqueSkills(parsed.advice.map(String)).slice(0, 5)
      : [];

    if (!topics.length || !playlists.length) {
      return fallbackLearningGuide(role, itemType, itemName);
    }

    return {
      title: String(parsed?.title || itemName).trim() || itemName,
      description:
        String(parsed?.description || "").trim() ||
        fallbackLearningGuide(role, itemType, itemName).description,
      topics,
      youtubePlaylists: playlists.map((url) =>
        /^https?:\/\//i.test(url)
          ? url
          : `https://www.youtube.com/results?search_query=${encodeURIComponent(url)}`
      ),
      advice,
    };
  } catch (error) {
    console.error("[ProgressTracker] Gemini learning guide generation failed:", error);
    return fallbackLearningGuide(role, itemType, itemName);
  }
}

export async function analyzeCareerProgress(
  input: AnalyzeInput
): Promise<ProgressTrackerAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    return buildRuleBasedAnalysis(input);
  }

  try {
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
You are an expert career mentor and skill-gap analyst.
Analyze this user for the target role and return STRICT JSON only.

Target Role: ${input.role}
Education Level: ${input.profile.educationLevel}
Field Of Study: ${input.profile.fieldOfStudy}
Experience Level: ${input.profile.experienceLevel}
Learning Goal: ${input.profile.learningGoal}
Role Required Skills: ${JSON.stringify(input.roleSkills)}
User Skill Levels: ${JSON.stringify(input.profile.skillLevels)}

Output JSON schema:
{
  "strongSkills": string[],
  "weakSkills": string[],
  "missingSkills": string[],
  "recommendedSkills": string[],
  "recommendedActions": string[],
  "metrics": {
    "domainExpertise": number,
    "practicalExposure": number,
    "communication": number,
    "executionDiscipline": number
  }
}

Rules:
- Return score values from 0 to 100.
- missingSkills should include skills absent or beginner-level for this role.
- weakSkills should include intermediate-level skills.
- strongSkills should include advanced-level skills.
- Keep recommendedSkills <= 8 and recommendedActions <= 6.
`.trim();

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const raw = (await result.response).text();
    const parsed = JSON.parse(extractJson(raw));

    return {
      strongSkills: Array.isArray(parsed?.strongSkills)
        ? parsed.strongSkills.map(String)
        : [],
      weakSkills: Array.isArray(parsed?.weakSkills)
        ? parsed.weakSkills.map(String)
        : [],
      missingSkills: Array.isArray(parsed?.missingSkills)
        ? parsed.missingSkills.map(String)
        : [],
      recommendedSkills: Array.isArray(parsed?.recommendedSkills)
        ? parsed.recommendedSkills.map(String).slice(0, 8)
        : [],
      recommendedActions: Array.isArray(parsed?.recommendedActions)
        ? parsed.recommendedActions.map(String).slice(0, 6)
        : [],
      metrics: {
        domainExpertise: clampScore(parsed?.metrics?.domainExpertise),
        practicalExposure: clampScore(parsed?.metrics?.practicalExposure),
        communication: clampScore(parsed?.metrics?.communication),
        executionDiscipline: clampScore(parsed?.metrics?.executionDiscipline),
      },
      generatedAt: new Date().toISOString(),
      source: "gemini",
    };
  } catch (error) {
    console.error("[ProgressTracker] Gemini analysis failed:", error);
    return buildRuleBasedAnalysis(input);
  }
}
