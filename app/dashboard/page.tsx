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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading your dashboard...</p>
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
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Classless</h1>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {user.user_type === "student" ? "Student Dashboard" : "Teacher Dashboard"}
          </h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
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
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Career Assessment Completed</CardTitle>
              <CardDescription>
                Your personalized strengths and roadmap are ready.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/roadmap")}>
                See Your Strength & Roadmap
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/ask">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Ask Question</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>Get instant AI-powered answers to your questions</CardDescription>
              </CardContent>
            </Card>
          </Link>

          {user.user_type === "student" && (
            <Link href="/ask-teacher">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">Ask Teacher</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>Send a question to your teacher and view their replies</CardDescription>
                </CardContent>
              </Card>
            </Link>
          )}

          {user.user_type === "teacher" && (
            <Link href="/teacher/pending">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-lg">Answer Questions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>Help students by answering their questions</CardDescription>
                </CardContent>
              </Card>
            </Link>
          )}

          {user.user_type === "student" && (
            <Link href="/quiz/progress">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-indigo-600" />
                    <CardTitle className="text-lg">My Quiz Progress</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>View your attended quizzes, scores, and history</CardDescription>
                </CardContent>
              </Card>
            </Link>
          )}

          {user.user_type === "student" && (
            <Link href="/scholarships">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-lg">Scholarships</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>Discover scholarships and government schemes</CardDescription>
                </CardContent>
              </Card>
            </Link>
          )}

          <Link href="/stations">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-lg">Learning Stations</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>Find community learning stations near you</CardDescription>
              </CardContent>
            </Card>
          </Link>

          {user.user_type === "teacher" && (
            <Link href="/teacher/quiz-progress">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-indigo-600" />
                    <CardTitle className="text-lg">Student Quiz Progress</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>View and track student quiz performance and progress</CardDescription>
                </CardContent>
              </Card>
            </Link>
          )}

          <Link href="/career-guidance">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-lg">Career Guidance</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>Plan your future with career guidance tools</CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>

        {user.user_type === "student" && recentActivities.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest tracked actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={activity._id || index} className="border rounded-lg p-3">
                    <p className="font-medium text-gray-900 text-sm">{activity.activityType}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Your Recent Questions</span>
            </CardTitle>
            <CardDescription>
              {user.user_type === "student"
                ? "Questions you've asked recently"
                : "Questions you've answered recently"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
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
                    className="border rounded-lg p-4"
                    onClick={() => navigateToAskTeacherIfTeacherQuestion(question.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-gray-900 line-clamp-2">{question.question_text}</p>
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
                    <div className="flex items-center justify-between text-sm text-gray-500">
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

