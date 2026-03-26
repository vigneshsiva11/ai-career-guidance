import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { connectDatabase } from "@/server/config/database";
import { UserModel } from "@/server/models/User";
import { CareerProgressModel } from "@/server/models/CareerProgress";
import { RoadmapModel } from "@/server/models/Roadmap";
import { AssessmentModel } from "@/server/models/Assessment";
import { resolveRoleSkills } from "@/lib/progress-tracker";
import { areRolesSame } from "@/lib/user-role";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function cleanRole(value: unknown) {
  return String(value || "").trim();
}

function normalizeLevel(value: unknown) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "advanced") return "Advanced" as const;
  if (normalized === "intermediate") return "Intermediate" as const;
  return "Beginner" as const;
}

function emptySkillLevels(skills: string[]) {
  return Object.fromEntries(skills.map((skill) => [skill, "Beginner"]));
}

function levelToScore(level: string | undefined) {
  if (level === "Advanced") return 100;
  if (level === "Intermediate") return 60;
  if (level === "Beginner") return 30;
  return 0;
}

function normalizeSkillLevels(raw: unknown, masterSkills: string[]) {
  const result: Record<string, "Beginner" | "Intermediate" | "Advanced"> = {};
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  for (const skill of masterSkills) {
    result[skill] = normalizeLevel(source[skill]);
  }

  return result;
}

function normalizeProfileSkills(raw: unknown) {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const result: Record<string, "Beginner" | "Intermediate" | "Advanced"> = {};

  for (const [skill, level] of Object.entries(source)) {
    const key = String(skill || "").trim();
    if (!key) continue;
    result[key] = normalizeLevel(level);
  }

  return result;
}

function normalizeCompletedSkills(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return Array.from(new Set(raw.map((item) => String(item || "").trim()).filter(Boolean)));
}

function deriveCompletedSkillsFromLevels(
  skillLevels: Record<string, "Beginner" | "Intermediate" | "Advanced">,
  masterSkills: string[],
) {
  return masterSkills.filter((skill) => {
    const level = skillLevels[skill];
    return level === "Intermediate" || level === "Advanced";
  });
}

function makeTaskId(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isTaskCompleted(task: string, completed: string[]) {
  const normalizedTask = makeTaskId(task);
  return completed.some((entry) => {
    const normalizedEntry = makeTaskId(entry);
    return (
      normalizedEntry === normalizedTask ||
      normalizedEntry.includes(normalizedTask) ||
      normalizedTask.includes(normalizedEntry)
    );
  });
}

function stageLabelFromPercent(percent: number) {
  if (percent >= 100) return "completed" as const;
  if (percent > 0) return "in-progress" as const;
  return "not-started" as const;
}

function buildRuleBasedAnalysisSnapshot(
  selectedRole: string,
  masterSkills: string[],
  skillLevels: Record<string, "Beginner" | "Intermediate" | "Advanced">,
) {
  const strongSkills: string[] = [];
  const weakSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of masterSkills) {
    const level = skillLevels[skill];
    if (level === "Advanced") strongSkills.push(skill);
    else if (level === "Intermediate") weakSkills.push(skill);
    else missingSkills.push(skill);
  }

  const avg =
    masterSkills.length > 0
      ? Math.round(
          masterSkills.reduce((sum, skill) => sum + levelToScore(skillLevels[skill]), 0) /
            masterSkills.length,
        )
      : 0;

  return {
    strongSkills,
    weakSkills,
    missingSkills,
    recommendedSkills: [...missingSkills, ...weakSkills].slice(0, 8),
    recommendedActions: [
      `Build real projects focused on core ${selectedRole || "career"} workflows.`,
      "Practice consistently and review progress every week.",
      "Document project decisions and outcomes in your portfolio.",
      "Apply feedback from reviews to close skill gaps.",
    ],
    metrics: {
      domainExpertise: Math.max(0, Math.min(100, avg)),
      practicalExposure: Math.max(0, Math.min(100, Math.round(avg * 0.85))),
      communication: Math.max(0, Math.min(100, Math.round(avg * 0.9))),
      executionDiscipline: Math.max(0, Math.min(100, Math.round(avg * 0.88))),
    },
    generatedAt: new Date().toISOString(),
    source: "rule_based",
  };
}

