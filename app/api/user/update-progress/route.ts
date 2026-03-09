import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { connectDatabase } from "@/server/config/database";
import { UserModel } from "@/server/models/User";
import { CareerProgressModel } from "@/server/models/CareerProgress";
import { RoadmapModel } from "@/server/models/Roadmap";

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

    const body = await request.json();
    const completedSkills = normalizeCompletedSkills(body.completedSkills);
    const existing: any = await CareerProgressModel.findOne({ userId: user._id }).lean();
    const existingCompletedSteps = Array.isArray(existing?.completedSteps)
      ? existing.completedSteps.map(String)
      : [];
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

    const updated: any = await CareerProgressModel.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        completedSkills,
        completedSteps: existingCompletedSteps,
        roadmapProgress,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({
      success: true,
      data: {
        userId: String(user._id),
        completedSkills: Array.isArray(updated?.completedSkills)
          ? updated.completedSkills.map(String)
          : [],
        roadmapProgress: updated?.roadmapProgress || roadmapProgress,
      },
    });
  } catch (error) {
    console.error("Update user progress API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
