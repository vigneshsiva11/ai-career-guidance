import { NextRequest, NextResponse } from "next/server"
import { config } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const digits = body.get("Digits") as string
    const callSid = body.get("CallSid") as string
    const from = body.get("From") as string

    console.log(`[IVR Welcome] Call ${callSid} from ${from}, digits: ${digits}`)

    // If no digits pressed yet, play greeting
    if (!digits) {
      const response = `
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Gather numDigits="1" action="/api/ivr/welcome" method="POST" timeout="10">
            <Say voice="alice" language="en-IN">${config.ivr.greeting}</Say>
          </Gather>
          <Say voice="alice" language="en-IN">We didn't receive any input. Goodbye!</Say>
        </Response>
      `
      return new NextResponse(response, {
        headers: { "Content-Type": "text/xml" }
      })
    }

    // Handle user input
    let redirectUrl = ""
    
    switch (digits) {
      case config.ivr.smsOption:
        // Redirect to SMS mode
        redirectUrl = "/api/ivr/sms-mode"
        console.log(`[IVR Welcome] User ${from} selected SMS mode`)
        break
        
      case config.ivr.voiceOption:
        // Redirect to Voice mode
        redirectUrl = "/api/ivr/voice-mode"
        console.log(`[IVR Welcome] User ${from} selected Voice mode`)
        break
        
      default:
        // Invalid input
        const invalidResponse = `
          <?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="alice" language="en-IN">${config.ivr.invalidInput}</Say>
            <Redirect method="POST">/api/ivr/welcome</Redirect>
          </Response>
        `
        return new NextResponse(invalidResponse, {
          headers: { "Content-Type": "text/xml" }
        })
    }

    // Redirect to selected mode
    const redirectResponse = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Redirect method="POST">${redirectUrl}</Redirect>
      </Response>
    `
    
    return new NextResponse(redirectResponse, {
      headers: { "Content-Type": "text/xml" }
    })

  } catch (error) {
    console.error("[IVR Welcome] Error:", error)
    
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
