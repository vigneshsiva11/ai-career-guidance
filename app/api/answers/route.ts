import { type NextRequest, NextResponse } from "next/server"
import { createAnswer } from "@/lib/database"
import type { ApiResponse, Answer } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.question_id || !body.answer_text || !body.answer_type) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Missing required fields: question_id, answer_text, answer_type",
        },
        { status: 400 },
      )
    }

    // Create new answer
    const newAnswer = await createAnswer({
      question_id: body.question_id,
      answer_text: body.answer_text,
      answer_type: body.answer_type,
      teacher_id: body.teacher_id,
      confidence_score: body.confidence_score,
    })

    return NextResponse.json<ApiResponse<Answer>>({
      success: true,
      data: newAnswer,
      message: "Answer created successfully",
    })
  } catch (error) {
    console.error("Error creating answer:", error)
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
