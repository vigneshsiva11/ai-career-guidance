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
    const user = await resolveAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const stepId = String(body.stepId || "").trim();
    if (!stepId) {
      return NextResponse.json(
        { success: false, error: "stepId is required" },
        { status: 400 }
      );
    }

    const updated: any = await CareerProgressModel.findOneAndUpdate(
      { userId: user._id },
      {
        $addToSet: { completedSteps: stepId },
        $setOnInsert: { userId: user._id },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({
      success: true,
      data: {
        completedSteps: Array.isArray(updated?.completedSteps)
          ? updated.completedSteps.map(String)
          : [],
      },
    });
  } catch (error) {
    console.error("Complete step API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to complete step" },
      { status: 500 }
    );
  }
}
