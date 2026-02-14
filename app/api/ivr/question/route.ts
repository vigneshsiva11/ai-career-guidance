import { type NextRequest, NextResponse } from "next/server"
import { ivrService } from "@/lib/ivr-service"
import { getUserByPhone } from "@/lib/database"
import type { VoiceInput } from "@/lib/ivr-service"

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const phoneNumber = searchParams.get("phone")

    let user = null

    if (userId) {
      // Get user by ID (for existing users)
      const users = await import("@/lib/database").then((db) => db.getAllUsers())
      user = users.find((u) => u.id === Number.parseInt(userId))
    } else if (phoneNumber) {
      // Get user by phone (for new registrations)
      user = await getUserByPhone(phoneNumber)
    }

    if (!user) {
      return NextResponse.json({
        action: "say",
        text: "User not found. Please register first.",
        next_url: `/api/ivr/register?phone=${phoneNumber}`,
      })
    }

    const body = await request.json()

    // Mock voice input
    const voiceInput: VoiceInput = {
      transcription: body.SpeechResult || body.transcription || "What is photosynthesis?",
      confidence: body.Confidence || 0.8,
      language: body.Language || user.preferred_language,
    }

    console.log("[IVR] Question input:", voiceInput)

    const response = await ivrService.handleQuestion(user, voiceInput)

    return NextResponse.json({
      action: response.action,
      text: response.text,
      language: response.language,
      next_url: response.nextUrl,
    })
  } catch (error) {
    console.error("IVR question error:", error)
    return NextResponse.json({
      action: "say",
      text: "Sorry, I couldn't process your question. Please try again.",
    })
  }
}
