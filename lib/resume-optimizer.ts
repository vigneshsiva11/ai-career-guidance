import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CareerProgressModel } from "@/server/models/CareerProgress";
import { UserModel } from "@/server/models/User";

function resolvePdfWorkerFileUrl() {
  const collectAncestors = (startDir: string, maxDepth = 8) => {
    const dirs: string[] = [];
    let current = path.resolve(startDir);

    for (let i = 0; i < maxDepth; i += 1) {
      dirs.push(current);
      const parent = path.dirname(current);
      if (parent === current) {
        break;
      }
      current = parent;
    }

    return dirs;
  };

  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const searchRoots = Array.from(
    new Set([
      ...collectAncestors(process.cwd()),
      ...collectAncestors(moduleDir),
    ]),
  );

  const candidatePaths = searchRoots.flatMap((rootDir) => [
    path.join(
      rootDir,
      "node_modules",
      "pdfjs-dist",
      "legacy",
      "build",
      "pdf.worker.mjs",
    ),
    path.join(
      rootDir,
      "node_modules",
      "pdfjs-dist",
      "legacy",
      "build",
      "pdf.worker.min.mjs",
    ),
    path.join(rootDir, "node_modules", "pdfjs-dist", "build", "pdf.worker.mjs"),
    path.join(
      rootDir,
      "node_modules",
      "pdfjs-dist",
      "build",
      "pdf.worker.min.mjs",
    ),
  ]);

  for (const candidate of candidatePaths) {
    if (existsSync(candidate)) {
      return pathToFileURL(candidate).href;
    }
  }

  throw new Error("Could not locate pdfjs worker file in node_modules.");
}

async function extractPdfTextWithPdfParse(buffer: Buffer, workerFileUrl: string) {
  const { PDFParse } = await import("pdf-parse");
  PDFParse.setWorker(workerFileUrl);
  const parser = new PDFParse({
    data: buffer,
    verbosity: 0,
  });

  try {
    const result = await parser.getText({
      pageJoiner: "\n",
    });
    return String(result.text || "").trim();
  } finally {
    await parser.destroy();
  }
}

async function extractPdfTextWithPdfJs(buffer: Buffer, workerFileUrl: string) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = workerFileUrl;

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;
  try {
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item ? String(item.str || "") : ""))
        .join(" ");
      pages.push(pageText);
      page.cleanup();
    }
    return pages.join("\n").trim();
  } finally {
    await pdf.destroy();
  }
}

async function extractPdfTextWithGemini(buffer: Buffer) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    throw new Error("Gemini API key is missing for PDF fallback extraction.");
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: [
              "Extract all readable text from this resume PDF.",
              "Return plain text only.",
              "Do not summarize.",
              "Do not add markdown fences.",
            ].join(" "),
          },
          {
            inlineData: {
              mimeType: "application/pdf",
              data: buffer.toString("base64"),
            },
          },
        ],
      },
    ],
  });

  return String((await result.response).text() || "").trim();
}

