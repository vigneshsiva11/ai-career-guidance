import { type NextRequest, NextResponse } from "next/server"
import { getAllSubjects } from "@/lib/database"
import type { ApiResponse, Subject } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const subjects = await getAllSubjects()

    return NextResponse.json<ApiResponse<Subject[]>>({
      success: true,
      data: subjects,
    })
  } catch (error) {
    console.error("Error fetching subjects:", error)
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
