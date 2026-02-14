import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDatabase } from "@/server/config/database";
import { UserModel } from "@/server/models/User";
import { logUserActivity } from "@/server/utils/activityLogger";
import { AUTH_COOKIE_NAME, signAuthToken } from "@/lib/auth";

function toPublicUser(doc: any) {
  return {
    id: String(doc._id),
    legacyId:
      typeof doc.legacyId === "number"
        ? doc.legacyId
        : Number.parseInt(String(doc._id).slice(-6), 16),
    phone_number: doc.phone_number || "",
    name: doc.name,
    user_type: doc.role || "student",
    role: doc.role || "student",
    email: doc.email || "",
    assessmentCompleted: Boolean(doc.assessmentCompleted),
    lastLoginAt: doc.lastLoginAt ? new Date(doc.lastLoginAt).toISOString() : null,
    preferred_language: doc.preferred_language || "en",
    location: doc.location || "",
    education_level: doc.education_level || "",
    created_at: new Date(doc.createdAt || Date.now()).toISOString(),
    updated_at: new Date(doc.updatedAt || Date.now()).toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier || body.phone || body.email || "").trim();
    const password = String(body.password || "");

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: "Missing login credentials" },
        { status: 400 }
      );
    }

    await connectDatabase();

    const numericIdentifier = Number.parseInt(identifier, 10);
    const isNumericIdentifier =
      !Number.isNaN(numericIdentifier) && /^\d{1,20}$/.test(identifier);

    const orFilters: Array<Record<string, unknown>> = [
      { phone_number: identifier },
      { email: identifier.toLowerCase() },
    ];

    if (isNumericIdentifier) {
      orFilters.push({ roll_number: identifier });
      orFilters.push({ legacyId: numericIdentifier });
    }

    let user = await UserModel.findOne({ $or: orFilters });

    if (!user || !user.password) {
      // Backward compatibility for old student accounts where roll_number was not stored.
      // If user enters short numeric roll, try matching student phone prefix/suffix and verify password.
      if (isNumericIdentifier && identifier.length <= 6) {
        const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const candidateUsers = await UserModel.find({
          role: "student",
          password: { $exists: true, $ne: "" },
          $or: [
            { phone_number: { $regex: `^${escaped}` } },
            { phone_number: { $regex: `${escaped}$` } },
          ],
        })
          .limit(25)
          .lean();

        let matchedCandidate: any = null;
        for (const candidate of candidateUsers) {
          const candidatePassword = String(candidate.password || "");
          if (!candidatePassword) continue;
          const passOk = await bcrypt.compare(password, candidatePassword);
          if (passOk) {
            matchedCandidate = candidate;
            break;
          }
        }

        if (matchedCandidate?._id) {
          user = await UserModel.findById(matchedCandidate._id);
        }
      }
    }

    if (!user || !user.password) {
      console.warn("[AuthLogin] user not found for identifier", { identifier });
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      console.warn("[AuthLogin] password mismatch", {
        identifier,
        userId: String(user._id),
      });
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    user.lastLoginAt = new Date();
    await user.save();

    await logUserActivity(user._id.toString(), "LOGIN", {
      loginIdentifier: identifier,
      role: user.role,
    });

    const token = signAuthToken({ userId: String(user._id) });

    const response = NextResponse.json({
      success: true,
      data: toPublicUser(user),
      message: "Login successful",
    });
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const isDbConnectionIssue =
      message.includes("Could not connect to any servers in your MongoDB Atlas cluster") ||
      message.includes("MongooseServerSelectionError") ||
      message.includes("SSL") ||
      message.includes("tlsv1 alert internal error");

    return NextResponse.json(
      {
        success: false,
        error: isDbConnectionIssue
          ? "Database connection failed. Check MongoDB Atlas Network Access (IP whitelist) and DB user credentials."
          : "Internal server error",
      },
      { status: 500 }
    );
  }
}
