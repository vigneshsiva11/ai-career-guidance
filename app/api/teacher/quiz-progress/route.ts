import { type NextRequest, NextResponse } from "next/server";
import { getQuizAttendanceByStudent, getAllUsers } from "@/lib/database";
import type { QuizAttendance, User } from "@/lib/types";

interface QuizProgressWithStudent extends QuizAttendance {
  student_name: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get("student_id");

    let allAttendance: QuizAttendance[] = [];
    let allUsers: User[] = [];

    if (studentIdParam) {
      const studentId = Number.parseInt(studentIdParam);
      if (Number.isNaN(studentId)) {
        return NextResponse.json(
          { success: false, error: "Invalid student_id" },
          { status: 400 }
        );
      }
      allAttendance = await getQuizAttendanceByStudent(studentId);
    } else {
      // If no student_id is provided, fetch all attendance and all users
      // This is for the teacher dashboard to get a comprehensive view
      allUsers = await getAllUsers();
      const allAttendancePromises = allUsers.map((user) =>
        getQuizAttendanceByStudent(user.id)
      );
      const nestedAttendance = await Promise.all(allAttendancePromises);
      allAttendance = nestedAttendance.flat();
    }

    const usersMap = new Map<number, User>();
    if (allUsers.length === 0 && allAttendance.length > 0) {
      // If allUsers was not fetched (e.g., specific studentId was provided),
      // fetch users for the attendance records to get names.
      const uniqueStudentIds = Array.from(
        new Set(allAttendance.map((a) => a.student_id))
      );
      const usersForAttendance = await Promise.all(
        uniqueStudentIds.map((id) =>
          getAllUsers().then((users) => users.find((u) => u.id === id))
        )
      );
      usersForAttendance.forEach((user) => {
        if (user) usersMap.set(user.id, user);
      });
    } else {
      allUsers.forEach((user) => usersMap.set(user.id, user));
    }

    const progressWithStudentNames: QuizProgressWithStudent[] =
      allAttendance.map((attendance) => ({
        ...attendance,
        student_name:
          usersMap.get(attendance.student_id)?.name ||
          `Unknown Student ${attendance.student_id}`,
      }));

    return NextResponse.json({
      success: true,
      progress: progressWithStudentNames,
    });
  } catch (error) {
    console.error(
      "[Teacher Quiz Progress API] Error fetching quiz progress:",
      error
    );
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
