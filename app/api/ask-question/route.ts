import { NextRequest, NextResponse } from "next/server";
import { aiService } from "@/lib/ai-service";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { connectDatabase } from "@/server/config/database";
import { QuestionHistoryModel } from "@/server/models/QuestionHistory";

export async function POST(request: NextRequest) {
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
      userId = verifyAuthToken(token).userId;
    } catch {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      question_text,
      language = "en",
      response_language = "en",
      question_type = "text",
      category = "",
    } = await request.json();

    console.log("[ask-question] Incoming payload:", {
      language,
      response_language,
      question_type,
      hasQuestion: Boolean(question_text),
      questionLength: String(question_text || "").length,
    });

    if (!question_text || !String(question_text).trim()) {
      return NextResponse.json(
        { success: false, error: "Missing question_text" },
        { status: 400 }
      );
    }

    const aiResponse = await aiService.processQuestion({
      id: 0,
      user_id: 0,
      question_text: String(question_text).trim(),
      question_type,
      language,
      response_language,
      created_at: new Date().toISOString(),
      status: "pending",
    } as any);

    console.log("[ask-question] AI response received:", {
      language: aiResponse.language,
      confidence: aiResponse.confidence,
      answerPreview: aiResponse.answer?.slice(0, 120),
    });

    try {
      await connectDatabase();
      await QuestionHistoryModel.create({
        userId,
        question: String(question_text).trim(),
        answer: aiResponse.answer,
        modelUsed: "gemini",
        category: String(category || "").trim(),
      });
    } catch (saveError) {
      console.error("Failed to save question history:", saveError);
    }

    return NextResponse.json({
      success: true,
      data: {
        answer: aiResponse.answer,
        confidence: aiResponse.confidence,
        language: aiResponse.language,
      },
    });
  } catch (error) {
    console.error("Ask question API error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate AI answer";
    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "production"
            ? "AI service is temporarily unavailable. Please try again."
            : `AI error: ${message}`,
      },
      { status: 500 }
    );
  }
}
