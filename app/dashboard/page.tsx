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
  Target,
  ArrowRight,
  CheckCircle2,
  UserCircle2,
  FileText,
  X,
} from "lucide-react";
import type { User } from "@/lib/types";
import { toast } from "sonner";
import { useUserProfile } from "@/components/user-profile-provider";

interface AIQuestionHistoryItem {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
  modelUsed?: string;
  category?: string;
}

type SkillLevel = "Beginner" | "Intermediate" | "Advanced";

interface ProgressTrackerData {
  selectedRole: string;
  hasSelectedRole: boolean;
  roleSkills: string[];
  profile: {
    educationLevel: string;
    fieldOfStudy: string;
    experienceLevel: string;
    learningGoal: string;
    skillLevels: Record<string, SkillLevel>;
  };
  analysis: {
    strongSkills: string[];
    weakSkills: string[];
    missingSkills: string[];
    recommendedSkills: string[];
    recommendedActions: string[];
    metrics: {
      domainExpertise: number;
      practicalExposure: number;
      communication: number;
      executionDiscipline: number;
    };
    generatedAt: string | null;
    source: string;
  } | null;
}

const EDUCATION_OPTIONS = [
  "High School",
  "Diploma",
  "B.Tech",
  "B.Sc",
  "MCA",
  "Working Professional",
];

const FIELD_OPTIONS = [
  "Computer Science",
  "Information Technology",
  "Mechanical Engineering",
  "Business",
  "Electronics",
  "Other",
];

const EXPERIENCE_OPTIONS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "Final Year",
  "Graduate",
  "1-3 Years Experience",
  "3-5 Years Experience",
];

const GOAL_OPTIONS = [
  "Get Internship",
  "Get First Job",
  "Switch Career",
  "Improve Skills",
];

