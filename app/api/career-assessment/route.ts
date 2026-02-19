import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/server/config/database";
import { UserModel } from "@/server/models/User";
import { AssessmentModel } from "@/server/models/Assessment";
import { RoadmapModel } from "@/server/models/Roadmap";
import { logUserActivity } from "@/server/utils/activityLogger";
import { buildUnsupportedRoadmap, getFixedRoadmapForRole } from "@/lib/fixed-roadmaps";

type QAPair = { question: string; answer: string };
type HistoryMessage = { role: "user" | "assistant" | "system"; content: string };

type RoadmapStages = {
  beginner: string[];
  intermediate: string[];
  advanced: string[];
};

const FIRST_QUESTION = "What career or role are you most interested in right now?";
const TOTAL_QUESTIONS = 6;

async function resolveUser(userId: string | number) {
  await connectDatabase();
  if (String(userId).match(/^[a-f0-9]{24}$/i)) {
    return UserModel.findById(userId);
  }
  return UserModel.findOne({ legacyId: Number(userId) });
}

async function startOrResetAssessment(userObjectId: any) {
  try {
    const doc = await AssessmentModel.findOneAndUpdate(
      { userId: userObjectId },
      {
        $set: {
          answers: [],
          conversationHistory: [{ role: "assistant", content: FIRST_QUESTION }],
          assessmentStep: 1,
          currentQuestion: FIRST_QUESTION,
          fallbackQuestionUsed: false,
          isCompleted: false,
          strengthProfile: "",
          persona: "",
          suggestedCareer: "",
          skillGapPreview: [],
        },
        $setOnInsert: { userId: userObjectId },
      },
      { upsert: true, new: true }
    );
    return doc;
  } catch (error: any) {
    if (error?.code === 11000) {
      return AssessmentModel.findOneAndUpdate(
        { userId: userObjectId },
        {
          $set: {
            answers: [],
            conversationHistory: [{ role: "assistant", content: FIRST_QUESTION }],
            assessmentStep: 1,
            currentQuestion: FIRST_QUESTION,
            fallbackQuestionUsed: false,
            isCompleted: false,
            strengthProfile: "",
            persona: "",
            suggestedCareer: "",
            skillGapPreview: [],
          },
        },
        { new: true }
      );
    }
    throw error;
  }
}

