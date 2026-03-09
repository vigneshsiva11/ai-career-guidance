import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { connectDatabase } from "@/server/config/database";
import { UserModel } from "@/server/models/User";
import { RoadmapModel } from "@/server/models/Roadmap";
import { CareerProgressModel } from "@/server/models/CareerProgress";
import {
  emptySkillLevels,
  resolveRoleSkills,
  type SkillLevel,
} from "@/lib/progress-tracker";
import { areRolesSame, resolveSelectedRoleForUser } from "@/lib/user-role";
import {
  analyzeCareerProgress,
  generateRoleSkillsWithGemini,
} from "@/lib/progress-tracker-ai";

async function resolveAuthUser(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const payload = verifyAuthToken(token);
    await connectDatabase();
    const user = await UserModel.findById(payload.userId);
    return user;
  } catch {
    return null;
  }
}

function normalizeSkillLevels(raw: unknown, masterSkills: string[]) {
  const result: Record<string, SkillLevel> = {};
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  for (const skill of masterSkills) {
    const value = String(source[skill] || "").trim().toLowerCase();
    if (value === "advanced") result[skill] = "Advanced";
    else if (value === "intermediate") result[skill] = "Intermediate";
    else result[skill] = "Beginner";
  }
  return result;
}

function normalizeCompletedSkills(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return Array.from(
    new Set(
      raw
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    )
  );
}

