import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDatabase } from "@/server/config/database";
import { UserModel } from "@/server/models/User";
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

async function nextLegacyId() {
  const latest: any = await UserModel.findOne({}, { legacyId: 1 })
    .sort({ legacyId: -1 })
    .lean();
  return (latest?.legacyId || 0) + 1;
}

function getConfiguredClientIds() {
  return Array.from(
    new Set(
      [process.env.GOOGLE_CLIENT_ID, process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID]
        .flatMap((raw) =>
          String(raw || "")
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
        )
    )
  );
}

function validateGoogleAudience(tokenInfo: any, configuredClientIds: string[]) {
  const tokenAudience = String(tokenInfo?.aud || "").trim();
  const tokenAuthorizedParty = String(tokenInfo?.azp || "").trim();

  return (
    configuredClientIds.length === 0 ||
    configuredClientIds.includes(tokenAudience) ||
    configuredClientIds.includes(tokenAuthorizedParty)
  );
}

async function resolveGoogleProfile({
  credential,
  accessToken,
}: {
  credential: string;
  accessToken: string;
}) {
  const configuredClientIds = getConfiguredClientIds();

  if (credential) {
    const tokenInfoResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!tokenInfoResponse.ok) {
      return { error: "Invalid Google credential", status: 401 as const };
    }

    const tokenInfo = await tokenInfoResponse.json();
    if (!validateGoogleAudience(tokenInfo, configuredClientIds)) {
      return { error: "Google token audience mismatch", status: 401 as const };
    }

    return {
      profile: {
        email: tokenInfo.email,
        name: tokenInfo.name,
        email_verified: tokenInfo.email_verified === "true" || tokenInfo.email_verified === true,
      },
    };
  }

  if (!accessToken) {
    return { error: "Missing Google credential", status: 400 as const };
  }

  const tokenInfoResponse = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
  );
  if (!tokenInfoResponse.ok) {
    return { error: "Invalid Google token", status: 401 as const };
  }

  const tokenInfo = await tokenInfoResponse.json();
  if (!validateGoogleAudience(tokenInfo, configuredClientIds)) {
    return { error: "Google token audience mismatch", status: 401 as const };
  }

  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileResponse.ok) {
    return { error: "Failed to fetch Google profile", status: 401 as const };
  }

  return { profile: await profileResponse.json() };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const credential = String(body.credential || body.idToken || "").trim();
    const accessToken = String(body.accessToken || "").trim();
    const educationLevel = String(body.educationLevel || "").trim();

    if (!credential && !accessToken) {
      return NextResponse.json(
        { success: false, error: "Missing Google credential" },
        { status: 400 }
      );
    }

    const resolved = await resolveGoogleProfile({ credential, accessToken });
    if ("error" in resolved) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const profile = resolved.profile;
    const email = String(profile?.email || "").toLowerCase().trim();
    const name = String(profile?.name || "").trim();

    if (!email || !name || profile?.email_verified === false) {
      return NextResponse.json(
        { success: false, error: "Google account is missing verified email" },
        { status: 400 }
      );
    }

    await connectDatabase();

    let user = await UserModel.findOne({ email });
    if (!user) {
      const legacyId = await nextLegacyId();
      const randomPassword = await bcrypt.hash(
        `${email}-${Date.now()}-${Math.random()}`,
        10
      );

      user = await UserModel.create({
        name,
        email,
        password: randomPassword,
        role: "student",
        preferred_language: "en",
        education_level: educationLevel,
        assessmentCompleted: false,
        legacyId,
        authProvider: "google",
      });
    } else {
      user.name = user.name || name;
      if (!user.education_level && educationLevel) {
        user.education_level = educationLevel;
      }
      if (!user.authProvider) {
        user.authProvider = "google";
      }
      user.lastLoginAt = new Date();
      await user.save();
    }

    const token = signAuthToken({ userId: String(user._id) });

    const response = NextResponse.json({
      success: true,
      data: toPublicUser(user),
      message: "Google login successful",
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
    console.error("Google auth API error:", error);
    return NextResponse.json(
      { success: false, error: "Google authentication failed" },
      { status: 500 }
    );
  }
}