function normalizeQuestion(text: string) {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function generateNextQuestion(previousAnswer: string, step: number) {
  const answer = previousAnswer.toLowerCase();

  if (step === 1) {
    return "What inspired you to choose this career?";
  }

  if (answer.includes("cricket") || answer.includes("sports")) {
    return "What level are you currently playing at (school, district, state)?";
  }

  if (answer.includes("developer") || answer.includes("software")) {
    return "Which area interests you more: frontend, backend, or AI?";
  }

  if (answer.includes("business") || answer.includes("entrepreneur")) {
    return "Do you prefer startups or corporate environments?";
  }

  return "What skills do you believe are your strongest?";
}

function nextQuestionWithoutDuplicates(
  previousAnswer: string,
  step: number,
  conversationHistory: HistoryMessage[],
  answers: QAPair[]
) {
  const asked = new Set<string>([
    ...conversationHistory
      .filter((item) => item.role === "assistant")
      .map((item) => normalizeQuestion(item.content)),
    ...answers.map((qa) => normalizeQuestion(qa.question)),
  ]);

  const primary = generateNextQuestion(previousAnswer, step);
  if (!asked.has(normalizeQuestion(primary))) {
    return primary;
  }

  const alternates = [
    "What is your current skill level in this career path?",
    "How many hours per week can you commit to improve in this field?",
    "What milestone do you want to achieve in the next 12 months?",
    "What kind of guidance or resources do you need most right now?",
  ];

  for (const candidate of alternates) {
    if (!asked.has(normalizeQuestion(candidate))) {
      return candidate;
    }
  }

  return `What is your next most important goal for this career path (Step ${step})?`;
}

function generateFinalAssessment(answers: QAPair[]) {
  const careerInterest = String(answers[0]?.answer || "Career Path Explorer").trim();
  const fixed = getFixedRoadmapForRole(careerInterest);
  if (fixed) {
    return {
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
    };
  }

  return buildUnsupportedRoadmap(careerInterest);
}

async function completeAssessment(params: {
  user: any;
  assessment: any;
  answers: QAPair[];
  conversationHistory: HistoryMessage[];
}) {
  const { user, assessment, answers, conversationHistory } = params;
  const generated = generateFinalAssessment(answers);

  assessment.answers = answers;
  assessment.conversationHistory = conversationHistory;
  assessment.assessmentStep = TOTAL_QUESTIONS;
  assessment.currentQuestion = "";
  assessment.isCompleted = true;
  assessment.strengthProfile = generated.strengthProfile;
  assessment.persona = generated.careerPersona;
  assessment.suggestedCareer = generated.recommendedCareer;
  assessment.skillGapPreview = generated.skillGapPreview;
  await assessment.save();

  await RoadmapModel.findOneAndUpdate(
    { userId: user._id },
    {
      userId: user._id,
      careerTitle: generated.recommendedCareer,
      targetRole: generated.recommendedCareer,
      stages: generated.roadmap,
      stageDetails: [
        {
          stageName: "Beginner",
          skills: generated.roadmap.beginner,
          projects: [],
          duration: "0-3 months",
        },
        {
          stageName: "Intermediate",
          skills: generated.roadmap.intermediate,
          projects: [],
          duration: "3-12 months",
        },
        {
          stageName: "Advanced",
          skills: generated.roadmap.advanced,
          projects: [],
          duration: "12+ months",
        },
      ],
      readinessScore: 50,
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
      source: generated.source || "fixed_skill_catalog",
      generatedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await UserModel.updateOne({ _id: user._id }, { $set: { assessmentCompleted: true } });

  await logUserActivity(user._id.toString(), "ROADMAP_GENERATED", {
    persona: generated.careerPersona,
    suggestedCareer: generated.recommendedCareer,
    mode: "fixed_catalog",
    source: generated.source || "fixed_skill_catalog",
  });

  return {
    completed: true,
    assessmentCompleted: true,
    answers,
    result: {
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
      source: generated.source || "fixed_skill_catalog",
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body?.userId;
    const action = body?.action as "start" | "answer";
    const answer = body?.answer ? String(body.answer).trim() : "";

    if (!userId || !action) {
      return NextResponse.json({ success: false, error: "Missing userId or action" }, { status: 400 });
    }

    const user = await resolveUser(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    let assessment = await AssessmentModel.findOne({ userId: user._id });

    if (action === "start") {
      const isRetake = Boolean(
        user.assessmentCompleted || assessment?.isCompleted || (assessment?.answers?.length || 0) > 0
      );

      assessment = await startOrResetAssessment(user._id);

      await UserModel.updateOne({ _id: user._id }, { $set: { assessmentCompleted: false } });

      await logUserActivity(user._id.toString(), "ASSESSMENT_START", {
        assessmentStep: assessment.assessmentStep,
        retake: isRetake,
      });

      return NextResponse.json({
        success: true,
        data: {
          completed: false,
          assessmentCompleted: false,
          assessmentStep: 1,
          totalQuestions: TOTAL_QUESTIONS,
          currentQuestion: FIRST_QUESTION,
          answers: [],
          conversationHistory: assessment.conversationHistory,
        },
      });
    }

    if (action === "answer") {
      if (!answer) {
        return NextResponse.json({ success: false, error: "Missing answer text" }, { status: 400 });
      }

      if (!assessment) {
        assessment = await startOrResetAssessment(user._id);
      }

      const currentQuestion = assessment.currentQuestion || FIRST_QUESTION;
      const updatedAnswers: QAPair[] = [...(assessment.answers || []), { question: currentQuestion, answer }];
      const answeredCount = updatedAnswers.length;

      const updatedHistory: HistoryMessage[] = [
        ...(assessment.conversationHistory || []),
        { role: "user", content: answer },
      ];

      await logUserActivity(user._id.toString(), "QUESTION_ANSWERED", {
        step: answeredCount,
        question: currentQuestion,
        answer,
      });

      if (answeredCount < TOTAL_QUESTIONS) {
        const nextQuestion = nextQuestionWithoutDuplicates(
          answer,
          answeredCount,
          updatedHistory,
          updatedAnswers
        );

        const finalHistory: HistoryMessage[] = [
          ...updatedHistory,
          { role: "assistant", content: nextQuestion },
        ];

        assessment.answers = updatedAnswers;
        assessment.conversationHistory = finalHistory;
        assessment.assessmentStep = answeredCount + 1;
        assessment.currentQuestion = nextQuestion;
        assessment.isCompleted = false;
        await assessment.save();

        return NextResponse.json({
          success: true,
          data: {
            completed: false,
            assessmentCompleted: false,
            assessmentStep: answeredCount + 1,
            totalQuestions: TOTAL_QUESTIONS,
            currentQuestion: nextQuestion,
            answers: updatedAnswers,
            conversationHistory: finalHistory,
          },
        });
      }

      // answeredCount === TOTAL_QUESTIONS
      const data = await completeAssessment({
        user,
        assessment,
        answers: updatedAnswers,
        conversationHistory: updatedHistory,
      });

      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Career assessment POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to process assessment" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing user_id" }, { status: 400 });
    }

    const user = await resolveUser(userId);
    if (!user) return NextResponse.json({ success: true, data: null });

    const assessment = await AssessmentModel.findOne({ userId: user._id }).lean();
    const roadmap = await RoadmapModel.findOne({ userId: user._id }).lean();

    if (!assessment || !assessment.isCompleted || !roadmap) {
      return NextResponse.json({
        success: true,
        data: {
          assessmentCompleted: Boolean(user.assessmentCompleted),
          assessmentStarted: Boolean(assessment),
          assessmentStep: assessment?.assessmentStep || 0,
          totalQuestions: TOTAL_QUESTIONS,
          currentQuestion: assessment?.currentQuestion || FIRST_QUESTION,
          answers: assessment?.answers || [],
          conversationHistory: assessment?.conversationHistory || [],
        },
      });
    }

    await logUserActivity(user._id.toString(), "SKILL_GAP_CHECK", {
      source: "assessment_fetch",
    });

    return NextResponse.json({
      success: true,
      data: {
        assessmentCompleted: true,
        assessmentStarted: true,
        assessmentStep: TOTAL_QUESTIONS,
        totalQuestions: TOTAL_QUESTIONS,
        answers: assessment.answers,
        conversationHistory: assessment.conversationHistory || [],
        result: {
          strengthProfile: assessment.strengthProfile,
          careerPersona: assessment.persona,
          suggestedCareerPath: assessment.suggestedCareer,
          roadmap: roadmap.stages,
          estimatedTimeline: String((roadmap as any).estimatedTimeline || ""),
          toolsToLearn: (roadmap as any).toolsToLearn || [],
          certifications: (roadmap as any).certifications || [],
          realWorldProjects: (roadmap as any).realWorldProjects || [],
          portfolioRequirements: (roadmap as any).portfolioRequirements || [],
          interviewPreparationTopics:
            (roadmap as any).interviewPreparationTopics || [],
          requiredTechnicalSkills:
            (roadmap as any).requiredTechnicalSkills || [],
          requiredSoftSkills: (roadmap as any).requiredSoftSkills || [],
          internshipStrategy: (roadmap as any).internshipStrategy || [],
          freelancingStrategy: (roadmap as any).freelancingStrategy || [],
          salaryInsight: String((roadmap as any).salaryInsight || ""),
          jobPlatformsToApply: (roadmap as any).jobPlatformsToApply || [],
          resumeTips: (roadmap as any).resumeTips || [],
          jobReadyChecklist: (roadmap as any).jobReadyChecklist || [],
          skillGapPreview: assessment.skillGapPreview || [],
          source: String((roadmap as any).source || "rule_based_assessment"),
        },
        updatedAt: roadmap.generatedAt || assessment.createdAt,
      },
    });
  } catch (error) {
    console.error("Career assessment GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch assessment" }, { status: 500 });
  }
}
