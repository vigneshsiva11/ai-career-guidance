"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, BarChart3, BookOpen } from "lucide-react";
import type { User, QuizAttendance } from "@/lib/types";

export default function MyQuizProgressPage() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<QuizAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("classless_user");
    if (!userData) {
      router.push("/auth/login");
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.user_type !== "student") {
      router.push("/dashboard");
      return;
    }
    setUser(parsedUser);
    fetchMyProgress(parsedUser.id);
  }, [router]);

  const fetchMyProgress = async (studentId: number) => {
    try {
      console.log(
        "[Quiz Progress Page] Fetching progress for student:",
        studentId
      );
      const response = await fetch(
        `/api/quiz/progress?student_id=${studentId}`
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      console.log("[Quiz Progress Page] Received data:", data);
      setItems(data.progress || []);
    } catch (error) {
      console.error("Failed to fetch quiz progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading your quiz progress...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  My Quiz Progress
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.name} (ID: {user.id})
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              Your recent quiz attempts and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No attended quizzes yet. Start a quiz to see your progress here.
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const pct =
                    item.score && item.total_questions
                      ? Math.round((item.score / item.total_questions) * 100)
                      : 0;
                  return (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{item.subject}</Badge>
                          <Badge variant="outline">{item.level}</Badge>
                        </div>
                        <Badge>{item.status}</Badge>
                      </div>
                      <div className="mb-2 text-sm text-gray-600">
                        {item.completed_at ? (
                          <>
                            Completed on{" "}
                            {new Date(item.completed_at).toLocaleString()} •{" "}
                            {item.completion_time || 0}s
                          </>
                        ) : (
                          <>
                            Attended on{" "}
                            {new Date(item.attended_at).toLocaleString()}
                          </>
                        )}
                      </div>
                      {item.score !== undefined && item.total_questions ? (
                        <>
                          <Progress value={pct} className="h-2" />
                          <div className="mt-2 text-sm text-gray-700">
                            Score: {item.score} / {item.total_questions} ({pct}
                            %)
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Quiz not completed
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/quiz">
            <Button>Take a New Quiz</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