async function resolveAuthUser(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = verifyAuthToken(token);
    await connectDatabase();
    return await UserModel.findById(payload.userId).lean();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user: any = await resolveAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [progress, roadmap, assessment] = await Promise.all([
      CareerProgressModel.findOne({ userId: user._id }).lean(),
      RoadmapModel.findOne({ userId: user._id }).lean(),
      AssessmentModel.findOne({ userId: user._id }).lean(),
    ]);

    const selectedRole =
      cleanRole(user.selectedRole) ||
      cleanRole((roadmap as any)?.targetRole || (roadmap as any)?.careerTitle) ||
      cleanRole((assessment as any)?.suggestedCareer) ||
      cleanRole((progress as any)?.selectedRole);

    const mappedRoleSkills = selectedRole ? resolveRoleSkills(selectedRole) : [];
    const progressRole = cleanRole((progress as any)?.selectedRole);
    const roleChangedSinceLastProgress =
      Boolean(selectedRole) && Boolean(progressRole) && !areRolesSame(selectedRole, progressRole);
    const existingRoleSkills = Array.isArray((progress as any)?.roleSkills)
      ? (progress as any).roleSkills.map(String)
      : [];
    const fallbackSkills = mappedRoleSkills.length > 0 ? mappedRoleSkills : existingRoleSkills;
    const masterSkills = Array.from(new Set(fallbackSkills.filter(Boolean)));
    const skillLevelsRaw =
      progress && typeof (progress as any).skillLevels === "object"
        ? Object.fromEntries(Object.entries((progress as any).skillLevels))
        : {};
    const normalizedSkillLevels = normalizeSkillLevels(skillLevelsRaw, masterSkills);
    const completedSkillsStored = normalizeCompletedSkills((progress as any)?.completedSkills);
    const completedSkillsDerived = deriveCompletedSkillsFromLevels(normalizedSkillLevels, masterSkills);
    const completedSkills =
      completedSkillsStored.length > 0 ? completedSkillsStored : completedSkillsDerived;
    const completedSteps = Array.isArray((progress as any)?.completedSteps)
      ? (progress as any).completedSteps.map(String)
      : [];
    const completedTasks = Array.isArray((progress as any)?.completedTasks)
      ? (progress as any).completedTasks.map(String)
      : completedSteps;

    const beginnerTasks = Array.isArray((roadmap as any)?.stages?.beginner)
      ? (roadmap as any).stages.beginner.map(String)
      : [];
    const intermediateTasks = Array.isArray((roadmap as any)?.stages?.intermediate)
      ? (roadmap as any).stages.intermediate.map(String)
      : [];
    const advancedTasks = Array.isArray((roadmap as any)?.stages?.advanced)
      ? (roadmap as any).stages.advanced.map(String)
      : [];

    const requiredSkillsRaw = Array.from(
      new Set([...masterSkills, ...Object.keys(normalizedSkillLevels)].filter(Boolean)),
    );
    const requiredSkills = mappedRoleSkills.length > 0 ? mappedRoleSkills : requiredSkillsRaw;

    const stageCounts = {
      beginnerTotal: beginnerTasks.length,
      beginnerCompleted: beginnerTasks.filter((task: string) => completedTasks.includes(makeTaskId(task)))
        .length,
      intermediateTotal: intermediateTasks.length,
      intermediateCompleted: intermediateTasks.filter((task: string) =>
        completedTasks.includes(makeTaskId(task)),
      ).length,
      advancedTotal: advancedTasks.length,
      advancedCompleted: advancedTasks.filter((task: string) => completedTasks.includes(makeTaskId(task)))
        .length,
    };

    const totalTasks =
      stageCounts.beginnerTotal + stageCounts.intermediateTotal + stageCounts.advancedTotal;
    const completedTaskCount =
      stageCounts.beginnerCompleted +
      stageCounts.intermediateCompleted +
      stageCounts.advancedCompleted;
    const totalScore = requiredSkills.reduce(
      (sum, skill) => sum + levelToScore(normalizedSkillLevels[skill]),
      0,
    );
    const careerScore =
      requiredSkills.length > 0 ? Math.round(totalScore / requiredSkills.length) : 0;
    const selectedSkillsCount = requiredSkills.filter((skill) => {
      const level = normalizedSkillLevels[skill];
      return level === "Intermediate" || level === "Advanced";
    }).length;
    const skillCoverage =
      requiredSkills.length > 0 ? Math.round((selectedSkillsCount / requiredSkills.length) * 100) : 0;

    const roadmapProgress = {
      beginnerCompleted:
        beginnerTasks.length > 0 && beginnerTasks.every((task) => isTaskCompleted(task, completedTasks)),
      intermediateCompleted:
        intermediateTasks.length > 0 &&
        intermediateTasks.every((task) => isTaskCompleted(task, completedTasks)),
      advancedCompleted:
        advancedTasks.length > 0 && advancedTasks.every((task) => isTaskCompleted(task, completedTasks)),
    };

    const computedAnalysis = buildRuleBasedAnalysisSnapshot(
      selectedRole,
      requiredSkills,
      normalizedSkillLevels,
    );
    const useComputedAnalysis =
      !progress ||
      roleChangedSinceLastProgress ||
      !Array.isArray((progress as any)?.strongSkills) ||
      !Array.isArray((progress as any)?.weakSkills) ||
      !Array.isArray((progress as any)?.missingSkills);

    const progressTracker = {
      selectedRole,
      hasSelectedRole: Boolean(selectedRole),
      roleSkills: requiredSkills,
      radarSkills: requiredSkills,
      requiredSkills,
      completedSkills,
      completedSteps,
      completedTasks,
      totalTasks,
      completedTaskCount,
      careerScore,
      skillCoverage,
      roadmapProgress,
      profile: {
        educationLevel: String((progress as any)?.educationLevel || user.education_level || ""),
        fieldOfStudy: String((progress as any)?.fieldOfStudy || ""),
        experienceLevel: String((progress as any)?.experienceLevel || ""),
        learningGoal: String((progress as any)?.learningGoal || ""),
        skillLevels:
          requiredSkills.length > 0
            ? { ...emptySkillLevels(requiredSkills), ...normalizedSkillLevels }
            : normalizeProfileSkills(user.profileSkills || {}),
      },
      analysis: useComputedAnalysis
        ? computedAnalysis
        : {
            strongSkills: Array.isArray((progress as any)?.strongSkills)
              ? (progress as any).strongSkills.map(String)
              : [],
            weakSkills: Array.isArray((progress as any)?.weakSkills)
              ? (progress as any).weakSkills.map(String)
              : [],
            missingSkills: Array.isArray((progress as any)?.missingSkills)
              ? (progress as any).missingSkills.map(String)
              : [],
            recommendedSkills: Array.isArray((progress as any)?.recommendedSkills)
              ? (progress as any).recommendedSkills.map(String)
              : [],
            recommendedActions: Array.isArray((progress as any)?.recommendedActions)
              ? (progress as any).recommendedActions.map(String)
              : [],
            metrics: {
              domainExpertise: Number((progress as any)?.domainExpertiseScore || 0),
              practicalExposure: Number((progress as any)?.practicalExposureScore || 0),
              communication: Number((progress as any)?.communicationScore || 0),
              executionDiscipline: Number((progress as any)?.executionDisciplineScore || 0),
            },
            generatedAt: (progress as any)?.generatedAt
              ? new Date((progress as any).generatedAt).toISOString()
              : null,
            source: String((progress as any)?.analysisSource || "rule_based"),
          },
    };

    const userProgress = {
      userId: String(user._id),
      selectedRole,
      requiredSkills,
      profileSkills: normalizedSkillLevels,
      completedSkills,
      completedSteps,
      completedTasks,
      totalTasks,
      completedTaskCount,
      careerScore,
      skillCoverage,
      stageProgress: {
        beginner: stageLabelFromPercent(careerScore >= 40 ? 100 : careerScore),
        intermediate: stageLabelFromPercent(
          careerScore > 40 ? Math.min(100, ((careerScore - 40) / 30) * 100) : 0,
        ),
        advanced: stageLabelFromPercent(
          careerScore > 70 ? Math.min(100, ((careerScore - 70) / 30) * 100) : 0,
        ),
      },
      roadmapProgress,
    };

    const hasGeneratedRoadmap =
      Boolean(cleanRole((roadmap as any)?.careerTitle || (roadmap as any)?.targetRole)) ||
      beginnerTasks.length > 0 ||
      intermediateTasks.length > 0 ||
      advancedTasks.length > 0;
    const hasCompletedAssessmentSignal =
      Boolean((assessment as any)?.isCompleted) ||
      Boolean(user.assessmentCompleted) ||
      hasGeneratedRoadmap ||
      Boolean(selectedRole);

    const roadmapSnapshot =
      hasCompletedAssessmentSignal && roadmap
        ? {
            assessmentCompleted: true,
            assessmentStarted: Boolean(assessment || roadmap),
            assessmentStep: (assessment as any)?.isCompleted ? 6 : Number((assessment as any)?.assessmentStep || 6),
            totalQuestions: 6,
            answers: Array.isArray((assessment as any).answers) ? (assessment as any).answers : [],
            conversationHistory: Array.isArray((assessment as any).conversationHistory)
              ? (assessment as any).conversationHistory
              : [],
            result: {
              strengthProfile: String((assessment as any).strengthProfile || ""),
              careerPersona: String((assessment as any).persona || ""),
              suggestedCareerPath: String((assessment as any).suggestedCareer || selectedRole),
              roadmap: {
                beginner: beginnerTasks,
                intermediate: intermediateTasks,
                advanced: advancedTasks,
              },
              requiredSkills: (roadmap as any).requiredSkills || {
                core: [],
                advanced: [],
                industry: [],
              },
              tools: Array.isArray((roadmap as any).tools) ? (roadmap as any).tools : [],
              estimatedTimeline: String((roadmap as any).estimatedTimeline || ""),
              toolsToLearn: Array.isArray((roadmap as any).toolsToLearn)
                ? (roadmap as any).toolsToLearn.map(String)
                : [],
              certifications: Array.isArray((roadmap as any).certifications)
                ? (roadmap as any).certifications.map(String)
                : [],
              realWorldProjects: Array.isArray((roadmap as any).realWorldProjects)
                ? (roadmap as any).realWorldProjects.map(String)
                : [],
              portfolioRequirements: Array.isArray((roadmap as any).portfolioRequirements)
                ? (roadmap as any).portfolioRequirements.map(String)
                : [],
              interviewPreparationTopics: Array.isArray((roadmap as any).interviewPreparationTopics)
                ? (roadmap as any).interviewPreparationTopics.map(String)
                : [],
              requiredTechnicalSkills: Array.isArray((roadmap as any).requiredTechnicalSkills)
                ? (roadmap as any).requiredTechnicalSkills.map(String)
                : [],
              requiredSoftSkills: Array.isArray((roadmap as any).requiredSoftSkills)
                ? (roadmap as any).requiredSoftSkills.map(String)
                : [],
              internshipStrategy: Array.isArray((roadmap as any).internshipStrategy)
                ? (roadmap as any).internshipStrategy.map(String)
                : [],
              freelancingStrategy: Array.isArray((roadmap as any).freelancingStrategy)
                ? (roadmap as any).freelancingStrategy.map(String)
                : [],
              salaryInsight: String((roadmap as any).salaryInsight || ""),
              jobPlatformsToApply: Array.isArray((roadmap as any).jobPlatformsToApply)
                ? (roadmap as any).jobPlatformsToApply.map(String)
                : [],
              resumeTips: Array.isArray((roadmap as any).resumeTips)
                ? (roadmap as any).resumeTips.map(String)
                : [],
              jobReadyChecklist: Array.isArray((roadmap as any).jobReadyChecklist)
                ? (roadmap as any).jobReadyChecklist.map(String)
                : [],
              skillGapPreview: Array.isArray((assessment as any).skillGapPreview)
                ? (assessment as any).skillGapPreview
                : [],
              source: String((roadmap as any).source || "rule_based_assessment"),
            },
            updatedAt: (roadmap as any).generatedAt
              ? new Date((roadmap as any).generatedAt).toISOString()
              : (assessment as any).createdAt
                ? new Date((assessment as any).createdAt).toISOString()
                : null,
          }
        : {
            assessmentCompleted: hasCompletedAssessmentSignal,
            assessmentStarted: Boolean(assessment),
            assessmentStep: Number((assessment as any)?.assessmentStep || 0),
            totalQuestions: 6,
            answers: Array.isArray((assessment as any)?.answers) ? (assessment as any).answers : [],
            conversationHistory: Array.isArray((assessment as any)?.conversationHistory)
              ? (assessment as any).conversationHistory
              : [],
          };

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: String(user._id),
            legacyId: user.legacyId ?? null,
            name: String(user.name || ""),
            email: String(user.email || ""),
            role: String(user.role || "student"),
            assessmentCompleted: hasCompletedAssessmentSignal,
            lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
          },
          selectedRole,
          progressTracker,
          userProgress,
          roadmap: roadmapSnapshot,
          cachedAt: new Date().toISOString(),
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("User full profile API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch full profile" },
      { status: 500 },
    );
  }
}
