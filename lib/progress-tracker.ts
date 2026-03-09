import { getFixedRoadmapForRole } from "@/lib/fixed-roadmaps";

export type SkillLevel = "Beginner" | "Intermediate" | "Advanced";

export type ProgressTrackerProfile = {
  educationLevel: string;
  fieldOfStudy: string;
  experienceLevel: string;
  learningGoal: string;
  skillLevels: Record<string, SkillLevel>;
};

export type ProgressTrackerMetrics = {
  domainExpertise: number;
  practicalExposure: number;
  communication: number;
  executionDiscipline: number;
};

export type ProgressTrackerAnalysis = {
  strongSkills: string[];
  weakSkills: string[];
  missingSkills: string[];
  recommendedSkills: string[];
  recommendedActions: string[];
  metrics: ProgressTrackerMetrics;
  generatedAt: string;
  source: "gemini" | "rule_based";
};

const ROLE_SKILLS: Record<string, string[]> = {
  "Frontend Developer": [
    "HTML",
    "CSS",
    "JavaScript",
    "React",
    "TypeScript",
    "Git",
    "Problem Solving",
    "UI Design",
  ],
  "Backend Developer": [
    "Node.js",
    "Express",
    "Databases",
    "REST APIs",
    "Authentication",
    "System Design",
    "Caching",
    "Docker",
  ],
  "Data Scientist": [
    "Python",
    "Statistics",
    "Machine Learning",
    "Data Visualization",
    "SQL",
    "Pandas",
    "Scikit-learn",
    "Problem Solving",
  ],
  "Machine Learning Engineer": [
    "Python",
    "Statistics",
    "Machine Learning",
    "Deep Learning",
    "Data Processing",
    "Model Deployment",
  ],
  "Full Stack Developer": [
    "Frontend Development",
    "Backend Development",
    "Databases",
    "API Integration",
    "System Design",
    "Deployment",
  ],
  "Cybersecurity Engineer": [
    "Network Security",
    "Threat Analysis",
    "Incident Response",
    "Security Testing",
    "Identity Access Management",
    "Cloud Security",
  ],
};

function unique(items: string[]) {
  return Array.from(
    new Set(items.map((item) => String(item || "").trim()).filter(Boolean))
  );
}

export function normalizeRole(input: string) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^\w\s/+.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveRoleSkills(role: string) {
  const fixedRole = getFixedRoadmapForRole(role);
  if (fixedRole) {
    const required = unique([
      ...(fixedRole.requiredTechnicalSkills || []),
      ...(fixedRole.requiredSkills?.core || []),
      ...(fixedRole.requiredSkills?.advanced || []),
      ...(fixedRole.requiredSkills?.industry || []),
    ]);
    const concise = required.filter((item) => item.length <= 40);
    if (concise.length >= 6) {
      return concise.slice(0, 12);
    }
  }

  const normalized = normalizeRole(role);
  const matched = Object.entries(ROLE_SKILLS).find(([key]) =>
    normalizeRole(key) === normalized
  );
  return matched ? matched[1] : [];
}

export function emptySkillLevels(skills: string[]): Record<string, SkillLevel> {
  return skills.reduce<Record<string, SkillLevel>>((acc, skill) => {
    acc[skill] = "Beginner";
    return acc;
  }, {});
}
