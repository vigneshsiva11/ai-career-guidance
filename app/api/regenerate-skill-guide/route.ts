import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { connectDatabase } from "@/server/config/database";
import { UserModel } from "@/server/models/User";
import { UserSkillGuideModel } from "@/server/models/UserSkillGuide";
import { generateLearningGuideWithGemini } from "@/lib/progress-tracker-ai";
import { resolveSelectedRoleForUser } from "@/lib/user-role";

function normalizeSkillKey(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
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

export async function POST(request: NextRequest) {
  try {
    const user = await resolveAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const skillName = String(body.skillName || body.skill || "").trim();
    if (!skillName) {
      return NextResponse.json(
        { success: false, error: "skillName is required" },
        { status: 400 }
      );
    }

    const role = await resolveSelectedRoleForUser({
      userId: String(user._id),
      userDoc: user,
    });
    if (!role) {
      return NextResponse.json(
        { success: false, error: "No selected role found" },
        { status: 400 }
      );
    }

    const guide = await generateLearningGuideWithGemini({
      role,
      itemType: "skill",
      itemName: skillName,
    });
    const skillKey = normalizeSkillKey(skillName);

    const updated: any = await UserSkillGuideModel.findOneAndUpdate(
      { userId: user._id, role, skillKey },
      {
        userId: user._id,
        role,
        skillName,
        skillKey,
        guide,
        generatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({
      success: true,
      data: {
        source: "ai",
        role,
        skillName,
        generatedAt: updated?.generatedAt
          ? new Date(updated.generatedAt).toISOString()
          : new Date().toISOString(),
        guide,
      },
    });
  } catch (error) {
    console.error("Skill guide regeneration error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to regenerate skill guide" },
      { status: 500 }
    );
  }
}
