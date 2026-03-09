import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { connectDatabase } from "@/server/config/database";
import { UserModel } from "@/server/models/User";
import { generateLearningGuideWithGemini } from "@/lib/progress-tracker-ai";
import { resolveSelectedRoleForUser } from "@/lib/user-role";

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
    const itemType = body.itemType === "step" ? "step" : "skill";
    const itemName = String(body.itemName || "").trim();
    if (!itemName) {
      return NextResponse.json(
        { success: false, error: "itemName is required" },
        { status: 400 }
      );
    }

    const selectedRole = await resolveSelectedRoleForUser({
      userId: String(user._id),
      userDoc: user,
    });
    if (!selectedRole) {
      return NextResponse.json(
        { success: false, error: "No selected role found" },
        { status: 400 }
      );
    }

    const guide = await generateLearningGuideWithGemini({
      role: selectedRole,
      itemType,
      itemName,
    });

    return NextResponse.json({
      success: true,
      data: {
        role: selectedRole,
        itemType,
        ...guide,
      },
    });
  } catch (error) {
    console.error("Learning guide API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate learning guide" },
      { status: 500 }
    );
  }
}
