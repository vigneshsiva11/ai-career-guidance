"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { User } from "@/lib/types";

type AssessmentResponse = {
  success: boolean;
  data?: {
    completed?: boolean;
    assessmentCompleted?: boolean;
    assessmentStep?: number;
    totalQuestions?: number;
    currentQuestion?: string;
    answers?: Array<{ question: string; answer: string }>;
    result?: {
      strengthProfile: string;
      careerPersona: string;
      suggestedCareerPath: string;
      roadmap: {
        beginner: string[];
        intermediate: string[];
        advanced: string[];
      };
      skillGapPreview?: Array<{ skill: string; gap: number }>;
    };
  };
  error?: string;
};

export default function AssessmentPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assessmentStep, setAssessmentStep] = useState(1);
  const [assessmentTotalQuestions, setAssessmentTotalQuestions] = useState(7);
  const [assessmentCurrentQuestion, setAssessmentCurrentQuestion] = useState("");
  const [assessmentCurrentAnswer, setAssessmentCurrentAnswer] = useState("");
  const [assessmentSubmitting, setAssessmentSubmitting] = useState(false);
  const [assessmentError, setAssessmentError] = useState("");
  const [cardMotion, setCardMotion] = useState<"idle" | "exit" | "enter">(
    "idle"
  );
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (cardMotion !== "enter") return;
    const frame = window.requestAnimationFrame(() => setCardMotion("idle"));
    return () => window.cancelAnimationFrame(frame);
  }, [cardMotion]);

  useEffect(() => {
    const init = async () => {
      if (hasInitializedRef.current) return;
      hasInitializedRef.current = true;

      const userData = localStorage.getItem("classless_user");
      if (!userData) {
        router.push("/login");
        return;
      }

      const parsed = JSON.parse(userData) as User;
      setUser(parsed);
      await startAssessment(parsed.id);
      setIsLoading(false);
    };

    init();
  }, [router]);

  const startAssessment = async (userId: number) => {
    setAssessmentError("");
    try {
      const response = await fetch("/api/career-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "start",
        }),
      });
      const result = (await response.json()) as AssessmentResponse;
      if (!result.success) {
        throw new Error(result.error || "Failed to start assessment");
      }

      setAssessmentStep(result.data?.assessmentStep || 1);
      setAssessmentTotalQuestions(result.data?.totalQuestions || 7);
      setAssessmentCurrentQuestion(result.data?.currentQuestion || "");
      setAssessmentCurrentAnswer("");
    } catch (error) {
      console.error("Assessment start error:", error);
      setAssessmentError("Unable to start assessment. Please try again.");
    }
  };

  const submitAnswer = async () => {
    if (!assessmentCurrentAnswer.trim() || !user) return;

    setAssessmentSubmitting(true);
    setAssessmentError("");
    setCardMotion("exit");
    try {
      const response = await fetch("/api/career-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: "answer",
          answer: assessmentCurrentAnswer.trim(),
        }),
      });

      const result = (await response.json()) as AssessmentResponse;
      if (!result.success) {
        throw new Error(result.error || "Failed to continue assessment");
      }

      if (result.data?.completed || result.data?.assessmentCompleted) {
        router.replace("/dashboard");
        return;
      }

      setAssessmentStep(result.data?.assessmentStep || assessmentStep + 1);
      setAssessmentTotalQuestions(result.data?.totalQuestions || assessmentTotalQuestions);
      setAssessmentCurrentQuestion(result.data?.currentQuestion || "");
      setAssessmentCurrentAnswer("");
      setCardMotion("enter");
    } catch (error) {
      console.error("Assessment answer error:", error);
      setAssessmentError("Failed to save answer. Please try again.");
      setCardMotion("idle");
    } finally {
      setAssessmentSubmitting(false);
    }
  };

  const getQuestionPlaceholder = (question: string) => {
    const q = question.toLowerCase();

    if (q.includes("career or role are you most interested")) {
      return "Example: Frontend Developer";
    }
    if (q.includes("what inspired you to choose this career")) {
      return "Example: I enjoy solving real-world problems and building useful products.";
    }
    if (q.includes("what level are you currently playing at")) {
      return "Example: District level, all-rounder.";
    }
    if (q.includes("which area interests you more")) {
      return "Example: Backend and AI.";
    }
    if (q.includes("startups or corporate")) {
      return "Example: Startups, because I prefer fast learning and ownership.";
    }
    if (q.includes("current skill level")) {
      return "Example: Beginner - I know the basics and need guided practice.";
    }
    if (q.includes("how many hours per week") || q.includes("how much time can you commit weekly")) {
      return "Example: 8-10 hours per week.";
    }
    if (q.includes("milestone do you want to achieve")) {
      return "Example: Build and deploy 3 portfolio projects in 12 months.";
    }
    if (q.includes("guidance or resources")) {
      return "Example: I need a clear roadmap, interview prep, and project feedback.";
    }

    return "Type your answer...";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">Preparing your assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50">
      <header className="border-b border-slate-200 bg-white/90">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900">Classless</h1>
            </Link>
            <Button
              variant="outline"
              className="rounded-full border-slate-300 bg-white shadow-sm"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl space-y-6">
          <div className="flex justify-center gap-2">
            {Array.from({ length: assessmentTotalQuestions }).map((_, index) => {
              const step = index + 1;
              const isCurrent = step === assessmentStep;
              const isCompleted = step < assessmentStep;
              return (
                <span
                  key={step}
                  className={`rounded-full transition-all duration-300 ease-in-out ${
                    isCurrent
                      ? "h-3.5 w-3.5 bg-blue-600"
                      : isCompleted
                      ? "h-2.5 w-2.5 bg-blue-300"
                      : "h-2.5 w-2.5 bg-slate-300"
                  }`}
                />
              );
            })}
          </div>

          <Card className="mx-auto w-full max-w-[700px] rounded-3xl border border-slate-200 bg-white p-2 shadow-xl">
            <CardHeader className="space-y-2 text-center">
              <CardDescription className="text-sm font-medium text-slate-500">
                Question {assessmentStep} of {assessmentTotalQuestions}
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Career Assessment
              </CardTitle>
            </CardHeader>
            <CardContent
              className={`relative min-h-[360px] space-y-6 pb-20 transition-all duration-300 ease-in-out ${
                cardMotion === "exit"
                  ? "-translate-x-12 opacity-0"
                  : cardMotion === "enter"
                  ? "translate-x-12 opacity-0"
                  : "translate-x-0 opacity-100"
              }`}
            >
              <p className="text-center text-xl font-semibold leading-relaxed text-slate-900 sm:text-2xl">
                {assessmentCurrentQuestion}
              </p>
              <Textarea
                value={assessmentCurrentAnswer}
                onChange={(e) => setAssessmentCurrentAnswer(e.target.value)}
                placeholder={getQuestionPlaceholder(assessmentCurrentQuestion)}
                rows={6}
                className="rounded-2xl border-slate-300 px-5 py-4 text-base shadow-sm transition-all duration-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
              {assessmentError && (
                <p className="text-sm text-red-600">{assessmentError}</p>
              )}
              <div className="absolute bottom-0 right-0">
                <Button
                  onClick={submitAnswer}
                  disabled={assessmentSubmitting || !assessmentCurrentAnswer.trim()}
                  className="rounded-full bg-blue-600 px-6 py-2 text-white shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {assessmentSubmitting
                    ? "Submitting..."
                    : assessmentStep >= assessmentTotalQuestions
                    ? "Finish Assessment"
                    : "Next"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
