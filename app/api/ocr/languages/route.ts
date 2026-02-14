import { type NextRequest, NextResponse } from "next/server"
import { ocrService } from "@/lib/ocr-service"

export async function GET(request: NextRequest) {
  try {
    const supportedLanguages = ocrService.getSupportedLanguages()

    return NextResponse.json({
      success: true,
      data: supportedLanguages,
    })
  } catch (error) {
    console.error("Error fetching supported languages:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch supported languages",
      },
      { status: 500 },
    )
  }
}
