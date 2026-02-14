import { type NextRequest, NextResponse } from "next/server"
import { ivrService } from "@/lib/ivr-service"
import type { VoiceInput } from "@/lib/ivr-service"

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phoneNumber = searchParams.get("phone")

    if (!phoneNumber) {
      return NextResponse.json(
        {
          action: "say",
          text: "Registration error. Please try again.",
        },
        { status: 400 },
      )
    }

    const body = await request.json()

    // Mock voice input - in production, this comes from speech-to-text
    const voiceInput: VoiceInput = {
      transcription: body.SpeechResult || body.transcription || "My name is John Smith English",
      confidence: body.Confidence || 0.8,
      language: body.Language || "en",
    }

    console.log("[IVR] Registration input:", voiceInput)

    const response = await ivrService.handleRegistration(phoneNumber, voiceInput)

    return NextResponse.json({
      action: response.action,
      text: response.text,
      language: response.language,
      next_url: response.nextUrl,
    })
  } catch (error) {
    console.error("IVR registration error:", error)
    return NextResponse.json({
      action: "say",
      text: "Registration failed. Please try again or use our SMS service.",
    })
  }
}
