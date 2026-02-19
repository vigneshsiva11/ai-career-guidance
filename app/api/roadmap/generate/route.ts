import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/server/config/database";
import { UserModel } from "@/server/models/User";
import { AssessmentModel } from "@/server/models/Assessment";
import { RoadmapModel } from "@/server/models/Roadmap";
import { logUserActivity } from "@/server/utils/activityLogger";
import { buildUnsupportedRoadmap, getFixedRoadmapForRole } from "@/lib/fixed-roadmaps";

type RoadmapStages = {
  beginner: string[];
  intermediate: string[];
  advanced: string[];
};

async function resolveUser(userId: string) {
  if (String(userId).match(/^[a-f0-9]{24}$/i)) {
    return UserModel.findById(userId);
  }
  return UserModel.findOne({ legacyId: Number(userId) });
}

function buildStageDetails(roadmap: RoadmapStages) {
  return [
    {
      stageName: "Beginner",
      skills: roadmap.beginner,
      projects: [],
      duration: "0-3 months",
    },
    {
      stageName: "Intermediate",
      skills: roadmap.intermediate,
      projects: [],
      duration: "3-12 months",
    },
    {
      stageName: "Advanced",
      skills: roadmap.advanced,
      projects: [],
      duration: "12+ months",
    },
  ];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = String(body?.userId || "").trim();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 }
      );
    }

    await connectDatabase();
    const user = await resolveUser(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const assessment = await AssessmentModel.findOne({ userId: user._id });
    if (!assessment) {
      return NextResponse.json(
        { success: false, error: "Assessment not found for this user" },
        { status: 400 }
      );
    }

    const answers = Array.isArray(assessment.answers) ? assessment.answers : [];
    const careerInterest = String(
      assessment.suggestedCareer || answers[0]?.answer || ""
    ).trim();
    if (!careerInterest) {
      return NextResponse.json(
        { success: false, error: "Career interest not found in assessment" },
        { status: 400 }
      );
    }

    const fixed = getFixedRoadmapForRole(careerInterest);
    const generated = fixed
      ? {
          strengthProfile: fixed.strengthProfile,
          careerPersona: fixed.careerPersona,
          recommendedCareer: fixed.canonicalRole,
          roadmap: fixed.roadmap,
          estimatedTimeline: fixed.estimatedTimeline,
          toolsToLearn: fixed.toolsToLearn,
          certifications: fixed.certifications,
          realWorldProjects: fixed.realWorldProjects,
          portfolioRequirements: fixed.portfolioRequirements,
          interviewPreparationTopics: fixed.interviewPreparationTopics,
          requiredTechnicalSkills: fixed.requiredTechnicalSkills || [],
          requiredSoftSkills: fixed.requiredSoftSkills || [],
          internshipStrategy: fixed.internshipStrategy || [],
          freelancingStrategy: fixed.freelancingStrategy || [],
          salaryInsight: fixed.salaryInsight || fixed.salaryRange || "",
          jobPlatformsToApply: fixed.jobPlatformsToApply,
          resumeTips: fixed.resumeTips,
          jobReadyChecklist:
            fixed.jobReadyChecklist && fixed.jobReadyChecklist.length > 0
              ? fixed.jobReadyChecklist
              : [
                  "Complete beginner, intermediate, and advanced roadmap stages",
                  "Build portfolio-ready projects with measurable outcomes",
                  "Prepare resume and apply consistently on job platforms",
                ],
          skillGapPreview: fixed.skillGapPreview,
          source: "fixed_skill_catalog",
        }
      : buildUnsupportedRoadmap(careerInterest);

    assessment.strengthProfile = generated.strengthProfile;
    assessment.persona = generated.careerPersona;
    assessment.suggestedCareer = generated.recommendedCareer;
    assessment.skillGapPreview = generated.skillGapPreview;
    assessment.isCompleted = true;
    await assessment.save();

    await RoadmapModel.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        careerTitle: generated.recommendedCareer,
        targetRole: generated.recommendedCareer,
        stages: generated.roadmap,
        stageDetails: buildStageDetails(generated.roadmap),
        readinessScore: fixed ? 60 : 40,
        estimatedTimeline: generated.estimatedTimeline || "",
        toolsToLearn: generated.toolsToLearn || [],
        certifications: generated.certifications || [],
        realWorldProjects: generated.realWorldProjects || [],
        portfolioRequirements: generated.portfolioRequirements || [],
        interviewPreparationTopics: generated.interviewPreparationTopics || [],
        requiredTechnicalSkills: generated.requiredTechnicalSkills || [],
        requiredSoftSkills: generated.requiredSoftSkills || [],
        internshipStrategy: generated.internshipStrategy || [],
        freelancingStrategy: generated.freelancingStrategy || [],
        salaryInsight: generated.salaryInsight || "",
        jobPlatformsToApply: generated.jobPlatformsToApply || [],
        resumeTips: generated.resumeTips || [],
        jobReadyChecklist: generated.jobReadyChecklist || [],
        source: generated.source,
        generatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await UserModel.updateOne(
      { _id: user._id },
      { $set: { assessmentCompleted: true } }
    );

    await logUserActivity(String(user._id), "ROADMAP_GENERATED", {
      source: "roadmap_generate_api",
      mode: fixed ? "fixed_catalog" : "unsupported_skill",
      career: generated.recommendedCareer,
      roadmapSource: generated.source,
    });

    return NextResponse.json({
      success: true,
      data: {
        strengthProfile: generated.strengthProfile,
        careerPersona: generated.careerPersona,
        suggestedCareerPath: generated.recommendedCareer,
        roadmap: generated.roadmap,
        estimatedTimeline: generated.estimatedTimeline || "",
        toolsToLearn: generated.toolsToLearn || [],
        certifications: generated.certifications || [],
        realWorldProjects: generated.realWorldProjects || [],
        portfolioRequirements: generated.portfolioRequirements || [],
        interviewPreparationTopics: generated.interviewPreparationTopics || [],
        requiredTechnicalSkills: generated.requiredTechnicalSkills || [],
        requiredSoftSkills: generated.requiredSoftSkills || [],
        internshipStrategy: generated.internshipStrategy || [],
        freelancingStrategy: generated.freelancingStrategy || [],
        salaryInsight: generated.salaryInsight || "",
        jobPlatformsToApply: generated.jobPlatformsToApply || [],
        resumeTips: generated.resumeTips || [],
        jobReadyChecklist: generated.jobReadyChecklist || [],
        skillGapPreview: generated.skillGapPreview,
        source: generated.source,
      },
    });
  } catch (error) {
    console.error("Roadmap generate API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate roadmap",
      },
      { status: 500 }
    );
  }
}
