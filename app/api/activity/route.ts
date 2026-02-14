import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/server/config/database";
import { UserModel } from "@/server/models/User";
import { ActivityLogModel } from "@/server/models/ActivityLog";
import { logUserActivity } from "@/server/utils/activityLogger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId;
    const activityType = body.activityType;
    const metadata = body.metadata || {};

    if (!userId || !activityType) {
      return NextResponse.json(
        { success: false, error: "Missing userId or activityType" },
        { status: 400 }
      );
    }

    const doc = await logUserActivity(userId, activityType, metadata);
    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    console.error("Activity log API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to log activity" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const limit = Number(searchParams.get("limit") || 20);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing user_id" },
        { status: 400 }
      );
    }

    await connectDatabase();
    const user =
      userId.match(/^[a-f0-9]{24}$/i)
        ? await UserModel.findById(userId)
        : await UserModel.findOne({ legacyId: Number(userId) });

    if (!user) return NextResponse.json({ success: true, data: [] });

    const logs = await ActivityLogModel.find({ userId: user._id })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error("Activity fetch API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

