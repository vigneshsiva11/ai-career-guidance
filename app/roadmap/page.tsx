"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/lib/types";

interface RoadmapData {
  strengthProfile: string;
  careerPersona: string;
  suggestedCareerPath: string;
  roadmap: {
    beginner: string[];
    intermediate: string[];
    advanced: string[];
  };
  skillGapPreview?: Array<{ skill: string; gap: number }>;
}

export default function RoadmapPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<RoadmapData | null>(null);

  useEffect(() => {
    const init = async () => {
      const userData = localStorage.getItem("classless_user");
      if (!userData) {
        router.push("/login");
        return;
      }

      const user = JSON.parse(userData) as User;
      try {
        const response = await fetch(`/api/career-assessment?user_id=${user.id}`);
        const result = await response.json();
        if (result.success && result.data?.assessmentCompleted) {
          const existingResult = result.data?.result as RoadmapData | undefined;
          if (existingResult) setData(existingResult);
        }
      } catch (error) {
        console.error("Failed to load roadmap:", error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading roadmap...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Roadmap Not Available Yet</CardTitle>
            <CardDescription>
              Please complete assessment first.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={() => router.push("/assessment")}>Start Assessment</Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Strength Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{data.strengthProfile}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Career Persona</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{data.careerPersona}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Career</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{data.suggestedCareerPath}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Roadmap Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-3">
                <p className="font-medium text-gray-900 mb-2">Beginner</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {data.roadmap.beginner.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
              <div className="border rounded-lg p-3">
                <p className="font-medium text-gray-900 mb-2">Intermediate</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {data.roadmap.intermediate.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
              <div className="border rounded-lg p-3">
                <p className="font-medium text-gray-900 mb-2">Advanced</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {data.roadmap.advanced.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {Array.isArray(data.skillGapPreview) && data.skillGapPreview.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Skill Gap Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.skillGapPreview.map((item) => (
                  <div key={item.skill}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.skill}</span>
                      <span className="text-gray-500">{item.gap}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${Math.max(0, Math.min(100, item.gap))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
