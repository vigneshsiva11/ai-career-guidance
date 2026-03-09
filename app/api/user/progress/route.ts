import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { connectDatabase } from "@/server/config/database";
import { UserModel } from "@/server/models/User";
import { RoadmapModel } from "@/server/models/Roadmap";
import { CareerProgressModel } from "@/server/models/CareerProgress";
import { resolveRoleSkills } from "@/lib/progress-tracker";
import { resolveSelectedRoleForUser } from "@/lib/user-role";

function makeTaskId(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeLevel(value: unknown) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "advanced") return "Advanced";
  if (normalized === "intermediate") return "Intermediate";
  return "Beginner";
}

function levelToScore(level: string) {
  if (level === "Advanced") return 100;
  if (level === "Intermediate") return 60;
  if (level === "Beginner") return 30;
  return 0;
}

function stageLabelFromPercent(percent: number) {
  if (percent >= 100) return "completed" as const;
  if (percent > 0) return "in-progress" as const;
  return "not-started" as const;
}

function deriveCompletedSkillsFromProfile(profileSkills: Record<string, string>) {
  return Object.entries(profileSkills)
    .filter(([, level]) => {
      const normalized = normalizeLevel(level);
      return normalized === "Intermediate" || normalized === "Advanced";
    })
    .map(([skill]) => skill);
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

    const [progress, roadmap] = await Promise.all([
      CareerProgressModel.findOne({ userId: user._id }).lean(),
      RoadmapModel.findOne({ userId: user._id }).lean(),
    ]);

    const rawProfileSkills =
      progress && typeof (progress as any).skillLevels === "object"
        ? Object.fromEntries(
            Object.entries((progress as any).skillLevels).map(([k, v]) => [
              String(k),
              normalizeLevel(v),
            ])
          )
        : {};

    const completedSkillsStored = Array.isArray((progress as any)?.completedSkills)
      ? (progress as any).completedSkills.map(String)
      : [];
    const completedSkillsDerived = deriveCompletedSkillsFromProfile(rawProfileSkills);
    const completedSkills =
      completedSkillsStored.length > 0 ? completedSkillsStored : completedSkillsDerived;
    const completedSteps = Array.isArray((progress as any)?.completedSteps)
      ? (progress as any).completedSteps.map(String)
      : [];
    const completedTasks = Array.isArray((progress as any)?.completedTasks)
      ? (progress as any).completedTasks.map(String)
      : completedSteps;

    const requiredSkillsRaw = Array.from(
      new Set(
        [
          ...Object.keys(rawProfileSkills),
          ...(Array.isArray((progress as any)?.roleSkills)
            ? (progress as any).roleSkills.map(String)
            : []),
        ].filter(Boolean)
      )
    );
    const requiredSkills =
      mappedRoleSkills.length > 0 ? mappedRoleSkills : requiredSkillsRaw;

    const stageTaskGroups = {
      beginner: Array.isArray((roadmap as any)?.stages?.beginner)
        ? (roadmap as any).stages.beginner.map(String)
        : [],
      intermediate: Array.isArray((roadmap as any)?.stages?.intermediate)
        ? (roadmap as any).stages.intermediate.map(String)
        : [],
      advanced: Array.isArray((roadmap as any)?.stages?.advanced)
        ? (roadmap as any).stages.advanced.map(String)
        : [],
    };
    const stageCounts = {
      beginnerTotal: stageTaskGroups.beginner.length,
      beginnerCompleted: stageTaskGroups.beginner.filter((task: string) =>
        completedTasks.includes(makeTaskId(task))
      ).length,
      intermediateTotal: stageTaskGroups.intermediate.length,
      intermediateCompleted: stageTaskGroups.intermediate.filter((task: string) =>
        completedTasks.includes(makeTaskId(task))
      ).length,
      advancedTotal: stageTaskGroups.advanced.length,
      advancedCompleted: stageTaskGroups.advanced.filter((task: string) =>
        completedTasks.includes(makeTaskId(task))
      ).length,
    };
    const totalTasks =
      stageCounts.beginnerTotal + stageCounts.intermediateTotal + stageCounts.advancedTotal;
    const completedTaskCount =
      stageCounts.beginnerCompleted +
      stageCounts.intermediateCompleted +
      stageCounts.advancedCompleted;
    const scoredLevels = requiredSkills.map((skill) => levelToScore(rawProfileSkills[skill]));
    const maxPossible = requiredSkills.length * 100;
    const totalScore = scoredLevels.reduce(
      (sum: number, value: number) => sum + value,
      0
    );
    const careerScore = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;
    const stageProgress = {
      beginner: stageLabelFromPercent(careerScore >= 40 ? 100 : careerScore),
      intermediate: stageLabelFromPercent(careerScore > 40 ? Math.min(100, ((careerScore - 40) / 30) * 100) : 0),
      advanced: stageLabelFromPercent(careerScore > 70 ? Math.min(100, ((careerScore - 70) / 30) * 100) : 0),
    };
    const selectedSkillsCount = requiredSkills.filter(
      (skill) => rawProfileSkills[skill] === "Intermediate" || rawProfileSkills[skill] === "Advanced"
    ).length;
    const skillCoverage =
      requiredSkills.length > 0
        ? Math.round((selectedSkillsCount / requiredSkills.length) * 100)
        : 0;

    const beginnerTasks = stageTaskGroups.beginner;
    const intermediateTasks = stageTaskGroups.intermediate;
    const advancedTasks = stageTaskGroups.advanced;

    const beginnerCompleted =
      beginnerTasks.length > 0 &&
      beginnerTasks.every((task: string) => isTaskCompleted(task, completedSkills));
    const intermediateCompleted =
      intermediateTasks.length > 0 &&
      intermediateTasks.every((task: string) => isTaskCompleted(task, completedSkills));
    const advancedCompleted =
      advancedTasks.length > 0 &&
      advancedTasks.every((task: string) => isTaskCompleted(task, completedSkills));

    return NextResponse.json({
      success: true,
      data: {
        userId: String(user._id),
        selectedRole,
        requiredSkills,
        profileSkills: rawProfileSkills,
        completedSkills,
        completedSteps,
        completedTasks,
        totalTasks,
        completedTaskCount,
        careerScore,
        skillCoverage,
        stageProgress,
        roadmapProgress: {
          beginnerCompleted,
          intermediateCompleted,
          advancedCompleted,
        },
      },
    });
  } catch (error) {
    console.error("User progress API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user progress" },
      { status: 500 }
    );
  }
}