function deriveCompletedSkillsFromLevels(
  skillLevels: Record<string, SkillLevel>,
  masterSkills: string[]
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

function isTaskCompleted(task: string, completedSkills: string[]) {
  const normalizedTask = makeTaskId(task);
  return completedSkills.some((entry) => {
    const normalizedEntry = makeTaskId(entry);
    return (
      normalizedEntry === normalizedTask ||
      normalizedEntry.includes(normalizedTask) ||
      normalizedTask.includes(normalizedEntry)
    );
  });
}

function levelToScore(level: SkillLevel | undefined) {
  if (level === "Advanced") return 100;
  if (level === "Intermediate") return 60;
  return 30;
}

function buildRuleBasedAnalysisSnapshot(
  selectedRole: string,
  masterSkills: string[],
  skillLevels: Record<string, SkillLevel>
) {
  const strongSkills: string[] = [];
  const weakSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of masterSkills) {
    const level = skillLevels[skill];
    if (level === "Advanced") {
      strongSkills.push(skill);
    } else if (level === "Intermediate") {
      weakSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const avg =
    masterSkills.length > 0
      ? Math.round(
          masterSkills.reduce((sum, skill) => sum + levelToScore(skillLevels[skill]), 0) /
            masterSkills.length
        )
      : 0;

  return {
    strongSkills,
    weakSkills,
    missingSkills,
    recommendedSkills: [...missingSkills, ...weakSkills].slice(0, 8),
    recommendedActions: [
      `Build real projects focused on core ${selectedRole} workflows.`,
      "Practice consistently and review progress every week.",
      "Document project decisions and outcomes in your portfolio.",
      "Apply feedback from code/design reviews to close skill gaps.",
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

export async function GET(request: NextRequest) {
  try {
    const user = await resolveAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const selectedRole = await resolveSelectedRoleForUser({
      userId: String(user._id),
      userDoc: user,
    });
    const mappedRoleSkills = selectedRole ? resolveRoleSkills(selectedRole) : [];
    const roleSkillsFallback =
      mappedRoleSkills.length > 0
        ? mappedRoleSkills
        : selectedRole
        ? await generateRoleSkillsWithGemini(selectedRole)
        : [];

    const progress: any = await CareerProgressModel.findOne({ userId: user._id }).lean();
    const progressRole = String(progress?.selectedRole || "").trim();
    const roleChangedSinceLastProgress =
      Boolean(selectedRole) && Boolean(progressRole) && !areRolesSame(selectedRole, progressRole);
    const existingSkillLevelsRaw = progress?.skillLevels
      ? Object.fromEntries(Object.entries(progress.skillLevels))
      : {};
    const existingRoleSkills = Array.isArray(progress?.roleSkills)
      ? progress.roleSkills.map(String)
      : [];
    const safeExistingRoleSkills = roleChangedSinceLastProgress ? [] : existingRoleSkills;
    const safeExistingSkillKeys = roleChangedSinceLastProgress
      ? []
      : Object.keys(existingSkillLevelsRaw);
    const masterSkills =
      roleSkillsFallback.length > 0
        ? roleSkillsFallback
        : safeExistingRoleSkills.length > 0
        ? safeExistingRoleSkills
        : safeExistingSkillKeys.length > 0
        ? safeExistingSkillKeys
        : roleSkillsFallback;
    const existingSkillLevels = normalizeSkillLevels(existingSkillLevelsRaw, masterSkills);
    const completedSkillsStored = Array.isArray(progress?.completedSkills)
      ? progress.completedSkills.map(String)
      : [];
    const completedSkillsDerived = deriveCompletedSkillsFromLevels(existingSkillLevels, masterSkills);
    const completedSkillsBase =
      completedSkillsStored.length > 0 ? completedSkillsStored : completedSkillsDerived;
    const completedSkills = roleChangedSinceLastProgress
      ? completedSkillsDerived
      : completedSkillsBase.filter((skill: string) => masterSkills.includes(skill));
    const computedAnalysis = buildRuleBasedAnalysisSnapshot(
      selectedRole,
      masterSkills,
      existingSkillLevels
    );
    const savedAnalysisLikelyStale = Boolean(progress) &&
      (
        (Array.isArray(progress?.strongSkills)
          ? progress.strongSkills.some((skill: unknown) => !masterSkills.includes(String(skill)))
          : false) ||
        (Array.isArray(progress?.weakSkills)
          ? progress.weakSkills.some((skill: unknown) => !masterSkills.includes(String(skill)))
          : false) ||
        (Array.isArray(progress?.missingSkills)
          ? progress.missingSkills.some((skill: unknown) => !masterSkills.includes(String(skill)))
          : false) ||
        (Array.isArray(progress?.recommendedSkills)
          ? progress.recommendedSkills.some((skill: unknown) => !masterSkills.includes(String(skill)))
          : false)
      );

    return NextResponse.json({
      success: true,
      data: {
        selectedRole,
        hasSelectedRole: Boolean(selectedRole),
        roleSkills: masterSkills,
        radarSkills: masterSkills,
        profile: {
          educationLevel: String(progress?.educationLevel || user.education_level || ""),
          fieldOfStudy: String(progress?.fieldOfStudy || ""),
          experienceLevel: String(progress?.experienceLevel || ""),
          learningGoal: String(progress?.learningGoal || ""),
          skillLevels:
            masterSkills.length > 0
              ? { ...emptySkillLevels(masterSkills), ...existingSkillLevels }
              : {},
        },
        completedSkills,
        completedSteps: Array.isArray(progress?.completedSteps)
          ? progress.completedSteps.map(String)
          : [],
        completedTasks: Array.isArray(progress?.completedTasks)
          ? progress.completedTasks.map(String)
          : Array.isArray(progress?.completedSteps)
          ? progress.completedSteps.map(String)
          : [],
        roadmapProgress: progress?.roadmapProgress || {
          beginnerCompleted: false,
          intermediateCompleted: false,
          advancedCompleted: false,
        },
        analysis: progress
          ? roleChangedSinceLastProgress
            || savedAnalysisLikelyStale
            ? computedAnalysis
            : {
                strongSkills: progress.strongSkills || [],
                weakSkills: progress.weakSkills || [],
                missingSkills: progress.missingSkills || [],
                recommendedSkills: progress.recommendedSkills || [],
                recommendedActions: progress.recommendedActions || [],
                metrics: {
                  domainExpertise: Number(progress.domainExpertiseScore || 0),
                  practicalExposure: Number(progress.practicalExposureScore || 0),
                  communication: Number(progress.communicationScore || 0),
                  executionDiscipline: Number(progress.executionDisciplineScore || 0),
                },
                generatedAt: progress.generatedAt
                  ? new Date(progress.generatedAt).toISOString()
                  : null,
                source: String(progress.analysisSource || "rule_based"),
              }
          : computedAnalysis,
      },
    });
  } catch (error) {
    console.error("Progress tracker GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch progress tracker data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await resolveAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const selectedRole = await resolveSelectedRoleForUser({
      userId: String(user._id),
      userDoc: user,
    });
    if (!selectedRole) {
      return NextResponse.json(
        { success: false, error: "No selected career role found for this user" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const educationLevel = String(body.educationLevel || "").trim();
    const fieldOfStudy = String(body.fieldOfStudy || "").trim();
    const experienceLevel = String(body.experienceLevel || "").trim();
    const learningGoal = String(body.learningGoal || "").trim();

    if (!educationLevel || !fieldOfStudy || !experienceLevel || !learningGoal) {
      return NextResponse.json(
        {
          success: false,
          error:
            "educationLevel, fieldOfStudy, experienceLevel and learningGoal are required",
        },
        { status: 400 }
      );
    }

    const mappedRoleSkills = resolveRoleSkills(selectedRole);
    const roleSkillsFallback =
      mappedRoleSkills.length > 0
        ? mappedRoleSkills
        : await generateRoleSkillsWithGemini(selectedRole);
    const explicitSkills =
      body.skillLevels && typeof body.skillLevels === "object"
        ? Object.keys(body.skillLevels as Record<string, unknown>)
            .map((skill) => String(skill || "").trim())
            .filter(Boolean)
        : [];
    const normalizedRoleSkills = new Set(
      roleSkillsFallback.map((skill) => skill.toLowerCase().trim())
    );
    const explicitSkillsForRole =
      normalizedRoleSkills.size > 0
        ? explicitSkills.filter((skill) =>
            normalizedRoleSkills.has(skill.toLowerCase().trim())
          )
        : explicitSkills;
    const masterSkills =
      explicitSkillsForRole.length > 0 ? explicitSkillsForRole : roleSkillsFallback;
    const skillLevels = normalizeSkillLevels(body.skillLevels, masterSkills);
    const existingProgress: any = await CareerProgressModel.findOne({ userId: user._id }).lean();
    const completedSkillsFromBody = normalizeCompletedSkills(body.completedSkills);
    const derivedFromLevels = deriveCompletedSkillsFromLevels(skillLevels, masterSkills);
    const preservedCompletedSkills =
      completedSkillsFromBody.length > 0
        ? completedSkillsFromBody
        : Array.isArray(existingProgress?.completedSkills)
        ? existingProgress.completedSkills.map(String)
        : derivedFromLevels;
    const preservedCompletedSteps = Array.isArray(existingProgress?.completedSteps)
      ? existingProgress.completedSteps.map(String)
      : [];
    const preservedCompletedTasks = Array.isArray(existingProgress?.completedTasks)
      ? existingProgress.completedTasks.map(String)
      : preservedCompletedSteps;
    const roadmap: any = await RoadmapModel.findOne({ userId: user._id }).lean();
    const beginnerTasks = Array.isArray(roadmap?.stages?.beginner)
      ? roadmap.stages.beginner.map(String)
      : [];
    const intermediateTasks = Array.isArray(roadmap?.stages?.intermediate)
      ? roadmap.stages.intermediate.map(String)
      : [];
    const advancedTasks = Array.isArray(roadmap?.stages?.advanced)
      ? roadmap.stages.advanced.map(String)
      : [];
    const roadmapProgress = {
      beginnerCompleted:
        beginnerTasks.length > 0 &&
        beginnerTasks.every((task: string) => isTaskCompleted(task, preservedCompletedSkills)),
      intermediateCompleted:
        intermediateTasks.length > 0 &&
        intermediateTasks.every((task: string) => isTaskCompleted(task, preservedCompletedSkills)),
      advancedCompleted:
        advancedTasks.length > 0 &&
        advancedTasks.every((task: string) => isTaskCompleted(task, preservedCompletedSkills)),
    };

    const analysis = await analyzeCareerProgress({
      role: selectedRole,
      roleSkills: masterSkills,
      profile: {
        educationLevel,
        fieldOfStudy,
        experienceLevel,
        learningGoal,
        skillLevels,
      },
    });

    const saved: any = await CareerProgressModel.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        selectedRole,
        roleSkills: masterSkills,
        educationLevel,
        fieldOfStudy,
        experienceLevel,
        learningGoal,
        skillLevels,
        strongSkills: analysis.strongSkills,
        weakSkills: analysis.weakSkills,
        missingSkills: analysis.missingSkills,
        domainExpertiseScore: analysis.metrics.domainExpertise,
        practicalExposureScore: analysis.metrics.practicalExposure,
        communicationScore: analysis.metrics.communication,
        executionDisciplineScore: analysis.metrics.executionDiscipline,
        recommendedSkills: analysis.recommendedSkills,
        recommendedActions: analysis.recommendedActions,
        completedSkills: preservedCompletedSkills,
        completedSteps: preservedCompletedSteps,
        completedTasks: preservedCompletedTasks,
        roadmapProgress,
        analysisSource: analysis.source,
        generatedAt: new Date(analysis.generatedAt),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({
      success: true,
      data: {
        selectedRole,
        roleSkills: masterSkills,
        radarSkills: masterSkills,
        profile: {
          educationLevel,
          fieldOfStudy,
          experienceLevel,
          learningGoal,
          skillLevels,
        },
        completedSkills: Array.isArray(saved?.completedSkills)
          ? saved.completedSkills.map(String)
          : [],
        completedSteps: Array.isArray(saved?.completedSteps)
          ? saved.completedSteps.map(String)
          : [],
        completedTasks: Array.isArray(saved?.completedTasks)
          ? saved.completedTasks.map(String)
          : Array.isArray(saved?.completedSteps)
          ? saved.completedSteps.map(String)
          : [],
        roadmapProgress: saved?.roadmapProgress || roadmapProgress,
        analysis: {
          strongSkills: saved?.strongSkills || [],
          weakSkills: saved?.weakSkills || [],
          missingSkills: saved?.missingSkills || [],
          recommendedSkills: saved?.recommendedSkills || [],
          recommendedActions: saved?.recommendedActions || [],
          metrics: {
            domainExpertise: Number(saved?.domainExpertiseScore || 0),
            practicalExposure: Number(saved?.practicalExposureScore || 0),
            communication: Number(saved?.communicationScore || 0),
            executionDiscipline: Number(saved?.executionDisciplineScore || 0),
          },
          generatedAt: saved?.generatedAt
            ? new Date(saved.generatedAt).toISOString()
            : new Date().toISOString(),
          source: String(saved?.analysisSource || "rule_based"),
        },
      },
    });
  } catch (error) {
    console.error("Progress tracker POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze and save progress tracker data" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await resolveAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const completed = Boolean(body.completed);
    const explicitCompletedSkills = normalizeCompletedSkills(body.completedSkills);
    const skillId = String(body.stepId || body.skillId || body.skill || "").trim();
    if (!skillId && explicitCompletedSkills.length === 0) {
      return NextResponse.json(
        { success: false, error: "stepId/skillId/skill or completedSkills is required" },
        { status: 400 }
      );
    }

    const progress: any = await CareerProgressModel.findOne({ userId: user._id }).lean();
    const existingCompletedSkills = Array.isArray(progress?.completedSkills)
      ? progress.completedSkills.map(String)
      : [];
    const existingCompletedSteps = Array.isArray(progress?.completedSteps)
      ? progress.completedSteps.map(String)
      : [];
    const existingCompletedTasks = Array.isArray(progress?.completedTasks)
      ? progress.completedTasks.map(String)
      : existingCompletedSteps;
    const nextCompletedSkills =
      explicitCompletedSkills.length > 0
        ? explicitCompletedSkills
        : existingCompletedSkills;
    const nextCompletedSteps =
      explicitCompletedSkills.length > 0
        ? existingCompletedSteps
        : completed
        ? Array.from(new Set([...existingCompletedSteps, skillId]))
        : existingCompletedSteps.filter((id: string) => id !== skillId);
    const nextCompletedTasks =
      explicitCompletedSkills.length > 0
        ? existingCompletedTasks
        : completed
        ? Array.from(new Set([...existingCompletedTasks, skillId]))
        : existingCompletedTasks.filter((id: string) => id !== skillId);

    const roadmap: any = await RoadmapModel.findOne({ userId: user._id }).lean();
    const beginnerTasks = Array.isArray(roadmap?.stages?.beginner)
      ? roadmap.stages.beginner.map(String)
      : [];
    const intermediateTasks = Array.isArray(roadmap?.stages?.intermediate)
      ? roadmap.stages.intermediate.map(String)
      : [];
    const advancedTasks = Array.isArray(roadmap?.stages?.advanced)
      ? roadmap.stages.advanced.map(String)
      : [];
    const roadmapProgress = {
      beginnerCompleted:
        beginnerTasks.length > 0 &&
        beginnerTasks.every((task: string) => isTaskCompleted(task, nextCompletedSkills)),
      intermediateCompleted:
        intermediateTasks.length > 0 &&
        intermediateTasks.every((task: string) => isTaskCompleted(task, nextCompletedSkills)),
      advancedCompleted:
        advancedTasks.length > 0 &&
        advancedTasks.every((task: string) => isTaskCompleted(task, nextCompletedSkills)),
    };

    await CareerProgressModel.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        completedSkills: nextCompletedSkills,
        completedSteps: nextCompletedSteps,
        completedTasks: nextCompletedTasks,
        roadmapProgress,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      data: {
        completedSkills: nextCompletedSkills,
        completedSteps: nextCompletedSteps,
        completedTasks: nextCompletedTasks,
        roadmapProgress,
      },
    });
  } catch (error) {
    console.error("Progress tracker PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update step progress" },
      { status: 500 }
    );
  }
}
