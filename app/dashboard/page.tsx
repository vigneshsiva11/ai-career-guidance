"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  MessageSquare,
  Award,
  Users,
  Plus,
  LogOut,
  Phone,
  MapPin,
  Brain,
  Briefcase,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import type { User, Question } from "@/lib/types";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("classless_user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    fetchUserQuestions(parsedUser.id);
    fetchAssessmentStatus(parsedUser.id);
    fetchRecentActivities(parsedUser.id);
  }, [router]);

  const fetchUserQuestions = async (userId: number) => {
    try {
      const response = await fetch(`/api/questions?user_id=${userId}`);
      const result = await response.json();
      if (result.success) {
        const teacherIdsKey = `classless_teacher_questions_${userId}`;
        let teacherIds: number[] = [];
        try {
          const stored = localStorage.getItem(teacherIdsKey);
          if (stored) teacherIds = JSON.parse(stored);
        } catch {}
        const aiOnly = (result.data as Question[]).filter(
          (q: Question) => !teacherIds.includes(q.id)
        );
        setQuestions(aiOnly);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssessmentStatus = async (userId: number) => {
    try {
      const response = await fetch(`/api/career-assessment?user_id=${userId}`);
      const result = await response.json();
      if (result.success) {
        setAssessmentCompleted(Boolean(result.data?.assessmentCompleted));
      }
    } catch (error) {
      console.error("Error fetching assessment status:", error);
    }
  };

  const fetchRecentActivities = async (userId: number) => {
    try {
      const response = await fetch(`/api/activity?user_id=${userId}&limit=10`);
      const result = await response.json();
      if (result.success) setRecentActivities(result.data || []);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
    }
  };

  const navigateToAskTeacherIfTeacherQuestion = (questionId: number) => {
    try {
      const teacherIdsKey = `classless_teacher_questions_${user?.id}`;
      const stored = teacherIdsKey ? localStorage.getItem(teacherIdsKey) : null;
      const teacherIds: number[] = stored ? JSON.parse(stored) : [];
      if (teacherIds.includes(questionId)) {
        router.push(`/ask-teacher?q=${questionId}`);
      }
    } catch {}
  };

  const handleLogout = () => {
    if (user?.id) {
      fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          activityType: "LOGOUT",
          metadata: { source: "dashboard" },
        }),
      }).finally(() => {
        localStorage.removeItem("classless_user");
        router.push("/");
      });
      return;
    }
    localStorage.removeItem("classless_user");
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 md:px-16">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 rounded-full px-2 py-1 transition-all duration-300 ease-in-out hover:bg-white/80">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Classless</h1>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">Welcome, {user.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="rounded-full border-slate-300 bg-white shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 hover:bg-slate-50 hover:shadow-lg"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-12 px-6 py-10 md:px-16">
        <div className="mb-8 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {user.user_type === "student" ? "Student Dashboard" : "Teacher Dashboard"}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center space-x-1">
              <Phone className="h-4 w-4" />
              <span>{user.phone_number}</span>
            </div>
            {user.location && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{user.location}</span>
              </div>
            )}
            <Badge variant="secondary">{user.user_type}</Badge>
          </div>
        </div>

        {user.user_type === "student" && assessmentCompleted && (
          <Card className="mb-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </span>
                Career Assessment Completed
              </CardTitle>
              <CardDescription className="text-slate-600">
                Your personalized strengths and roadmap are ready.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                  onClick={() => router.push("/roadmap")}
                  className="rounded-full bg-indigo-600 text-white shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-lg"
                >
                See Your Strength & Roadmap
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        <section className="relative mb-10 overflow-hidden rounded-3xl border border-white/50 bg-white/60 p-6 shadow-xl backdrop-blur-md md:p-8">
          <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-indigo-200/30 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/ask">
            <Card className="h-full rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-2 hover:scale-105 hover:shadow-2xl cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </span>
                  <CardTitle className="text-lg font-bold tracking-tight text-slate-900">Ask Question</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600">Get instant AI-powered answers to your questions</CardDescription>
              </CardContent>
            </Card>
          </Link>

          {user.user_type === "student" && (
            <Link href="/ask-teacher">
              <Card className="h-full rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-2 hover:scale-105 hover:shadow-2xl cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </span>
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-900">Ask Teacher</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600">Send a question to your teacher and view their replies</CardDescription>
                </CardContent>
              </Card>
            </Link>
          )}

          {user.user_type === "teacher" && (
            <Link href="/teacher/pending">
              <Card className="h-full rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-2 hover:scale-105 hover:shadow-2xl cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
                      <Users className="h-5 w-5 text-green-600" />
                    </span>
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-900">Answer Questions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600">Help students by answering their questions</CardDescription>
                </CardContent>
              </Card>
            </Link>
          )}

          {user.user_type === "student" && (
            <Link href="/quiz/progress">
              <Card className="h-full rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-2 hover:scale-105 hover:shadow-2xl cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100">
                      <Brain className="h-5 w-5 text-purple-600" />
                    </span>
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-900">My Quiz Progress</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600">View your attended quizzes, scores, and history</CardDescription>
                </CardContent>
              </Card>
            </Link>
          )}

          {user.user_type === "student" && (
            <Link href="/scholarships">
              <Card className="h-full rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-2 hover:scale-105 hover:shadow-2xl cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-100">
                      <Award className="h-5 w-5 text-pink-600" />
                    </span>
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-900">Scholarships</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600">Discover scholarships and government schemes</CardDescription>
                </CardContent>
              </Card>
            </Link>
          )}

          <Link href="/stations">
            <Card className="h-full rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-2 hover:scale-105 hover:shadow-2xl cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100">
                    <MapPin className="h-5 w-5 text-amber-600" />
                  </span>
                  <CardTitle className="text-lg font-bold tracking-tight text-slate-900">Learning Stations</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600">Find community learning stations near you</CardDescription>
              </CardContent>
            </Card>
          </Link>

          {user.user_type === "teacher" && (
            <Link href="/teacher/quiz-progress">
              <Card className="h-full rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-2 hover:scale-105 hover:shadow-2xl cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100">
                      <Brain className="h-5 w-5 text-purple-600" />
                    </span>
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-900">Student Quiz Progress</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600">View and track student quiz performance and progress</CardDescription>
                </CardContent>
              </Card>
            </Link>
          )}

          <Link href="/career-guidance">
            <Card className="h-full rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-2 hover:scale-105 hover:shadow-2xl cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                    <Briefcase className="h-5 w-5 text-emerald-600" />
                  </span>
                  <CardTitle className="text-lg font-bold tracking-tight text-slate-900">Career Guidance</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600">Plan your future with career guidance tools</CardDescription>
              </CardContent>
            </Card>
          </Link>
          </div>
        </section>

        {user.user_type === "student" && recentActivities.length > 0 && (
          <Card className="mb-8 rounded-2xl border border-slate-200 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="font-bold tracking-tight text-slate-900">Recent Activity</CardTitle>
              <CardDescription className="text-slate-600">Your latest tracked actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={activity._id || index} className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-sm font-medium text-slate-900">{activity.activityType}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-2xl border border-slate-200 bg-white shadow-lg">
          <CardHeader className="border-t border-slate-200 pt-8">
            <CardTitle className="flex items-center space-x-2 font-bold tracking-tight text-slate-900">
              <MessageSquare className="h-5 w-5" />
              <span>Your Recent Questions</span>
            </CardTitle>
            <CardDescription className="text-slate-600">
              {user.user_type === "student"
                ? "Questions you've asked recently"
                : "Questions you've answered recently"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="mb-4 text-slate-600">
                  {user.user_type === "student"
                    ? "You haven't asked any questions yet."
                    : "No questions to show."}
                </p>
                {user.user_type === "student" && (
                  <Link href="/ask">
                    <Button>Ask Your First Question</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg"
                    onClick={() => navigateToAskTeacherIfTeacherQuestion(question.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="line-clamp-2 font-medium text-slate-900">{question.question_text}</p>
                      <Badge
                        variant={
                          question.status === "answered"
                            ? "default"
                            : question.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {question.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>{question.language.toUpperCase()}</span>
                      <span>{new Date(question.created_at).toLocaleDateString()}</span>
                    </div>
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
