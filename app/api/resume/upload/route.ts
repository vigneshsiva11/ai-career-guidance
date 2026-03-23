import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { connectDatabase } from "@/server/config/database";
import { UserModel } from "@/server/models/User";
import { ResumeAnalysisModel } from "@/server/models/ResumeAnalysis";
import { resolveSelectedRoleForUser } from "@/lib/user-role";
import {
  analyzeResumeWithGemini,
  buildJobMatches,
  buildSkillImprovementPlan,
  extractResumeTextFromPayload,
  getRoleSkillCatalog,
  updateProgressTrackerFromResume,
} from "@/lib/resume-optimizer";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return (
    !!value &&
    typeof value === "object" &&
    "name" in value &&
    "type" in value &&
    "size" in value &&
    typeof value.arrayBuffer === "function"
  );
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

export async function GET(request: NextRequest) {
  try {
    const user = await resolveAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const selectedRole = await resolveSelectedRoleForUser({
      userId: String(user._id),
      userDoc: user,
    });
    const latest: any = await ResumeAnalysisModel.findOne({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: latest
        ? {
            selectedRole,
            roleSkills: getRoleSkillCatalog(selectedRole),
            analysis: latest,
          }
        : {
            selectedRole,
            roleSkills: getRoleSkillCatalog(selectedRole),
            analysis: null,
        },
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Resume upload GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch resume analysis" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await resolveAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const resumeFile = formData.get("resume");
    if (!isUploadedFile(resumeFile)) {
      return NextResponse.json(
        { success: false, error: "No resume file provided" },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    const lowerName = resumeFile.name.toLowerCase();
    const fileType = String(resumeFile.type || "").toLowerCase();
    const hasAllowedExtension =
      lowerName.endsWith(".pdf") || lowerName.endsWith(".docx") || lowerName.endsWith(".txt");

    if (!hasAllowedExtension && !allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { success: false, error: "Only PDF, DOCX, and TXT resumes are supported" },
        { status: 400 }
      );
    }

    if (!resumeFile.size) {
      return NextResponse.json(
        { success: false, error: "Uploaded file is empty" },
        { status: 400 }
      );
    }

    if (resumeFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Resume file is too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    const bytes = await resumeFile.arrayBuffer();
    if (!(bytes instanceof ArrayBuffer) || bytes.byteLength === 0) {
      return NextResponse.json(
        { success: false, error: "Could not read the uploaded resume file" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(bytes);
    console.log("[ResumeUpload] Parsing resume", {
      name: resumeFile.name,
      type: resumeFile.type,
      size: resumeFile.size,
    });
    let resumeText = "";
    try {
      resumeText = await extractResumeTextFromPayload({
        name: resumeFile.name,
        type: resumeFile.type,
        buffer,
      });
    } catch (error) {
      console.error("Resume parsing error:", error instanceof Error ? error.stack : error);
      throw error;
    }

    if (!resumeText) {
      return NextResponse.json(
        { success: false, error: "Could not extract text from the uploaded resume" },
        { status: 400 }
      );
    }

    const selectedRole = await resolveSelectedRoleForUser({
      userId: String(user._id),
      userDoc: user,
    });
    const relevantSkills = getRoleSkillCatalog(selectedRole);
    const analysis = await analyzeResumeWithGemini({
      resumeText,
      selectedRole,
    });
    const jobSuggestions = buildJobMatches({
      selectedRole,
      matchedSkills: analysis.matchedSkills,
    });
    const skillImprovementPlan = await buildSkillImprovementPlan({
      selectedRole,
      weakSkills: analysis.weakSkills,
      missingSkills: analysis.missingSkills,
    });

    const saved = await ResumeAnalysisModel.create({
      userId: user._id,
      resumeFileName: resumeFile.name,
      resumeText,
      matchedSkills: analysis.matchedSkills,
      weakSkills: analysis.weakSkills,
      missingSkills: analysis.missingSkills,
      jobSuggestions,
      suggestions: analysis.suggestions,
      selectedRole,
      relevantSkills,
      skillImprovementPlan,
      createdAt: new Date(),
    });

    const progressUpdate = await updateProgressTrackerFromResume({
      userId: String(user._id),
      selectedRole,
      matchedSkills: analysis.matchedSkills,
    });

    return NextResponse.json({
      success: true,
      data: {
        selectedRole,
        roleSkills: relevantSkills,
        analysis: {
          ...saved.toObject(),
        },
        progressUpdate,
      },
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Resume upload POST error:", error instanceof Error ? error.stack : error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to analyze resume" },
      { status: 500 }
    );
  }
}