export const ROLE_SKILL_CONFIGS = {
  frontend: {
    label: "Frontend Developer",
    roleAliases: ["frontend developer", "react developer", "ui developer", "web developer"],
    skills: [
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "Responsive Design",
      "Git version control",
      "API integration",
      "UI UX basics",
      "Debugging skills",
      "Component architecture",
    ],
    jobSuggestions: [
      {
        jobTitle: "Frontend Developer",
        description: "Build responsive user interfaces and collaborate closely with product and design teams.",
      },
      {
        jobTitle: "React Developer",
        description: "Own component-driven UI development with modern React workflows and reusable patterns.",
      },
      {
        jobTitle: "UI Developer",
        description: "Translate product requirements into polished, accessible, and maintainable interface code.",
      },
      {
        jobTitle: "Web Developer",
        description: "Ship customer-facing web experiences with strong frontend implementation and debugging skills.",
      },
    ],
  },
  backend: {
    label: "Backend Developer",
    roleAliases: ["backend developer", "api developer", "node js developer", "server developer"],
    skills: [
      "Node.js",
      "Express.js",
      "Database design",
      "REST API development",
      "Authentication",
      "Server deployment",
      "Performance optimization",
      "Security practices",
      "Git version control",
      "Debugging skills",
    ],
    jobSuggestions: [
      {
        jobTitle: "Backend Developer",
        description: "Design APIs, business logic, and backend integrations for production applications.",
      },
      {
        jobTitle: "Node.js Developer",
        description: "Build scalable backend services using Node.js, Express, and database-driven systems.",
      },
      {
        jobTitle: "API Developer",
        description: "Create and maintain secure REST APIs, authentication flows, and integration layers.",
      },
      {
        jobTitle: "Server-Side Engineer",
        description: "Improve backend performance, deployment reliability, and service maintainability.",
      },
    ],
  },
  ml: {
    label: "Machine Learning Engineer",
    roleAliases: ["machine learning engineer", "ml engineer", "ai engineer", "data scientist"],
    skills: [
      "Python",
      "TensorFlow",
      "PyTorch",
      "MLflow",
      "Data preprocessing",
      "Model evaluation",
      "Feature engineering",
      "Model deployment",
      "Git version control",
      "Debugging skills",
    ],
    jobSuggestions: [
      {
        jobTitle: "Machine Learning Engineer",
        description: "Build, evaluate, and deploy machine learning systems for real-world product use cases.",
      },
      {
        jobTitle: "AI Engineer",
        description: "Work on applied AI pipelines, model experimentation, and production deployment workflows.",
      },
      {
        jobTitle: "ML Ops Engineer",
        description: "Support model lifecycle management, MLflow tracking, and deployment reliability.",
      },
      {
        jobTitle: "Data Scientist",
        description: "Analyze datasets, engineer features, and improve model quality with measurable outcomes.",
      },
    ],
  },
} as const;

type RoleSkillConfig = (typeof ROLE_SKILL_CONFIGS)[keyof typeof ROLE_SKILL_CONFIGS];
export type ResumeSkill = string;

export type ResumeAnalysisResult = {
  matchedSkills: string[];
  weakSkills: string[];
  missingSkills: string[];
  suggestions: string[];
};

export type JobMatch = {
  jobTitle: string;
  description: string;
  linkedInUrl: string;
  requiredSkills: string[];
  missingSkills: string[];
};

export type ResumeUploadPayload = {
  name: string;
  type: string;
  buffer: Buffer;
};

const ROLE_SKILL_ALIASES: Record<string, string[]> = {
  HTML: ["html"],
  CSS: ["css", "tailwind", "bootstrap"],
  JavaScript: ["javascript", "js", "typescript", "ts"],
  React: ["react", "next js", "nextjs"],
  "Responsive Design": ["responsive design", "responsive ui", "mobile first"],
  "Git version control": ["git", "github", "version control"],
  "API integration": ["api integration", "rest api", "axios", "fetch"],
  "UI UX basics": ["ui", "ux", "wireframe", "design systems"],
  "Debugging skills": ["debugging", "bug fixing", "troubleshooting"],
  "Component architecture": ["component architecture", "component design", "reusable components"],
  "Node.js": ["node", "node.js"],
  "Express.js": ["express", "express.js"],
  "Database design": ["database design", "mongodb", "mysql", "postgresql", "sql"],
  "REST API development": ["rest api", "api development", "crud api"],
  Authentication: ["authentication", "auth", "jwt", "oauth"],
  "Server deployment": ["deployment", "vercel", "render", "aws", "server deployment"],
  "Performance optimization": ["performance optimization", "performance tuning", "optimization"],
  "Security practices": ["security", "security practices", "authorization"],
  Python: ["python"],
  TensorFlow: ["tensorflow", "tensor flow"],
  PyTorch: ["pytorch", "torch"],
  MLflow: ["mlflow", "ml flow"],
  "Data preprocessing": ["data preprocessing", "data cleaning", "preprocessing"],
  "Model evaluation": ["model evaluation", "evaluation metrics", "accuracy"],
  "Feature engineering": ["feature engineering", "feature selection"],
  "Model deployment": ["model deployment", "deploying models", "serving models"],
};

function unique(items: string[]) {
  return Array.from(
    new Set(items.map((item) => String(item || "").trim()).filter(Boolean)),
  );
}

function normalizeValue(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractJson(raw: string) {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) return raw.slice(start, end + 1);
  return raw;
}

