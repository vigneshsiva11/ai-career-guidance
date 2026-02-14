import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/server/config/database";
import { UserModel } from "@/server/models/User";
import { AssessmentModel } from "@/server/models/Assessment";
import { RoadmapModel } from "@/server/models/Roadmap";
import { logUserActivity } from "@/server/utils/activityLogger";

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

function detectCategory(careerInterest: string) {
  const value = String(careerInterest || "").toLowerCase();
  if (value.includes("cricket") || value.includes("sports") || value.includes("athlete")) {
    return "sports";
  }
  if (
    value.includes("developer") ||
    value.includes("software") ||
    value.includes("engineer") ||
    value.includes("program") ||
    value.includes("ai")
  ) {
    return "technology";
  }
  if (value.includes("business") || value.includes("entrepreneur") || value.includes("startup")) {
    return "business";
  }
  return "general";
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
    "How much time can you commit weekly to improve in this field?",
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

function generateRoadmap(category: string, answers: QAPair[]): RoadmapStages {
  if (category === "sports") {
    return {
      beginner: [
        "Join a recognized academy and follow a weekly training plan",
        "Practice core fundamentals daily with a structured schedule",
        "Build fitness, agility, endurance, and recovery habits",
      ],
      intermediate: [
        "Participate in school/district tournaments regularly",
        "Specialize in batting, bowling, or fielding with targeted drills",
        "Work with a qualified coach and review match performance data",
      ],
      advanced: [
        "Prepare for state and national selection trials",
        "Use performance analytics to refine strategy and consistency",
        "Compete in higher-level leagues and build professional readiness",
      ],
    };
  }

  if (category === "technology") {
    return {
      beginner: [
        "Build fundamentals in core concepts and problem solving",
        "Complete guided projects and document your learning",
        "Practice coding consistently with weekly goals",
      ],
      intermediate: [
        "Develop role-focused projects with increasing complexity",
        "Improve system design and debugging skills",
        "Collaborate on real-world tasks or open-source work",
      ],
      advanced: [
        "Prepare for technical interviews and architecture discussions",
        "Specialize in a high-impact domain such as AI or backend systems",
        "Apply for role-specific opportunities with measurable achievements",
      ],
    };
  }

  if (category === "business") {
    return {
      beginner: [
        "Learn core business, finance, and communication fundamentals",
        "Study market problems and customer needs",
        "Build discipline with small execution goals each week",
      ],
      intermediate: [
        "Validate ideas through pilot projects and feedback loops",
        "Develop sales, operations, and decision-making skills",
        "Network with mentors, founders, and industry practitioners",
      ],
      advanced: [
        "Create scalable business strategies and growth plans",
        "Build leadership and team management capability",
        "Pursue funding, partnerships, or high-responsibility roles",
      ],
    };
  }

  return {
    beginner: [
      "Build foundational knowledge and a consistent learning routine",
      "Identify your strongest skills and close basic gaps",
      "Gain early practical exposure through guided practice",
    ],
    intermediate: [
      "Work on progressively challenging real-world tasks",
      "Improve communication, collaboration, and execution quality",
      "Track milestones and adjust your growth plan regularly",
    ],
    advanced: [
      "Prepare for competitive opportunities in your chosen field",
      "Develop specialization and measurable outcomes",
      "Build long-term growth strategy with mentorship and feedback",
    ],
  };
}

function generateFinalAssessment(answers: QAPair[]) {
  const careerInterest = String(answers[0]?.answer || "Career Path Explorer").trim();
  const category = detectCategory(careerInterest);

  let strengthProfile =
    "You show clear motivation to build your career through structured, consistent progress.";
  let careerPersona = "Focused Growth Learner";

  if (category === "sports") {
    strengthProfile =
      "You demonstrate athletic focus, discipline, and performance-driven intent for competitive growth.";
    careerPersona = "Competitive Athlete";
  } else if (category === "technology") {
    strengthProfile =
      "You show strong analytical thinking and practical curiosity to build technical problem-solving skills.";
    careerPersona = "Technical Builder";
  } else if (category === "business") {
    strengthProfile =
      "You show initiative, opportunity awareness, and decision-making potential for business-oriented roles.";
    careerPersona = "Growth-Oriented Strategist";
  }

  const roadmap = generateRoadmap(category, answers);

  const skillGapPreview =
    category === "sports"
      ? [
          { skill: "Match Experience", gap: 60 },
          { skill: "Physical Conditioning", gap: 50 },
          { skill: "Role Specialization", gap: 55 },
          { skill: "Performance Analytics", gap: 65 },
        ]
      : category === "technology"
      ? [
          { skill: "Problem Solving", gap: 50 },
          { skill: "Project Depth", gap: 60 },
          { skill: "System Design", gap: 65 },
          { skill: "Interview Readiness", gap: 55 },
        ]
      : category === "business"
      ? [
          { skill: "Market Validation", gap: 55 },
          { skill: "Financial Planning", gap: 60 },
          { skill: "Sales & Negotiation", gap: 50 },
          { skill: "Execution Consistency", gap: 58 },
        ]
      : [
          { skill: "Domain Expertise", gap: 55 },
          { skill: "Practical Exposure", gap: 60 },
          { skill: "Communication", gap: 48 },
          { skill: "Execution Discipline", gap: 52 },
        ];

  return {
    strengthProfile,
    careerPersona,
    recommendedCareer: careerInterest,
    roadmap,
    skillGapPreview,
  };
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
      stages: generated.roadmap,
      generatedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await UserModel.updateOne({ _id: user._id }, { $set: { assessmentCompleted: true } });

  await logUserActivity(user._id.toString(), "ROADMAP_GENERATED", {
    persona: generated.careerPersona,
    suggestedCareer: generated.recommendedCareer,
    mode: "rule_based",
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
      skillGapPreview: generated.skillGapPreview,
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
          skillGapPreview: assessment.skillGapPreview || [],
        },
        updatedAt: roadmap.generatedAt || assessment.createdAt,
      },
    });
  } catch (error) {
    console.error("Career assessment GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch assessment" }, { status: 500 });
  }
}
