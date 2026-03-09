import { NextRequest, NextResponse } from "next/server";
import {
  connectDatabase,
  DatabaseUnavailableError,
} from "@/server/config/database";
import { UserModel } from "@/server/models/User";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const json = (body: unknown, status = 200) =>
    NextResponse.json(body, {
      status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });

  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    let userId = "";
    try {
      const payload = verifyAuthToken(token);
      userId = payload.userId;
    } catch {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    await connectDatabase();
    const user = await UserModel.findById(userId).lean();
    if (!user) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    return json({
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
  } catch (error: unknown) {
    if (error instanceof DatabaseUnavailableError) {
      console.error("Auth me API database unavailable:", error.message);
      return json({ success: false, error: "Auth service temporarily unavailable" }, 503);
    }

    console.error("Auth me API error:", error);
    return json({ success: false, error: "Internal server error" }, 500);
  }
}
