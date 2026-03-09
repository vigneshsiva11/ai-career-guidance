import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { connectDatabase } from "@/server/config/database";
import { UserModel } from "@/server/models/User";
import { CareerProgressModel } from "@/server/models/CareerProgress";

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

export async function POST(request: NextRequest) {
  try {
    const source = request.headers.get("x-task-source");
    const referer = String(request.headers.get("referer") || "");
    const allowedByReferer = referer.includes("/roadmap");
    if (source !== "roadmap" && !allowedByReferer) {
      return NextResponse.json(
        { success: false, error: "Task updates are only allowed from roadmap page" },
        { status: 403 }
      );
    }

    const user = await resolveAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const taskId = String(body.taskId || "").trim();
    const hasCompletedFlag = Object.prototype.hasOwnProperty.call(body, "completed");
    const completed = hasCompletedFlag ? Boolean(body.completed) : null;
    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "taskId is required" },
        { status: 400 }
      );
    }

    const existing: any = await CareerProgressModel.collection.findOne({ userId: user._id });
    const existingTasks = Array.isArray(existing?.completedTasks)
      ? existing.completedTasks.map(String)
      : Array.isArray(existing?.completedSteps)
      ? existing.completedSteps.map(String)
      : [];
    const currentlyCompleted = existingTasks.includes(taskId);
    const targetCompleted = completed === null ? !currentlyCompleted : completed;

    const update = targetCompleted
      ? { $addToSet: { completedTasks: taskId, completedSteps: taskId } }
      : { $pull: { completedTasks: taskId, completedSteps: taskId } };

    await CareerProgressModel.collection.updateOne(
      { userId: user._id },
      {
        ...update,
        $setOnInsert: { userId: user._id },
      },
      { upsert: true }
    );

    const refreshed: any = await CareerProgressModel.collection.findOne({ userId: user._id });

    const completedTasks = Array.isArray(refreshed?.completedTasks)
      ? refreshed.completedTasks.map(String)
      : Array.isArray(refreshed?.completedSteps)
      ? refreshed.completedSteps.map(String)
      : [];

    return NextResponse.json({
      success: true,
      data: {
        completedTasks,
        taskId,
        completed: targetCompleted,
      },
    });
  } catch (error) {
    console.error("Tasks toggle API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update task status" },
      { status: 500 }
    );
  }
}
