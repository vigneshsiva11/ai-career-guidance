import { type NextRequest, NextResponse } from "next/server"
import { smsService } from "@/lib/sms-service"
import type { SMSMessage } from "@/lib/sms-service"

export async function POST(request: NextRequest) {
  try {
    // Parse incoming SMS webhook (format depends on SMS provider)
    const body = await request.json()

    // Mock SMS message structure - adapt based on your SMS provider (Twilio, Exotel, etc.)
    const smsMessage: SMSMessage = {
      from: body.From || body.from || body.phone_number,
      body: body.Body || body.message || body.text,
      messageId: body.MessageSid || body.message_id || `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
    }

    console.log("[SMS] Incoming message:", smsMessage)

    // Process the SMS
    const response = await smsService.processIncomingSMS(smsMessage)

    // Send response back to user
    if (response.success) {
      await smsService.sendSMS(response.to, response.message)
    }

    // Return success to SMS provider
    return NextResponse.json({
      success: true,
      message: "SMS processed successfully",
    })
  } catch (error) {
    console.error("SMS webhook error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process SMS",
      },
      { status: 500 },
    )
  }
}

// Handle GET requests for webhook verification (some providers require this)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get("challenge")

  if (challenge) {
    return new Response(challenge, { status: 200 })
  }

  return NextResponse.json({
    message: "SMS webhook endpoint is active",
    timestamp: new Date().toISOString(),
  })
}
