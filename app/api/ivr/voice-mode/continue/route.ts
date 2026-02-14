import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const digits = body.get("Digits") as string
    const callSid = body.get("CallSid") as string
    const from = body.get("From") as string

    console.log(`[IVR Voice Continue] Call ${callSid} from ${from}, digits: ${digits}`)

    // If user pressed 1, continue to ask another question
    if (digits === "1") {
      const response = `
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice" language="en-IN">Great! Please ask your next question.</Say>
          <Redirect method="POST">/api/ivr/voice-mode</Redirect>
        </Response>
      `
      return new NextResponse(response, {
        headers: { "Content-Type": "text/xml" }
      })
    }

    // If no input or any other key, end the call
    const goodbyeResponse = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="alice" language="en-IN">Thank you for using AI Tutor Voice Mode. Have a great day!</Say>
      </Response>
    `
    return new NextResponse(goodbyeResponse, {
      headers: { "Content-Type": "text/xml" }
    })

  } catch (error) {
    console.error("[IVR Voice Continue] Error:", error)
    
    const errorResponse = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="alice" language="en-IN">Thank you for using AI Tutor. Goodbye!</Say>
      </Response>
    `
    
    return new NextResponse(errorResponse, {
      headers: { "Content-Type": "text/xml" }
    })
  }
}
