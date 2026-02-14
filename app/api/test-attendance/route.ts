import { NextResponse } from "next/server";
import {
  createQuizAttendance,
  getQuizAttendanceByStudent,
  getAllUsers,
} from "@/lib/database";

export async function GET() {
  try {
    // Test database functions
    const allUsers = await getAllUsers();
    const allAttendance = await getQuizAttendanceByStudent(1); // Test with student ID 1

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: allUsers.length,
        users: allUsers,
        attendanceForStudent1: allAttendance,
        totalAttendance: allAttendance.length,
      },
    });
  } catch (error) {
    console.error("Test attendance error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function POST() {
  try {
    // Create a test attendance record
    const testAttendance = await createQuizAttendance({
      student_id: 1,
      quiz_id: "test-quiz-123",
      subject: "test",
      level: "beginner",
      attended_at: new Date().toISOString(),
      status: "attended",
    });

    return NextResponse.json({
      success: true,
      data: testAttendance,
    });
  } catch (error) {
    console.error("Test attendance creation error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
