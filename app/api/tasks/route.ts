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

export async function GET(request: NextRequest) {
  try {
    const user = await resolveAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const progress: any = await CareerProgressModel.collection.findOne({ userId: user._id });
    const completedTasks = Array.isArray(progress?.completedTasks)
      ? progress.completedTasks.map(String)
      : Array.isArray(progress?.completedSteps)
      ? progress.completedSteps.map(String)
      : [];

    return NextResponse.json({
      success: true,
      data: {
        completedTasks,
      },
    });
  } catch (error) {
    console.error("Tasks GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load tasks" },
      { status: 500 }
    );
  }
}
