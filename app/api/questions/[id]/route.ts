import { type NextRequest, NextResponse } from "next/server"
import { getQuestionById, getAnswersByQuestion } from "@/lib/database"
import type { ApiResponse, Question, Answer } from "@/lib/types"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const questionId = Number.parseInt(params.id)

    if (Number.isNaN(questionId)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Invalid question ID",
        },
        { status: 400 },
      )
    }

    // Get question
    const question = await getQuestionById(questionId)
    if (!question) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Question not found",
        },
        { status: 404 },
      )
    }

    // Get answers
    const answers = await getAnswersByQuestion(questionId)

    return NextResponse.json<ApiResponse<Question & { answers: Answer[] }>>({
      success: true,
      data: {
        ...question,
        answers,
      },
    })
  } catch (error) {
    console.error("Error fetching question:", error)
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
