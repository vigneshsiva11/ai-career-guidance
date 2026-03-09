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
import { resolveSelectedRoleForUser } from "@/lib/user-role";

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

function normalizeCompletedSkills(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return Array.from(new Set(raw.map((x) => String(x || "").trim()).filter(Boolean)));
}

function normalizeSkillLevels(raw: unknown, masterSkills: string[]) {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const base = emptySkillLevels(masterSkills);
  for (const skill of masterSkills) {
    const value = String(source[skill] || "").trim().toLowerCase();
    if (value === "advanced") {
      base[skill] = "Advanced";
    } else if (value === "intermediate") {
      base[skill] = "Intermediate";
    } else if (value === "beginner") {
      base[skill] = "Beginner";
    }
  }
  return base;
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

function levelToScore(level: SkillLevel) {
  if (level === "Advanced") return 100;
  if (level === "Intermediate") return 60;
  return 30;
}

function buildFastAnalysis(
  masterSkills: string[],
  skillLevels: Record<string, SkillLevel>,
  selectedRole: string
) {
  const strongSkills = masterSkills.filter((skill) => {
    const level = skillLevels[skill];
    return level === "Advanced" || level === "Intermediate";
  });
  const weakSkills = masterSkills.filter((skill) => skillLevels[skill] === "Beginner");
  const missingSkills: string[] = [];
  const avg =
    masterSkills.length > 0
      ? Math.round(
          masterSkills
            .map((skill) => levelToScore(skillLevels[skill] || "Beginner"))
            .reduce((sum, value) => sum + value, 0) / masterSkills.length
        )
      : 0;

  return {
    strongSkills,
    weakSkills,
    missingSkills,
    recommendedSkills: weakSkills.slice(0, 6),
    recommendedActions: weakSkills.slice(0, 6).map(
      (skill) => `Improve ${skill} through hands-on ${selectedRole} practice tasks.`
    ),
    metrics: {
      domainExpertise: avg,
      practicalExposure: Math.max(0, Math.round(avg * 0.8)),
      communication: Math.max(0, Math.round(avg * 0.75)),
      executionDiscipline: Math.max(0, Math.round(avg * 0.85)),
    },
    source: "rule_based",
    generatedAt: new Date().toISOString(),
  };
}

async function resolveAuthUser(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const payload = verifyAuthToken(token);
    await connectDatabase();
    return await UserModel.findById(payload.userId);
  } catch {
    return null;
  }
}

export async function PUT(request: NextRequest) {
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

    const mappedRoleSkills = resolveRoleSkills(selectedRole);
    const roleSkills = mappedRoleSkills.length > 0 ? mappedRoleSkills : [];

    const profileSkillsRaw = body.profileSkills ?? body.skillLevels;
    const explicitProfileSkills =
      profileSkillsRaw && typeof profileSkillsRaw === "object"
        ? Object.keys(profileSkillsRaw as Record<string, unknown>)
            .map((skill) => String(skill || "").trim())
            .filter(Boolean)
        : [];
    const normalizedRoleSkills = new Set(roleSkills.map((skill) => skill.toLowerCase().trim()));
    const explicitProfileSkillsForRole =
      normalizedRoleSkills.size > 0
        ? explicitProfileSkills.filter((skill) =>
            normalizedRoleSkills.has(skill.toLowerCase().trim())
          )
        : explicitProfileSkills;
    const masterSkills =
      explicitProfileSkillsForRole.length > 0 ? explicitProfileSkillsForRole : roleSkills;
    const skillLevels = normalizeSkillLevels(profileSkillsRaw, masterSkills);
    const completedSkillsIncoming = normalizeCompletedSkills(body.completedSkills);
    const completedSkills =
      completedSkillsIncoming.length > 0
        ? completedSkillsIncoming
        : deriveCompletedSkillsFromLevels(skillLevels, masterSkills);

    const existing: any = await CareerProgressModel.findOne({ userId: user._id }).lean();
    const completedSteps = Array.isArray(existing?.completedSteps)
      ? existing.completedSteps.map(String)
      : [];
    const completedTasks = Array.isArray(existing?.completedTasks)
      ? existing.completedTasks.map(String)
      : completedSteps;

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
        beginnerTasks.every((task: string) => isTaskCompleted(task, completedSkills)),
      intermediateCompleted:
        intermediateTasks.length > 0 &&
        intermediateTasks.every((task: string) => isTaskCompleted(task, completedSkills)),
      advancedCompleted:
        advancedTasks.length > 0 &&
        advancedTasks.every((task: string) => isTaskCompleted(task, completedSkills)),
    };

    const analysis = buildFastAnalysis(masterSkills, skillLevels, selectedRole);

    const saved: any = await CareerProgressModel.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        selectedRole,
        educationLevel,
        fieldOfStudy,
        experienceLevel,
        learningGoal,
        skillLevels,
        completedSkills,
        completedSteps,
        completedTasks,
        roadmapProgress,
        strongSkills: analysis.strongSkills,
        weakSkills: analysis.weakSkills,
        missingSkills: analysis.missingSkills,
        domainExpertiseScore: analysis.metrics.domainExpertise,
        practicalExposureScore: analysis.metrics.practicalExposure,
        communicationScore: analysis.metrics.communication,
        executionDisciplineScore: analysis.metrics.executionDiscipline,
        recommendedSkills: analysis.recommendedSkills,
        recommendedActions: analysis.recommendedActions,
        analysisSource: analysis.source,
        generatedAt: new Date(analysis.generatedAt),
        lastProfileUpdate: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({
      success: true,
      data: {
        selectedRole,
        roleSkills: masterSkills,
        profileSkills: saved?.skillLevels ? Object.fromEntries(Object.entries(saved.skillLevels)) : {},
        completedSkills: Array.isArray(saved?.completedSkills)
          ? saved.completedSkills.map(String)
          : [],
        completedSteps: Array.isArray(saved?.completedSteps)
          ? saved.completedSteps.map(String)
          : [],
        completedTasks: Array.isArray(saved?.completedTasks)
          ? saved.completedTasks.map(String)
          : [],
        roadmapProgress: saved?.roadmapProgress || roadmapProgress,
        lastProfileUpdate: saved?.lastProfileUpdate
          ? new Date(saved.lastProfileUpdate).toISOString()
          : new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Update profile API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile progress" },
      { status: 500 }
    );
  }
}
