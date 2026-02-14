import { type NextRequest, NextResponse } from "next/server"
import { createQuestion, getQuestionsByUser, getPendingQuestions } from "@/lib/database"
import type { CreateQuestionRequest, ApiResponse, Question } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body: CreateQuestionRequest & { user_id: number } = await request.json()

    // Validate required fields
    if (!body.question_text || !body.subject_id || !body.user_id) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Missing required fields: question_text, subject_id, user_id",
        },
        { status: 400 },
      )
    }

    // Create new question
    const newQuestion = await createQuestion({
      user_id: body.user_id,
      subject_id: body.subject_id,
      question_text: body.question_text,
      question_type: body.question_type || "text",
      image_url: body.image_url,
      audio_url: body.audio_url,
      language: body.language || "en",
      difficulty_level: body.difficulty_level || "medium",
    })

    return NextResponse.json<ApiResponse<Question>>({
      success: true,
      data: newQuestion,
      message: "Question created successfully",
    })
  } catch (error) {
    console.error("Error creating question:", error)
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const status = searchParams.get("status")

    if (userId) {
      const questions = await getQuestionsByUser(Number.parseInt(userId))
      return NextResponse.json<ApiResponse<Question[]>>({
        success: true,
        data: questions,
      })
    }

    if (status === "pending") {
      const questions = await getPendingQuestions()
      return NextResponse.json<ApiResponse<Question[]>>({
        success: true,
        data: questions,
      })
    }

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Please specify user_id or status=pending",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("Error fetching questions:", error)
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
