import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { connectDatabase } from "@/server/config/database";
import { UserModel } from "@/server/models/User";
import { CareerProgressModel } from "@/server/models/CareerProgress";
import { resolveSelectedRoleForUser } from "@/lib/user-role";

function normalizeProfileSkills(raw: unknown) {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const result: Record<string, string> = {};

  for (const [skill, level] of Object.entries(source)) {
    const key = String(skill || "").trim();
    if (!key) continue;
    const normalized = String(level || "").trim().toLowerCase();
    if (normalized === "advanced" || normalized === "intermediate" || normalized === "beginner") {
      result[key] = normalized;
    }
  }

  return result;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    await connectDatabase();

    const user: any = await UserModel.findById(payload.userId).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const progress: any = await CareerProgressModel.findOne({ userId: user._id }).lean();
    const selectedRole = await resolveSelectedRoleForUser({
      userId: String(user._id),
      userDoc: user,
    });

    const profileSkills =
      Object.keys(normalizeProfileSkills(user.profileSkills || {})).length > 0
        ? normalizeProfileSkills(user.profileSkills)
        : normalizeProfileSkills(progress?.skillLevels || {});

    return NextResponse.json({
      success: true,
      data: {
        name: String(user.name || ""),
        selectedRole,
        profileSkills,
      },
    });
  } catch (error) {
    console.error("User profile API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
