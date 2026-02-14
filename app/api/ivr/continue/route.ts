import { type NextRequest, NextResponse } from "next/server"
import { ivrService } from "@/lib/ivr-service"
import { getAllUsers } from "@/lib/database"
import type { VoiceInput } from "@/lib/ivr-service"

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json({
        action: "say",
        text: "Session error. Please call again.",
      })
    }

    // Get user
    const users = await getAllUsers()
    const user = users.find((u) => u.id === Number.parseInt(userId))

    if (!user) {
      return NextResponse.json({
        action: "say",
        text: "User not found. Please call again.",
      })
    }

    const body = await request.json()

    // Mock voice input
    const voiceInput: VoiceInput = {
      transcription: body.SpeechResult || body.transcription || "no",
      confidence: body.Confidence || 0.8,
      language: body.Language || user.preferred_language,
    }

    console.log("[IVR] Continue input:", voiceInput)

    const response = await ivrService.handleContinuation(user, voiceInput)

    return NextResponse.json({
      action: response.action,
      text: response.text,
      language: response.language,
      next_url: response.nextUrl,
    })
  } catch (error) {
    console.error("IVR continue error:", error)
    return NextResponse.json({
      action: "say",
      text: "Thank you for using Classless. Goodbye!",
    })
  }
}
