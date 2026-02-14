import { type NextRequest, NextResponse } from "next/server";
import {
  getQuizAttendanceByStudent,
  createQuizAttendance,
  updateQuizAttendance,
} from "@/lib/database";
import type { QuizAttendance } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get("student_id");

    if (!studentIdParam) {
      return NextResponse.json(
        { success: false, error: "Missing required query param: student_id" },
        { status: 400 }
      );
    }

    const studentId = Number.parseInt(studentIdParam);
    if (Number.isNaN(studentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid student_id" },
        { status: 400 }
      );
    }

    // Get all attended quizzes for the student
    const attendedQuizzes = await getQuizAttendanceByStudent(studentId);

    console.log(
      `[Quiz Progress API] Student ${studentId} has ${attendedQuizzes.length} attended quizzes:`,
      attendedQuizzes
    );

    // Return all attended quizzes (both completed and in-progress)
    return NextResponse.json({ success: true, progress: attendedQuizzes });
  } catch (error) {
    console.error("Error fetching quiz progress:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      student_id,
      subject,
      level,
      score,
      total_questions,
      completion_time,
      completed_at,
      status,
      action, // "start" or "complete"
      quiz_id,
    } = body;

    if (typeof student_id !== "number" || !subject || !level) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    if (action === "start") {
      // Create attendance record when quiz is started
      const attendance = await createQuizAttendance({
        student_id,
        quiz_id: quiz_id || `${subject}-${level}-${Date.now()}`,
        subject,
        level,
        attended_at: new Date().toISOString(),
        status: "attended",
      });

      console.log(
        `[Quiz Progress API] Created attendance record for student ${student_id}:`,
        attendance
      );

      return NextResponse.json({ success: true, attendance });
    } else if (action === "complete") {
      // Find the most recent attendance record for this student and quiz
      const attendedQuizzes = await getQuizAttendanceByStudent(student_id);
      const recentAttendance = attendedQuizzes
        .filter((quiz) => quiz.subject === subject && quiz.level === level)
        .sort(
          (a, b) =>
            new Date(b.attended_at).getTime() -
            new Date(a.attended_at).getTime()
        )[0];

      if (!recentAttendance) {
        return NextResponse.json(
          { success: false, error: "No attendance record found for this quiz" },
          { status: 400 }
        );
      }

      // Update the attendance record with completion details
      const updatedAttendance = await updateQuizAttendance(
        recentAttendance.id,
        {
          status: "completed",
          completed_at: completed_at || new Date().toISOString(),
          score: score || 0,
          total_questions: total_questions || 0,
          completion_time: completion_time || 0,
        }
      );

      console.log(
        `[Quiz Progress API] Updated attendance record for student ${student_id}:`,
        updatedAttendance
      );

      return NextResponse.json({
        success: true,
        attendance: updatedAttendance,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action. Use 'start' or 'complete'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error saving quiz progress:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
