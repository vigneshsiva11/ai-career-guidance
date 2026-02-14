import { NextRequest, NextResponse } from "next/server"
import { aiService } from "@/lib/ai-service"
import { config } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const callSid = body.get("CallSid") as string
    const from = body.get("From") as string
    const speechResult = body.get("SpeechResult") as string
    const confidence = body.get("Confidence") as string

    console.log(`[IVR Voice Mode] Call ${callSid} from ${from}, speech: ${speechResult}`)

    // If no speech detected yet, ask for the question
    if (!speechResult) {
      const response = `
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice" language="en-IN">Welcome to Voice Learning Mode!</Say>
          <Say voice="alice" language="en-IN">Please ask your question clearly after the beep. You can ask in English, Hindi, Tamil, or any language you prefer.</Say>
          <Gather input="speech" action="/api/ivr/voice-mode" method="POST" speechTimeout="auto" language="en-IN">
            <Say voice="alice" language="en-IN">Please ask your question now.</Say>
          </Gather>
          <Say voice="alice" language="en-IN">We didn't hear your question. Please try again.</Say>
          <Redirect method="POST">/api/ivr/voice-mode</Redirect>
        </Response>
      `
      return new NextResponse(response, {
        headers: { "Content-Type": "text/xml" }
      })
    }

    // Process the speech input
    if (speechResult) {
      try {
        console.log(`[IVR Voice Mode] Processing question: "${speechResult}" (confidence: ${confidence})`)

        // Process the question with AI
        const aiResponse = await aiService.processQuestion({
          id: 0,
          question_text: speechResult,
          language: "en", // Default to English for voice input
          question_type: "voice",
          status: "pending",
          user_id: 0,
          created_at: new Date().toISOString()
        })

        // Convert AI response to speech-friendly format
        const speechResponse = aiResponse.answer
          .replace(/[^\w\s.,!?-]/g, '') // Remove special characters that might cause TTS issues
          .substring(0, 1000) // Limit length for TTS

        console.log(`[IVR Voice Mode] AI Response: ${speechResponse}`)

        // Return speech response
        const response = `
          <?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="alice" language="en-IN">Here's your answer:</Say>
            <Say voice="alice" language="en-IN">${speechResponse}</Say>
            <Say voice="alice" language="en-IN">Would you like to ask another question? Press 1 for yes, or hang up to end the call.</Say>
            <Gather numDigits="1" action="/api/ivr/voice-mode/continue" method="POST" timeout="5">
              <Say voice="alice" language="en-IN">Press 1 to ask another question.</Say>
            </Gather>
            <Say voice="alice" language="en-IN">Thank you for using AI Tutor Voice Mode. Goodbye!</Say>
          </Response>
        `
        return new NextResponse(response, {
          headers: { "Content-Type": "text/xml" }
        })

      } catch (error) {
        console.error("[IVR Voice Mode] AI Error:", error)
        const errorResponse = `
          <?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="alice" language="en-IN">Sorry, I couldn't process your question right now. Please try again.</Say>
            <Redirect method="POST">/api/ivr/voice-mode</Redirect>
          </Response>
        `
        return new NextResponse(errorResponse, {
          headers: { "Content-Type": "text/xml" }
        })
      }
    }

    // Default response
    const defaultResponse = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="alice" language="en-IN">Please ask your question clearly.</Say>
        <Redirect method="POST">/api/ivr/voice-mode</Redirect>
      </Response>
    `
    return new NextResponse(defaultResponse, {
      headers: { "Content-Type": "text/xml" }
    })

  } catch (error) {
    console.error("[IVR Voice Mode] Error:", error)
    
    const errorResponse = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="alice" language="en-IN">Sorry, there was an error. Please try again later.</Say>
      </Response>
    `
    
    return new NextResponse(errorResponse, {
      headers: { "Content-Type": "text/xml" }
    })
  }
}