function resolveRoleConfig(selectedRole: string): RoleSkillConfig {
  const normalizedRole = normalizeValue(selectedRole);

  for (const config of Object.values(ROLE_SKILL_CONFIGS)) {
    if (
      config.roleAliases.some((alias) => normalizeValue(alias) === normalizedRole) ||
      normalizeValue(config.label) === normalizedRole
    ) {
      return config;
    }
  }

  if (normalizedRole.includes("front")) return ROLE_SKILL_CONFIGS.frontend;
  if (normalizedRole.includes("back")) return ROLE_SKILL_CONFIGS.backend;
  if (
    normalizedRole.includes("machine learning") ||
    normalizedRole.includes("ml") ||
    normalizedRole.includes("ai") ||
    normalizedRole.includes("data scientist")
  ) {
    return ROLE_SKILL_CONFIGS.ml;
  }

  return ROLE_SKILL_CONFIGS.frontend;
}

export function getRoleSkillCatalog(selectedRole: string) {
  return resolveRoleConfig(selectedRole).skills;
}

export function canonicalizeResumeSkill(input: string, selectedRole: string) {
  const normalizedInput = normalizeValue(input);
  if (!normalizedInput) return "";

  for (const skill of getRoleSkillCatalog(selectedRole)) {
    const aliases = ROLE_SKILL_ALIASES[skill] || [skill];
    if (aliases.some((alias) => normalizeValue(alias) === normalizedInput)) {
      return skill;
    }
  }

  return "";
}

export function normalizeResumeSkillList(items: string[], selectedRole: string) {
  const resolved = items
    .map((item) => canonicalizeResumeSkill(String(item || ""), selectedRole))
    .filter(Boolean);
  return unique(resolved);
}

function detectDirectSkillMatches(resumeText: string, selectedRole: string) {
  const normalizedText = normalizeValue(resumeText);
  const matchedSkills: string[] = [];
  const weakSkills: string[] = [];
  const roleSkills = getRoleSkillCatalog(selectedRole);

  for (const skill of roleSkills) {
    const aliases = ROLE_SKILL_ALIASES[skill] || [skill];
    const directMatch = aliases.some((alias) => {
      const pattern = new RegExp(
        `\\b${escapeRegExp(normalizeValue(alias))}\\b`,
        "i",
      );
      return pattern.test(normalizedText);
    });

    if (directMatch) {
      matchedSkills.push(skill);
      continue;
    }

    const keywordTokens = normalizeValue(skill)
      .split(" ")
      .filter((token) => token.length >= 5);
    const partialHits = keywordTokens.filter((token) =>
      normalizedText.includes(token),
    );
    if (partialHits.length >= 1 && keywordTokens.length > 0) {
      weakSkills.push(skill);
    }
  }

  return {
    matchedSkills: unique(matchedSkills),
    weakSkills: unique(
      weakSkills.filter((skill) => !matchedSkills.includes(skill)),
    ),
  };
}

export async function extractResumeTextFromPayload(
  payload: ResumeUploadPayload,
) {
  const buffer = payload.buffer;
  const lowerName = String(payload.name || "").toLowerCase();
  const type = String(payload.type || "").toLowerCase();

  if (!buffer || buffer.length === 0) {
    throw new Error("Could not read the uploaded resume file.");
  }

  if (lowerName.endsWith(".txt") || type.includes("text/plain")) {
    return buffer.toString("utf8").trim();
  }

  if (
    lowerName.endsWith(".docx") ||
    type.includes(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return String(result.value || "").trim();
  }

  if (lowerName.endsWith(".pdf") || type.includes("application/pdf")) {
    const workerFileUrl = resolvePdfWorkerFileUrl();

    try {
      const primaryText = await extractPdfTextWithPdfParse(buffer, workerFileUrl);
      if (primaryText) {
        return primaryText;
      }
    } catch (primaryError) {
      console.error("[ResumeUpload] pdf-parse primary parser failed", {
        cwd: process.cwd(),
        workerFileUrl,
        error:
          primaryError instanceof Error
            ? primaryError.message
            : String(primaryError),
      });
    }

    try {
      const fallbackText = await extractPdfTextWithPdfJs(buffer, workerFileUrl);
      if (fallbackText) {
        return fallbackText;
      }
    } catch (fallbackError) {
      console.error("[ResumeUpload] pdfjs fallback parser failed", {
        cwd: process.cwd(),
        workerFileUrl,
        error:
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError),
      });
    }

    try {
      const geminiText = await extractPdfTextWithGemini(buffer);
      if (geminiText) {
        return geminiText;
      }
    } catch (geminiError) {
      console.error("[ResumeUpload] Gemini PDF extraction fallback failed", {
        error:
          geminiError instanceof Error
            ? geminiError.message
            : String(geminiError),
      });
    }

    throw new Error(
      "Failed to parse PDF resume. Try re-saving the PDF or uploading it as DOCX or TXT.",
    );
  }

  throw new Error(
    "Unsupported resume format. Please upload a PDF, DOCX, or TXT file.",
  );
}

