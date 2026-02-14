"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Users,
  TrendingUp,
  Award,
  Clock,
  Target,
  ArrowLeft,
  BarChart3,
  CheckCircle,
  XCircle,
  Brain,
} from "lucide-react";
import type { User, QuizAttendance } from "@/lib/types";

interface QuizProgressWithStudent extends QuizAttendance {
  student_name: string;
}

export default function TeacherQuizProgressPage() {
  const [user, setUser] = useState<User | null>(null);
  const [quizProgress, setQuizProgress] = useState<QuizProgressWithStudent[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const router = useRouter();

  const subjects = [
    { id: "all", name: "All Subjects", icon: "📚" },
    { id: "math", name: "Mathematics", icon: "🔢" },
    { id: "science", name: "Science", icon: "🔬" },
    { id: "english", name: "English", icon: "📖" },
    { id: "history", name: "History", icon: "📜" },
    { id: "geography", name: "Geography", icon: "🌍" },
    { id: "computer", name: "Computer Science", icon: "💻" },
  ];

  const levels = [
    { id: "all", name: "All Levels" },
    { id: "beginner", name: "Beginner" },
    { id: "intermediate", name: "Intermediate" },
    { id: "advanced", name: "Advanced" },
  ];

  useEffect(() => {
    // Check if user is logged in and is a teacher
    const userData = localStorage.getItem("classless_user");
    if (!userData) {
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.user_type !== "teacher") {
      router.push("/dashboard");
      return;
    }

    setUser(parsedUser);
    fetchQuizProgress();
  }, [router]);

  const fetchQuizProgress = async () => {
    try {
      // Fetch quiz progress from API route
      const response = await fetch("/api/teacher/quiz-progress");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Sort by most recent first
        const sortedProgress = data.progress.sort(
          (a: QuizProgressWithStudent, b: QuizProgressWithStudent) =>
            new Date(b.attended_at).getTime() -
            new Date(a.attended_at).getTime()
        );

        setQuizProgress(sortedProgress);
      } else {
        console.error("API error:", data.error);
      }
    } catch (error) {
      console.error("Error fetching quiz progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProgress = quizProgress.filter((progress) => {
    const subjectMatch =
      selectedSubject === "all" || progress.subject === selectedSubject;
    const levelMatch =
      selectedLevel === "all" || progress.level === selectedLevel;
    return subjectMatch && levelMatch;
  });

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "attended":
        return <Badge className="bg-blue-100 text-blue-800">Attended</Badge>;
      case "abandoned":
        return <Badge className="bg-red-100 text-red-800">Abandoned</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSubjectIcon = (subject: string) => {
    const subjectData = subjects.find((s) => s.id === subject);
    return subjectData?.icon || "📚";
  };

  const formatTime = (seconds: number) => {
    if (seconds === 0) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getOverallStats = () => {
    const completed = quizProgress.filter((p) => p.status === "completed");
    const totalQuizzes = quizProgress.length;
    const avgScore =
      completed.length > 0
        ? completed.reduce(
            (sum, p) => sum + (p.score / p.total_questions) * 100,
            0
          ) / completed.length
        : 0;
    const completionRate =
      totalQuizzes > 0 ? (completed.length / totalQuizzes) * 100 : 0;

    return {
      totalQuizzes,
      completedQuizzes: completed.length,
      avgScore: Math.round(avgScore),
      completionRate: Math.round(completionRate),
    };
  };

  const stats = getOverallStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading quiz progress...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
                  Student Quiz Progress
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.name}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Student Quiz Progress
          </h2>
          <p className="text-gray-600">
            Monitor and track student quiz performance across all subjects and
            levels
          </p>
        </div>

        {/* Overall Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.totalQuizzes}
                  </div>
                  <div className="text-sm text-gray-600">Total Quizzes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.completedQuizzes}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.avgScore}%
                  </div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.completionRate}%
                  </div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filter Results</CardTitle>
            <CardDescription>
              Filter quiz progress by subject and level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => setSelectedSubject(subject.id)}
                      className={`p-2 rounded-lg border-2 transition-all text-sm ${
                        selectedSubject === subject.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-lg mb-1">{subject.icon}</div>
                      <div className="font-medium">{subject.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {levels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setSelectedLevel(level.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-sm ${
                        selectedLevel === level.id
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-medium">{level.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quiz Progress List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Student Quiz Results</span>
            </CardTitle>
            <CardDescription>
              Showing {filteredProgress.length} quiz results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredProgress.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  No quiz results found for the selected filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProgress.map((progress) => (
                  <div
                    key={progress.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {getSubjectIcon(progress.subject)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {progress.student_name}
                          </h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span className="capitalize">
                              {progress.subject}
                            </span>
                            <span>•</span>
                            <span className="capitalize">{progress.level}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(progress.status)}
                        <div className="text-right">
                          <div
                            className={`text-lg font-bold ${getScoreColor(
                              progress.score || 0,
                              progress.total_questions || 1
                            )}`}
                          >
                            {progress.status === "completed" &&
                            progress.score !== undefined
                              ? `${progress.score}/${progress.total_questions}`
                              : progress.status === "attended"
                              ? "Attended"
                              : progress.status === "abandoned"
                              ? "Abandoned"
                              : "In Progress"}
                          </div>
                          {progress.status === "completed" &&
                            progress.score !== undefined && (
                              <div className="text-sm text-gray-500">
                                {Math.round(
                                  ((progress.score || 0) /
                                    (progress.total_questions || 1)) *
                                    100
                                )}
                                %
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    {progress.status === "completed" &&
                      progress.score !== undefined && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Score Progress</span>
                            <span>
                              {Math.round(
                                ((progress.score || 0) /
                                  (progress.total_questions || 1)) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                          <Progress
                            value={
                              ((progress.score || 0) /
                                (progress.total_questions || 1)) *
                              100
                            }
                            className="h-2"
                          />
                          <div className="flex justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatTime(progress.completion_time || 0)}
                              </span>
                            </div>
                            <span>
                              {progress.completed_at
                                ? new Date(
                                    progress.completed_at
                                  ).toLocaleDateString()
                                : new Date(
                                    progress.attended_at
                                  ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )}

                    {progress.status === "in_progress" && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                          Student is currently taking this quiz. Started at{" "}
                          {new Date(progress.completed_at).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {progress.status === "abandoned" && (
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-sm text-red-800">
                          Quiz was abandoned. Started at{" "}
                          {new Date(progress.completed_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
