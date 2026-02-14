import { type NextRequest, NextResponse } from "next/server"
import { aiService } from "@/lib/ai-service"
import type { ApiResponse, Question } from "@/lib/types"
import { logUserActivity } from "@/server/utils/activityLogger"

export async function POST(request: NextRequest) {
  try {
    const { question_text, language, response_language, question_type, userId } = await request.json()

    if (!question_text) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Missing question_text",
        },
        { status: 400 },
      )
    }

    // Create a question object for AI processing
    const question: Question = {
      id: 0, // Temporary ID
      question_text,
      language: language || "en",
      response_language: response_language || "en",
      question_type: (question_type as Question["question_type"]) || "text",
      user_id: 0, // Not needed for AI processing
      created_at: new Date().toISOString(),
      status: "pending",
    }

    // Process question with AI
    const aiResponse = await aiService.processQuestion(question)

    if (userId) {
      await logUserActivity(userId, "CHAT_MESSAGE", {
        role: "user",
        content: question_text,
      })
      await logUserActivity(userId, "CHAT_MESSAGE", {
        role: "assistant",
        content: aiResponse.answer,
      })
    }

    return NextResponse.json<ApiResponse<{ answer: string; confidence: number; language: string }>>({
      success: true,
      data: {
        answer: aiResponse.answer,
        confidence: aiResponse.confidence,
        language: aiResponse.language,
      },
      message: "AI answer generated successfully",
    })
  } catch (error) {
    console.error("Error generating AI answer:", error)
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Failed to generate AI answer",
      },
      { status: 500 },
    )
  }
}
