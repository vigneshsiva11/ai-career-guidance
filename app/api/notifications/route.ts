import { type NextRequest, NextResponse } from "next/server"
import { mockDatabase } from "@/lib/database"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 })
  }

  try {
    const notifications = mockDatabase.notifications.filter((n) => n.userId === userId)
    return NextResponse.json({ notifications })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, title, message, scholarshipId } = body

    const notification = {
      id: Date.now().toString(),
      userId,
      type,
      title,
      message,
      scholarshipId,
      read: false,
      createdAt: new Date().toISOString(),
    }

    mockDatabase.notifications.push(notification)

    return NextResponse.json({ success: true, notification })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, read } = body

    const notification = mockDatabase.notifications.find((n) => n.id === notificationId)
    if (notification) {
      notification.read = read
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
  }
}