export async function extractResumeText(file: File) {
  if (
    !file ||
    typeof file !== "object" ||
    typeof file.arrayBuffer !== "function"
  ) {
    throw new Error("Invalid uploaded file.");
  }

  const bytes = await file.arrayBuffer();
  if (!(bytes instanceof ArrayBuffer) || bytes.byteLength === 0) {
    throw new Error("Uploaded file is empty or unreadable.");
  }

  return extractResumeTextFromPayload({
    name: String(file.name || ""),
    type: String(file.type || ""),
    buffer: Buffer.from(bytes),
  });
}

export async function analyzeResumeWithGemini(input: {
  resumeText: string;
  selectedRole: string;
}) {
  const roleConfig = resolveRoleConfig(input.selectedRole);
  const roleSkills = roleConfig.skills;
  const direct = detectDirectSkillMatches(input.resumeText, input.selectedRole);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    throw new Error("AI analysis unavailable. Gemini API key is missing.");
  }

  try {
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `
Analyze the resume text.

The user's selected role is ${roleConfig.label}.

Compare the resume content with this role-specific skill list only:
${JSON.stringify(roleSkills)}

Identify:
- which skills appear clearly
- which skills appear partially
- which skills are missing

Return STRICT JSON only in this format:
{
  "matchedSkills": [],
  "weakSkills": [],
  "missingSkills": [],
  "suggestions": []
}

Rules:
- Use ONLY skill names from the provided role-specific list.
- Do not generate skills outside the ${roleConfig.label} domain.
- suggestions must be 4 to 6 concise role-specific resume improvement actions.

Resume text:
${input.resumeText}
`.trim();

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const raw = (await result.response).text();
    const parsed = JSON.parse(extractJson(raw));

    const matchedSkills = unique([
      ...direct.matchedSkills,
      ...normalizeResumeSkillList(
        Array.isArray(parsed?.matchedSkills) ? parsed.matchedSkills : [],
        input.selectedRole,
      ),
    ]);
    const weakSkills = normalizeResumeSkillList(
      Array.isArray(parsed?.weakSkills) ? parsed.weakSkills : [],
      input.selectedRole,
    ).filter((skill) => !matchedSkills.includes(skill));
    const missingSkills = roleSkills.filter(
      (skill) =>
        !matchedSkills.includes(skill) &&
        !weakSkills.includes(skill) &&
        !direct.weakSkills.includes(skill),
    );
    const suggestions = unique(
      Array.isArray(parsed?.suggestions)
        ? parsed.suggestions.map((item: unknown) => String(item || "").trim())
        : [],
    );

    if (suggestions.length === 0) {
      throw new Error(
        "AI analysis unavailable. Gemini returned an incomplete response.",
      );
    }

    return {
      matchedSkills,
      weakSkills: unique([
        ...weakSkills,
        ...direct.weakSkills.filter((skill) => !matchedSkills.includes(skill)),
      ]),
      missingSkills,
      suggestions: suggestions.slice(0, 6),
    } satisfies ResumeAnalysisResult;
  } catch (error) {
    console.error("[ResumeOptimizer] Gemini analysis failed:", error);
    throw new Error("AI analysis unavailable. Try again later.");
  }
}

function normalizeRole(value: string) {
  return normalizeValue(value);
}

export async function resolveResumeRoleSkills(selectedRole: string) {
  return getRoleSkillCatalog(selectedRole);
}

