import { NextRequest, NextResponse } from "next/server"
import { aiService } from "@/lib/ai-service"
import { config } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const callSid = body.get("CallSid") as string
    const from = body.get("From") as string
    const digits = body.get("Digits") as string
    const speechResult = body.get("SpeechResult") as string

    console.log(`[IVR SMS Mode] Call ${callSid} from ${from}`)

    // If this is the first time, ask for the question
    if (!speechResult && !digits) {
      const response = `
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice" language="en-IN">Please send your question via SMS to ${config.tollFreeNumbers.sms}. You can ask questions in English, Hindi, Tamil, or any other language you prefer.</Say>
          <Say voice="alice" language="en-IN">For example, text: What is photosynthesis? or ஒளிச்சேர்க்கை என்றால் என்ன?</Say>
          <Say voice="alice" language="en-IN">Our AI tutor will respond with a detailed answer via SMS.</Say>
          <Say voice="alice" language="en-IN">Thank you for using AI Tutor SMS mode!</Say>
        </Response>
      `
      return new NextResponse(response, {
        headers: { "Content-Type": "text/xml" }
      })
    }

    // If user provided a question via speech
    if (speechResult) {
      try {
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

        // Send SMS response (in real implementation, this would use Exotel SMS API)
        console.log(`[IVR SMS Mode] AI Response for ${from}: ${aiResponse.answer}`)
        
        // For demo purposes, we'll just acknowledge
        const response = `
          <?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="alice" language="en-IN">Thank you for your question. I've processed it and will send you a detailed answer via SMS shortly.</Say>
            <Say voice="alice" language="en-IN">You can continue asking questions by sending SMS to ${config.tollFreeNumbers.sms}.</Say>
            <Say voice="alice" language="en-IN">Goodbye!</Say>
          </Response>
        `
        return new NextResponse(response, {
          headers: { "Content-Type": "text/xml" }
        })

      } catch (error) {
        console.error("[IVR SMS Mode] AI Error:", error)
        const errorResponse = `
          <?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="alice" language="en-IN">Sorry, I couldn't process your question right now. Please try sending it via SMS to ${config.tollFreeNumbers.sms}.</Say>
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
        <Say voice="alice" language="en-IN">Please send your question via SMS to ${config.tollFreeNumbers.sms}.</Say>
        <Say voice="alice" language="en-IN">Goodbye!</Say>
      </Response>
    `
    return new NextResponse(defaultResponse, {
      headers: { "Content-Type": "text/xml" }
    })

  } catch (error) {
    console.error("[IVR SMS Mode] Error:", error)
    
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