export default function DashboardPage() {
  const { status: profileStatus, data: cachedProfile, refreshProfile } = useUserProfile();
  const [user, setUser] = useState<User | null>(null);
  const [aiQuestionHistory, setAiQuestionHistory] = useState<AIQuestionHistoryItem[]>([]);
  const [expandedAiIds, setExpandedAiIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [progressData, setProgressData] = useState<ProgressTrackerData | null>(
    null
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showProfileUpdatedPopup, setShowProfileUpdatedPopup] = useState(false);
  const [profileModalStep, setProfileModalStep] = useState<1 | 2>(1);
  const [profileForm, setProfileForm] = useState({
    educationLevel: "",
    fieldOfStudy: "",
    experienceLevel: "",
    learningGoal: "",
  });
  const [skillLevels, setSkillLevels] = useState<Record<string, SkillLevel>>({});
  const router = useRouter();
  const resolvedAssessmentCompleted = Boolean(
    cachedProfile?.roadmap?.assessmentCompleted ||
    cachedProfile?.roadmap?.result ||
    cachedProfile?.user?.assessmentCompleted ||
    progressData?.hasSelectedRole
  );

  useEffect(() => {
    if (profileStatus === "unauthorized") {
      router.push("/auth/signin");
      return;
    }

    if (profileStatus === "loading") {
      setIsLoading(true);
      return;
    }

    if (profileStatus === "ready" && cachedProfile) {
      const normalizedUser: User = {
        id: cachedProfile.user.legacyId ?? 0,
        phone_number: "",
        name: cachedProfile.user.name,
        user_type:
          cachedProfile.user.role === "teacher" || cachedProfile.user.role === "admin"
            ? cachedProfile.user.role
            : "student",
        preferred_language: "en",
        location: "",
        education_level: cachedProfile.progressTracker.profile.educationLevel || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setUser(normalizedUser);
      localStorage.setItem("classless_user", JSON.stringify(normalizedUser));
      setAssessmentCompleted(
        Boolean(
          cachedProfile.roadmap?.assessmentCompleted ||
          cachedProfile.roadmap?.result ||
          cachedProfile.user.assessmentCompleted ||
          cachedProfile.progressTracker?.hasSelectedRole
        )
      );
      setProgressData(cachedProfile.progressTracker);
      setProfileForm({
        educationLevel: cachedProfile.progressTracker.profile?.educationLevel || "",
        fieldOfStudy: cachedProfile.progressTracker.profile?.fieldOfStudy || "",
        experienceLevel: cachedProfile.progressTracker.profile?.experienceLevel || "",
        learningGoal: cachedProfile.progressTracker.profile?.learningGoal || "",
      });
      setSkillLevels(cachedProfile.progressTracker.profile?.skillLevels || {});
      setIsLoading(false);
    }
  }, [cachedProfile, profileStatus, router]);

  const fetchAIQuestionHistory = async () => {
    try {
      const response = await fetch("/api/questions?history=true", {
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) {
        setAiQuestionHistory(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching AI question history:", error);
    }
  };

  useEffect(() => {
    if (profileStatus === "ready" && cachedProfile?.user?.id) {
      void fetchAIQuestionHistory();
      router.prefetch("/progress-tracker");
      router.prefetch("/roadmap");
      router.prefetch("/resume-optimizer");
    }
  }, [cachedProfile?.user?.id, profileStatus, router]);

  const saveCareerProfile = async () => {
    try {
      setIsSavingProfile(true);
      setProfileError("");
      const completedSkills = Object.entries(skillLevels)
        .filter(([, level]) => level === "Intermediate" || level === "Advanced")
        .map(([skill]) => skill);
      const response = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...profileForm,
          profileSkills: skillLevels,
          completedSkills,
        }),
      });
      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to save profile");
      }
      const refreshed = await refreshProfile({ force: true });
      if (refreshed) {
        setProgressData(refreshed.progressTracker);
        setProfileForm({
          educationLevel: refreshed.progressTracker.profile?.educationLevel || "",
          fieldOfStudy: refreshed.progressTracker.profile?.fieldOfStudy || "",
          experienceLevel: refreshed.progressTracker.profile?.experienceLevel || "",
          learningGoal: refreshed.progressTracker.profile?.learningGoal || "",
        });
        setSkillLevels(refreshed.progressTracker.profile?.skillLevels || {});
      }
      toast.success("Career profile updated successfully.");
      setShowProfileUpdatedPopup(true);
      window.setTimeout(() => setShowProfileUpdatedPopup(false), 3000);
      setIsProfileModalOpen(false);
      setProfileModalStep(1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save profile";
      setProfileError(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const toggleAiHistoryItem = (id: string) => {
    setExpandedAiIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

  const hasProfileAnalysis = Boolean(progressData?.analysis);
  const openProfileModal = () => {
    setProfileError("");
    setProfileModalStep(1);
    setIsProfileModalOpen(true);
  };

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

        {user.user_type === "student" && (
          <Card className="rounded-2xl border border-slate-200 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-900">Selected Career Role</CardTitle>
              <CardDescription>
                Career role selected during assessment and roadmap generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-lg font-semibold text-slate-900">
                {progressData?.hasSelectedRole
                  ? progressData.selectedRole
                  : "No role selected yet"}
              </div>
              {progressData?.hasSelectedRole ? (
                hasProfileAnalysis ? (
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => router.push("/progress-tracker")}
                  >
                    Progress Tracker
                  </Button>
                ) : (
                  <span className="text-sm text-slate-500">
                    Complete profile setup to unlock progress tracker
                  </span>
                )
              ) : (
                <Button
                  className="rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
                  onClick={() => router.push("/assessment")}
                >
                  Select Career Role
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {user.user_type === "student" && progressData?.hasSelectedRole && (
          <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Card className="h-full rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-2 hover:scale-105 hover:shadow-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <UserCircle2 className="h-6 w-6 text-blue-600" />
                  </span>
                  {!hasProfileAnalysis && (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                      Required
                    </Badge>
                  )}
                </div>
                <CardTitle className="mt-3 text-lg font-bold tracking-tight text-slate-900">
                  Career Profile Setup
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Set up your education and skill profile to unlock AI-powered career progress tracking.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={openProfileModal}
                  className="rounded-[10px] bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 font-semibold text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:from-blue-500 hover:to-violet-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.35)]"
                >
                  {hasProfileAnalysis ? "Update Profile" : "Set Up Profile"}
                </Button>
              </CardContent>
            </Card>

            <Card className="h-full rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-2 hover:scale-105 hover:shadow-2xl">
              <CardHeader className="pb-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </span>
                <CardTitle className="mt-3 text-lg font-bold tracking-tight text-slate-900">
                  Career Assessment {resolvedAssessmentCompleted ? "Completed" : "Pending"}
                </CardTitle>
                <CardDescription className="text-slate-600">
                  {resolvedAssessmentCompleted
                    ? "Your strengths and personalized career roadmap are ready."
                    : "Complete your assessment to generate strengths and roadmap insights."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() =>
                    router.push(resolvedAssessmentCompleted ? "/roadmap" : "/assessment")
                  }
                  className="rounded-[10px] bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 font-semibold text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:from-emerald-500 hover:to-teal-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                >
                  {resolvedAssessmentCompleted
                    ? "View Strengths & Roadmap"
                    : "Complete Assessment"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </section>
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
            <Link href="/resume-optimizer">
              <Card className="h-full rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-2 hover:scale-105 hover:shadow-2xl cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100">
                      <FileText className="h-5 w-5 text-sky-600" />
                    </span>
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-900">
                      Resume Optimization
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600">
                    Analyze your resume using AI, detect missing skills, improve formatting, and find matched jobs.
                  </CardDescription>
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

          {user.user_type === "student" && hasProfileAnalysis && (
            <Link href="/progress-tracker">
              <Card className="h-full rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-2 hover:scale-105 hover:shadow-2xl cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100">
                      <Target className="h-5 w-5 text-indigo-600" />
                    </span>
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-900">
                      Progress Tracker
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600">
                    View AI skill gap analysis and career readiness predictions
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          )}
          </div>
        </section>

        <Card className="rounded-2xl border border-slate-200 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 font-bold tracking-tight text-slate-900">
              <Brain className="h-5 w-5" />
              <span>My AI Questions</span>
            </CardTitle>
            <CardDescription className="text-slate-600">
              Your previously asked AI questions and answers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {aiQuestionHistory.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-slate-600">
                  No AI questions yet. Ask your first question to build history.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {aiQuestionHistory.map((item) => {
                  const expanded = expandedAiIds.has(item.id);
                  const preview =
                    item.answer.length > 140
                      ? `${item.answer.slice(0, 140)}...`
                      : item.answer;
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg"
                      onClick={() => toggleAiHistoryItem(item.id)}
                    >
                      <p className="font-medium text-slate-900">{item.question}</p>
                      <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">
                        {expanded ? item.answer : preview}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                        <span>{expanded ? "Click to collapse" : "Click to expand"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isProfileModalOpen && progressData?.hasSelectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-300">
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Career Profile Setup</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Tell us about your background and current skill strengths to generate AI-powered progress insights.
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  setProfileModalStep(1);
                  setProfileError("");
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-slate-200 px-6 py-4">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span className={profileModalStep === 1 ? "text-indigo-600" : ""}>Step 1 - Background</span>
                <span className={profileModalStep === 2 ? "text-indigo-600" : ""}>Step 2 - Skills</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all duration-300"
                  style={{ width: profileModalStep === 1 ? "50%" : "100%" }}
                />
              </div>
            </div>

            <div className="max-h-[68vh] overflow-y-auto p-6">
              {profileModalStep === 1 && (
                <div className="space-y-5">
                  <h4 className="text-base font-semibold text-slate-900">Education & Background</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Education Level</label>
                      <select
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        value={profileForm.educationLevel}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            educationLevel: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select education</option>
                        {EDUCATION_OPTIONS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Field of Study</label>
                      <select
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        value={profileForm.fieldOfStudy}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            fieldOfStudy: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select field</option>
                        {FIELD_OPTIONS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Current Year / Experience</label>
                      <select
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        value={profileForm.experienceLevel}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            experienceLevel: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select current year/experience</option>
                        {EXPERIENCE_OPTIONS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Learning Goal</label>
                      <select
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        value={profileForm.learningGoal}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            learningGoal: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select goal</option>
                        {GOAL_OPTIONS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {profileModalStep === 2 && (
                <div className="space-y-5">
                  <h4 className="text-base font-semibold text-slate-900">
                    Current Skill Strengths ({progressData.selectedRole})
                  </h4>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {progressData.roleSkills.map((skill) => (
                      <div key={skill} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="mb-2 text-sm font-medium text-slate-800">{skill}</div>
                        <select
                          className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
                          value={skillLevels[skill] || "Beginner"}
                          onChange={(e) =>
                            setSkillLevels((prev) => ({
                              ...prev,
                              [skill]: e.target.value as SkillLevel,
                            }))
                          }
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profileError && <p className="mt-4 text-sm text-rose-600">{profileError}</p>}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 p-6">
              <Button
                variant="outline"
                className="rounded-[10px]"
                onClick={() => {
                  if (profileModalStep === 1) {
                    setIsProfileModalOpen(false);
                    setProfileError("");
                    return;
                  }
                  setProfileModalStep(1);
                }}
              >
                {profileModalStep === 1 ? "Cancel" : "Back"}
              </Button>

              <div className="flex items-center gap-3">
                {profileModalStep === 1 ? (
                  <Button
                    className="rounded-[10px] bg-gradient-to-r from-blue-600 to-violet-600 px-6 font-semibold text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:from-blue-500 hover:to-violet-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.35)]"
                    onClick={() => setProfileModalStep(2)}
                  >
                    Next: Skills
                  </Button>
                ) : (
                  <Button
                    onClick={saveCareerProfile}
                    disabled={isSavingProfile}
                    className="rounded-[10px] bg-gradient-to-r from-blue-600 to-violet-600 px-6 font-semibold text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:from-blue-500 hover:to-violet-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.35)]"
                  >
                    {isSavingProfile ? "Saving..." : "Save Profile"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showProfileUpdatedPopup && (
        <div className="fixed right-6 top-20 z-[70] w-full max-w-sm rounded-xl border border-emerald-200 bg-white p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">Profile Updated</p>
              <p className="mt-1 text-sm text-slate-600">
                Your career profile was updated successfully.
              </p>
            </div>
            <button
              type="button"
              className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              onClick={() => setShowProfileUpdatedPopup(false)}
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
