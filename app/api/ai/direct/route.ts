import { type NextRequest, NextResponse } from "next/server"
import { aiService } from "@/lib/ai-service"
import type { ApiResponse } from "@/lib/types"
import { logUserActivity } from "@/server/utils/activityLogger"

export async function POST(request: NextRequest) {
  try {
    const { question, subject, grade, language, userId } = await request.json()

    if (!question) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Missing question",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Direct AI request received:", { question, subject, grade, language })

    // Create a temporary question object for AI processing
    const tempQuestion = {
      id: 0, // Temporary ID
      question_text: question,
      subject_id: getSubjectId(subject || "General"),
      difficulty_level: getDifficultyFromGrade(grade || "Mixed"),
      language: language || "en",
      question_type: "text" as const,
      student_id: 0, // Temporary student ID
      status: "pending" as const,
      created_at: new Date().toISOString(),
    }

    console.log("[v0] Processing question with AI service:", tempQuestion)

    // Process question with AI
    const aiResponse = await aiService.processQuestion(tempQuestion)

    if (userId) {
      await logUserActivity(userId, "CHAT_MESSAGE", {
        role: "user",
        content: question,
        subject,
      })
      await logUserActivity(userId, "CHAT_MESSAGE", {
        role: "assistant",
        content: aiResponse.answer,
      })
    }

    console.log("[v0] AI response received:", {
      answerLength: aiResponse.answer.length,
      confidence: aiResponse.confidence,
      needsReview: aiResponse.needsHumanReview,
    })

    return NextResponse.json<ApiResponse<typeof aiResponse>>({
      success: true,
      data: aiResponse,
      message: "AI answer generated successfully",
    })
  } catch (error) {
    console.error("[v0] Error in direct AI endpoint:", error)
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Failed to generate AI answer",
      },
      { status: 500 },
    )
  }
}

function getSubjectId(subject: string): number {
  const subjectMap: Record<string, number> = {
    Mathematics: 1,
    Science: 2,
    English: 3,
    Hindi: 4,
    "Social Studies": 5,
    "Computer Science": 6,
    "Vocational Skills": 7,
    General: 2, // Default to Science for general questions
  }
  return subjectMap[subject] || 2
}

function getDifficultyFromGrade(grade: string): "easy" | "medium" | "hard" {
  if (grade.includes("1") || grade.includes("2") || grade.includes("3") || grade.includes("4") || grade.includes("5")) {
    return "easy"
  } else if (grade.includes("6") || grade.includes("7") || grade.includes("8") || grade.includes("9")) {
    return "medium"
  } else if (grade.includes("10") || grade.includes("11") || grade.includes("12") || grade.includes("Mixed")) {
    return "hard"
  }
  return "medium" // Default
}
