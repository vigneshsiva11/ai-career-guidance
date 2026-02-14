import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/server/config/database";
import { UserModel } from "@/server/models/User";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let userId = "";
    try {
      const payload = verifyAuthToken(token);
      userId = payload.userId;
    } catch {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDatabase();
    const user = await UserModel.findById(userId).lean();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: String(user._id),
        legacyId: user.legacyId ?? null,
        name: user.name,
        email: user.email,
        role: user.role,
        assessmentCompleted: Boolean(user.assessmentCompleted),
        lastLoginAt: user.lastLoginAt
          ? new Date(user.lastLoginAt).toISOString()
          : null,
      },
    });
  } catch (error) {
    console.error("Auth me API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

