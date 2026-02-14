import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const callSid = body.get("CallSid") as string
    const from = body.get("From") as string

    console.log(`[IVR Incoming] Call ${callSid} from ${from}`)

    // Redirect directly to the AI welcome flow
    // This ensures users connect to AI, not to a human
    const response = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Redirect method="POST">/api/ivr/welcome</Redirect>
      </Response>
    `
    
    return new NextResponse(response, {
      headers: { "Content-Type": "text/xml" }
    })

  } catch (error) {
    console.error("[IVR Incoming] Error:", error)
    
    // Fallback to welcome flow even on error
    const fallbackResponse = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Redirect method="POST">/api/ivr/welcome</Redirect>
      </Response>
    `
    
    return new NextResponse(fallbackResponse, {
      headers: { "Content-Type": "text/xml" }
    })
  }
}
