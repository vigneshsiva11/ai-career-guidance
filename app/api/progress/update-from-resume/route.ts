import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { connectDatabase } from "@/server/config/database";
import { UserModel } from "@/server/models/User";
import { resolveSelectedRoleForUser } from "@/lib/user-role";
import { normalizeResumeSkillList, updateProgressTrackerFromResume } from "@/lib/resume-optimizer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    const matchedSkills = normalizeResumeSkillList(
      Array.isArray(body?.matchedSkills) ? body.matchedSkills : []
    );

    if (matchedSkills.length === 0) {
      return NextResponse.json(
        { success: false, error: "No matched skills provided" },
        { status: 400 }
      );
    }

    const selectedRole = await resolveSelectedRoleForUser({
      userId: String(user._id),
      userDoc: user,
    });
    const result = await updateProgressTrackerFromResume({
      userId: String(user._id),
      selectedRole,
      matchedSkills,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Progress update from resume error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update progress from resume" },
      { status: 500 }
    );
  }
}
