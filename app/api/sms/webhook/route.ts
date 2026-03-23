import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    await request.json()

    return NextResponse.json({
      success: false,
      error: "SMS service has been removed from this project.",
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
    message: "SMS service has been removed from this project",
    timestamp: new Date().toISOString(),
  })
}
