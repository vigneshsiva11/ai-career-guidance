"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/lib/types";

interface RoadmapData {
  strengthProfile: string;
  careerPersona: string;
  suggestedCareerPath: string;
  source?: string;
  roadmap: {
    beginner: string[];
    intermediate: string[];
    advanced: string[];
  };
  estimatedTimeline?: string;
  toolsToLearn?: string[];
  certifications?: string[];
  realWorldProjects?: string[];
  portfolioRequirements?: string[];
  interviewPreparationTopics?: string[];
  requiredTechnicalSkills?: string[];
  requiredSoftSkills?: string[];
  internshipStrategy?: string[];
  freelancingStrategy?: string[];
  salaryInsight?: string;
  jobPlatformsToApply?: string[];
  resumeTips?: string[];
  jobReadyChecklist?: string[];
  skillGapPreview?: Array<{ skill: string; gap: number }>;
}

export default function RoadmapPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<RoadmapData | null>(null);
  const [loadError, setLoadError] = useState<string>("");
  const [animateBars, setAnimateBars] = useState(false);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const init = async () => {
      const userData = localStorage.getItem("classless_user");
      if (!userData) {
        router.push("/login");
        return;
      }

      const user = JSON.parse(userData) as User;
      try {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 12000);
        const response = await fetch(`/api/career-assessment?user_id=${user.id}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        window.clearTimeout(timer);
        const result = await response.json();
        if (result.success && result.data?.assessmentCompleted) {
          const existingResult = result.data?.result as RoadmapData | undefined;
          if (existingResult) setData(existingResult);
        }
      } catch (error) {
        console.error("Failed to load roadmap:", error);
        setLoadError("Unable to load roadmap right now. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!data) return;
    const timer = window.setTimeout(() => setAnimateBars(true), 120);
    return () => window.clearTimeout(timer);
  }, [data]);

  useEffect(() => {
    const container = timelineRef.current;
    if (!container) return;

    const items = container.querySelectorAll<HTMLElement>("[data-timeline-item]");
    if (items.length === 0) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => {
        item.classList.add("!opacity-100", "!translate-y-0");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("!opacity-100", "!translate-y-0");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">Loading roadmap...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <Card className="w-full max-w-xl rounded-3xl border-slate-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-slate-900">Roadmap Not Available Yet</CardTitle>
            <CardDescription className="text-slate-600">
              {loadError || "Please complete assessment first."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button
              onClick={() => router.push("/assessment")}
              className="rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-300"
            >
              Start Assessment
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-slate-300 hover:bg-slate-100 transition-all duration-300"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-indigo-200 blur-3xl opacity-20" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-blue-200 blur-3xl opacity-20" />
      </div>
      <header className="bg-white/80 border-b border-slate-200 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900">Classless</h1>
            </Link>
            <Button
              variant="outline"
              className="rounded-full border-slate-300 shadow-sm hover:bg-white transition-all duration-300"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-16 space-y-16">
        <section className="rounded-3xl border border-white/40 bg-white/70 p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
          <div>
            <p className="text-sm uppercase tracking-widest text-slate-500">
              AI Career Summary
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Career Intelligence Snapshot
            </h2>
            {(data.source === "vector_retrieval" ||
              data.source === "fixed_skill_catalog") && (
              <span className="mt-3 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                Generated from Structured Career Data
              </span>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-900">Strength Profile</h3>
              <p className="text-slate-600">{data.strengthProfile}</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-900">Career Persona</h3>
              <p className="text-slate-600">{data.careerPersona}</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-slate-900">Recommended Career</h3>
              <span className="inline-flex rounded-full bg-indigo-100 px-4 py-2 font-semibold text-indigo-700 shadow-sm">
                {data.suggestedCareerPath}
              </span>
            </div>
            {data.estimatedTimeline && (
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-slate-900">Estimated Timeline</h3>
                <p className="text-slate-600">{data.estimatedTimeline}</p>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-8">
          <div>
            <p className="text-sm uppercase tracking-widest text-slate-500">
              Growth Journey
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Roadmap Timeline</h2>
          </div>

          <div ref={timelineRef} className="relative space-y-8 pl-0 sm:pl-12">
            <div className="absolute left-2.5 top-2 hidden h-[calc(100%-1rem)] w-0.5 bg-indigo-200 sm:block" />

            {[
              {
                label: "Beginner",
                labelClass: "bg-emerald-100 text-emerald-700",
                items: data.roadmap.beginner,
              },
              {
                label: "Intermediate",
                labelClass: "bg-blue-100 text-blue-700",
                items: data.roadmap.intermediate,
              },
              {
                label: "Advanced",
                labelClass: "bg-purple-100 text-purple-700",
                items: data.roadmap.advanced,
              },
            ].map((stage) => (
              <div key={stage.label} className="relative flex items-start gap-4 sm:gap-6">
                <div className="hidden sm:flex mt-2 h-5 w-5 flex-shrink-0 rounded-full bg-indigo-600 ring-4 ring-indigo-100" />
                <Card
                  data-timeline-item
                  className="w-full rounded-2xl border border-slate-200 bg-white p-2 shadow-lg opacity-0 translate-y-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <CardHeader className="pb-3">
                    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-medium ${stage.labelClass}`}>
                      {stage.label}
                    </span>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-slate-600">
                      {stage.items.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {Array.isArray(data.toolsToLearn) && data.toolsToLearn.length > 0 && (
          <section className="rounded-3xl border border-white/40 bg-white/70 p-6 sm:p-8 shadow-xl backdrop-blur-lg space-y-6">
            <div>
              <p className="text-sm uppercase tracking-widest text-slate-500">Skills Stack</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">Tools to Learn</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.toolsToLearn.map((tool) => (
                <span
                  key={tool}
                  className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700"
                >
                  {tool}
                </span>
              ))}
            </div>
          </section>
        )}

        {Array.isArray(data.certifications) && data.certifications.length > 0 && (
          <section className="rounded-3xl border border-white/40 bg-white/70 p-6 sm:p-8 shadow-xl backdrop-blur-lg space-y-6">
            <h2 className="text-3xl font-bold text-slate-900">Recommended Certifications</h2>
            <ul className="space-y-2 text-slate-600">
              {data.certifications.map((cert) => (
                <li key={cert}>- {cert}</li>
              ))}
            </ul>
          </section>
        )}

        {Array.isArray(data.requiredTechnicalSkills) &&
          data.requiredTechnicalSkills.length > 0 && (
            <section className="rounded-3xl border border-white/40 bg-white/70 p-6 sm:p-8 shadow-xl backdrop-blur-lg space-y-6">
              <h2 className="text-3xl font-bold text-slate-900">Required Technical Skills</h2>
              <ul className="space-y-2 text-slate-600">
                {data.requiredTechnicalSkills.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </section>
          )}

        {Array.isArray(data.requiredSoftSkills) && data.requiredSoftSkills.length > 0 && (
          <section className="rounded-3xl border border-white/40 bg-white/70 p-6 sm:p-8 shadow-xl backdrop-blur-lg space-y-6">
            <h2 className="text-3xl font-bold text-slate-900">Required Soft Skills</h2>
            <ul className="space-y-2 text-slate-600">
              {data.requiredSoftSkills.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </section>
        )}

        {Array.isArray(data.realWorldProjects) && data.realWorldProjects.length > 0 && (
          <section className="rounded-3xl border border-white/40 bg-white/70 p-6 sm:p-8 shadow-xl backdrop-blur-lg space-y-6">
            <h2 className="text-3xl font-bold text-slate-900">Real-World Projects</h2>
            <ul className="space-y-2 text-slate-600">
              {data.realWorldProjects.map((project) => (
                <li key={project}>- {project}</li>
              ))}
            </ul>
          </section>
        )}

        {Array.isArray(data.interviewPreparationTopics) &&
          data.interviewPreparationTopics.length > 0 && (
            <section className="rounded-3xl border border-white/40 bg-white/70 p-6 sm:p-8 shadow-xl backdrop-blur-lg space-y-6">
              <h2 className="text-3xl font-bold text-slate-900">Interview Preparation</h2>
              <ul className="space-y-2 text-slate-600">
                {data.interviewPreparationTopics.map((topic) => (
                  <li key={topic}>- {topic}</li>
                ))}
              </ul>
            </section>
          )}

        {Array.isArray(data.portfolioRequirements) &&
          data.portfolioRequirements.length > 0 && (
            <section className="rounded-3xl border border-white/40 bg-white/70 p-6 sm:p-8 shadow-xl backdrop-blur-lg space-y-6">
              <h2 className="text-3xl font-bold text-slate-900">Portfolio Requirements</h2>
              <ul className="space-y-2 text-slate-600">
                {data.portfolioRequirements.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </section>
          )}

        {Array.isArray(data.internshipStrategy) && data.internshipStrategy.length > 0 && (
          <section className="rounded-3xl border border-white/40 bg-white/70 p-6 sm:p-8 shadow-xl backdrop-blur-lg space-y-6">
            <h2 className="text-3xl font-bold text-slate-900">Internship Strategy</h2>
            <ul className="space-y-2 text-slate-600">
              {data.internshipStrategy.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </section>
        )}

        {Array.isArray(data.freelancingStrategy) &&
          data.freelancingStrategy.length > 0 && (
            <section className="rounded-3xl border border-white/40 bg-white/70 p-6 sm:p-8 shadow-xl backdrop-blur-lg space-y-6">
              <h2 className="text-3xl font-bold text-slate-900">Freelancing Strategy</h2>
              <ul className="space-y-2 text-slate-600">
                {data.freelancingStrategy.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </section>
          )}

        {Array.isArray(data.resumeTips) && data.resumeTips.length > 0 && (
          <section className="rounded-3xl border border-white/40 bg-white/70 p-6 sm:p-8 shadow-xl backdrop-blur-lg space-y-6">
            <h2 className="text-3xl font-bold text-slate-900">Resume Optimization Guide</h2>
            <ul className="space-y-2 text-slate-600">
              {data.resumeTips.map((tip) => (
                <li key={tip}>- {tip}</li>
              ))}
            </ul>
          </section>
        )}

        {Array.isArray(data.jobPlatformsToApply) &&
          data.jobPlatformsToApply.length > 0 && (
            <section className="rounded-3xl border border-white/40 bg-white/70 p-6 sm:p-8 shadow-xl backdrop-blur-lg space-y-6">
              <h2 className="text-3xl font-bold text-slate-900">Job Application Platforms</h2>
              <div className="flex flex-wrap gap-2">
                {data.jobPlatformsToApply.map((platform) => (
                  <span
                    key={platform}
                    className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </section>
          )}

        {data.salaryInsight && (
          <section className="rounded-3xl border border-white/40 bg-white/70 p-6 sm:p-8 shadow-xl backdrop-blur-lg space-y-3">
            <h2 className="text-3xl font-bold text-slate-900">Salary Insight</h2>
            <p className="text-slate-600">{data.salaryInsight}</p>
          </section>
        )}

        {Array.isArray(data.jobReadyChecklist) && data.jobReadyChecklist.length > 0 && (
          <section className="rounded-3xl border border-white/40 bg-white/70 p-6 sm:p-8 shadow-xl backdrop-blur-lg space-y-6">
            <h2 className="text-3xl font-bold text-slate-900">Job Ready Checklist</h2>
            <ul className="space-y-2 text-slate-600">
              {data.jobReadyChecklist.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {Array.isArray(data.skillGapPreview) && data.skillGapPreview.length > 0 && (
          <section className="rounded-3xl border border-white/40 bg-white/70 p-6 sm:p-8 shadow-xl backdrop-blur-lg space-y-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div>
              <p className="text-sm uppercase tracking-widest text-slate-500">
                AI Analytics
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">Skill Gap Preview</h2>
            </div>

            <div className="space-y-4">
              {data.skillGapPreview.map((item) => {
                const clamped = Math.max(0, Math.min(100, item.gap));
                return (
                  <div key={item.skill} className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium text-slate-700">{item.skill}</span>
                      <span className="text-slate-500">{item.gap}%</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-700 ease-out"
                        style={{ width: `${animateBars ? clamped : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
