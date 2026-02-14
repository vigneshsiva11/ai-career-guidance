import { NextRequest, NextResponse } from "next/server"
import { createReply, getRepliesByQuestion } from "@/lib/database"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const questionId = Number.parseInt(id)
    const replies = await getRepliesByQuestion(questionId)
    return NextResponse.json({ success: true, data: replies })
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to fetch replies" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const questionId = Number.parseInt(id)
    const body = await request.json()
    const { user_id, text } = body
    if (!user_id || !text) {
      return NextResponse.json({ success: false, error: "Missing user_id or text" }, { status: 400 })
    }
    const reply = await createReply({ question_id: questionId, user_id, text })
    return NextResponse.json({ success: true, data: reply })
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to add reply" }, { status: 500 })
  }
}