export function buildJobMatches(input: {
  selectedRole: string;
  matchedSkills: string[];
}) {
  const roleConfig = resolveRoleConfig(input.selectedRole);
  return roleConfig.jobSuggestions.map((job) => {
    const linkedInUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.jobTitle)}`;
    const requiredSkills = roleConfig.skills.slice(0, 3);

    return {
      jobTitle: job.jobTitle,
      description: job.description,
      linkedInUrl,
      requiredSkills,
      missingSkills: requiredSkills.filter((skill) => !input.matchedSkills.includes(skill)),
    } satisfies JobMatch;
  });
}

export async function buildSkillImprovementPlan(input: {
  selectedRole: string;
  weakSkills: string[];
  missingSkills: string[];
}) {
  const roleSkills = await resolveResumeRoleSkills(input.selectedRole);
  const prioritySkills = unique(
    [...input.missingSkills, ...input.weakSkills].filter((skill) =>
      roleSkills.includes(skill as ResumeSkill),
    ),
  );
  const fallbackSkills = unique([...input.missingSkills, ...input.weakSkills]);
  const planSkills = (
    prioritySkills.length > 0 ? prioritySkills : fallbackSkills
  ).slice(0, 5);

  return planSkills.map((skill) => {
    if (skill === "React") {
      return "Add one project bullet that clearly shows React component design, state handling, and UI outcomes.";
    }
    if (skill === "API integration") {
      return "Describe how you connected frontend screens to real APIs and what user value that integration delivered.";
    }
    if (skill === "REST API development") {
      return "Add one backend project bullet that highlights endpoints, request handling, and data flow clearly.";
    }
    if (skill === "Model deployment") {
      return "Include one example showing how you deployed or served a model beyond notebook experimentation.";
    }
    return `Add stronger proof of ${skill} with a role-specific project bullet, measurable result, or concrete tool usage.`;
  });
}

function normalizeSkillLevels(raw: unknown) {
  if (!raw || typeof raw !== "object") return {} as Record<string, string>;
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).map(([key, value]) => [
      key,
      String(value || ""),
    ]),
  ) as Record<string, string>;
}

function uniqueSkillLevels(levels: Record<string, string>) {
  const result: Record<string, string> = {};
  for (const [skill, level] of Object.entries(levels)) {
    const key = String(skill || "").trim();
    if (!key) continue;
    result[key] = String(level || "").trim() || "Beginner";
  }
  return result;
}

function mergeCompletedSkills(existing: string[], matchedSkills: string[]) {
  return unique([...existing.map(String), ...matchedSkills.map(String)]);
}

export async function updateProgressTrackerFromResume(input: {
  userId: string;
  selectedRole: string;
  matchedSkills: string[];
}) {
  const progress: any = await CareerProgressModel.findOne({
    userId: input.userId,
  }).lean();
  const existingProfileLevels = normalizeSkillLevels(progress?.skillLevels);
  const nextLevels = uniqueSkillLevels({ ...existingProfileLevels });

  for (const skill of input.matchedSkills) {
    const current = String(nextLevels[skill] || "").trim();
    if (current !== "Advanced") {
      nextLevels[skill] = "Intermediate";
    }
  }

  const completedSkills = mergeCompletedSkills(
    Array.isArray(progress?.completedSkills)
      ? progress.completedSkills.map(String)
      : [],
    input.matchedSkills,
  );

  await CareerProgressModel.findOneAndUpdate(
    { userId: input.userId },
    {
      $set: {
        selectedRole: input.selectedRole,
        skillLevels: nextLevels,
        completedSkills,
        lastProfileUpdate: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const user: any = await UserModel.findById(input.userId).lean();
  const existingUserSkills = normalizeSkillLevels(user?.profileSkills);
  const mergedUserSkills = uniqueSkillLevels({ ...existingUserSkills });

  for (const skill of input.matchedSkills) {
    const current = String(mergedUserSkills[skill] || "")
      .trim()
      .toLowerCase();
    if (current !== "advanced") {
      mergedUserSkills[skill] = "intermediate";
    }
  }

  await UserModel.findByIdAndUpdate(input.userId, {
    $set: {
      profileSkills: mergedUserSkills,
    },
  });

  return {
    updatedSkills: input.matchedSkills,
    completedSkills,
  };
}
