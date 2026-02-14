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
  const hasInitializedRef = useRef(false);

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
    } catch (error) {
      console.error("Assessment answer error:", error);
      setAssessmentError("Failed to save answer. Please try again.");
    } finally {
      setAssessmentSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Preparing your assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Classless</h1>
            </Link>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Career Assessment</CardTitle>
            <CardDescription>
              Question {assessmentStep} of {assessmentTotalQuestions}
            </CardDescription>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(assessmentStep / assessmentTotalQuestions) * 100}%` }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-medium text-gray-900">{assessmentCurrentQuestion}</p>
            <Textarea
              value={assessmentCurrentAnswer}
              onChange={(e) => setAssessmentCurrentAnswer(e.target.value)}
              placeholder="Type your answer..."
              rows={5}
            />
            {assessmentError && <p className="text-sm text-red-600">{assessmentError}</p>}
            <div className="flex justify-end">
              <Button onClick={submitAnswer} disabled={assessmentSubmitting || !assessmentCurrentAnswer.trim()}>
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
    </div>
  );
}
