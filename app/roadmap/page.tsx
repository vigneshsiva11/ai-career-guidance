"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Youtube,
  Sparkles,
  UserCircle2,
  Target,
  Clock3,
  Square,
  CircleDashed,
  Wrench,
  Award,
  LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/lib/types";
import { toast } from "sonner";

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
  requiredSkills?: {
    core: string[];
    advanced: string[];
    industry: string[];
  };
  tools?: Array<{
    name: string;
    description: string;
    youtubePlaylist: string;
  }>;
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

type StageStatus = "not-started" | "in-progress" | "completed";

interface ProfileProgressData {
  careerScore: number;
  stageProgress: {
    beginner: StageStatus;
    intermediate: StageStatus;
    advanced: StageStatus;
  };
}

const JOB_PLATFORM_LINKS: Record<string, string> = {
  linkedin: "https://www.linkedin.com/jobs/",
  indeed: "https://www.indeed.com/",
  naukri: "https://www.naukri.com/",
  wellfound: "https://wellfound.com/jobs",
  internshala: "https://internshala.com/jobs/",
  "company career pages": "https://www.google.com/search?q=company+careers",
  glassdoor: "https://www.glassdoor.com/Job/index.htm",
  monster: "https://www.monster.com/jobs/search/",
  upwork: "https://www.upwork.com/nx/jobs/search/",
  fiverr: "https://www.fiverr.com/",
};

function makeTaskId(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isTaskCompleted(task: string, completedSkills: string[]) {
  const normalizedTask = makeTaskId(task);
  return completedSkills.some((entry) => {
    const normalizedEntry = makeTaskId(entry);
    return (
      normalizedEntry === normalizedTask ||
      normalizedEntry.includes(normalizedTask) ||
      normalizedTask.includes(normalizedEntry)
    );
  });
}

export default function RoadmapPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<RoadmapData | null>(null);
  const [loadError, setLoadError] = useState<string>("");
  const [animateBars, setAnimateBars] = useState(false);
  const [completedSkills, setCompletedSkills] = useState<string[]>([]);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [togglingTaskIds, setTogglingTaskIds] = useState<Set<string>>(new Set());
  const tasksMutationVersionRef = useRef(0);
  const [profileProgress, setProfileProgress] = useState<ProfileProgressData>({
    careerScore: 0,
    stageProgress: {
      beginner: "not-started",
      intermediate: "not-started",
      advanced: "not-started",
    },
  });
  const timelineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const requestVersion = tasksMutationVersionRef.current;
        const parseJsonSafely = async (response: Response) => {
          const raw = await response.text();
          try {
            return JSON.parse(raw);
          } catch {
            throw new Error(
              `Invalid JSON response (status ${response.status}).`
            );
          }
        };

        const meResponse = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (meResponse.status === 401) {
          router.push("/auth/signin");
          return;
        }
        const meResult = await parseJsonSafely(meResponse);
        if (!meResult.success || !meResult.data) {
          router.push("/auth/signin");
          return;
        }

        const user = {
          id: meResult.data.legacyId ?? 0,
        } as User;

        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 12000);
        const [assessmentResponse, progressResponse, tasksResponse] = await Promise.all([
          fetch(`/api/career-assessment?user_id=${user.id}`, {
            signal: controller.signal,
            cache: "no-store",
          }),
          fetch("/api/user/profile-progress", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/tasks", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
        ]);
        window.clearTimeout(timer);

        const result = await assessmentResponse.json();
        if (result.success && result.data?.assessmentCompleted) {
          const existingResult = result.data?.result as RoadmapData | undefined;
          if (existingResult) setData(existingResult);
        }

        const progressResult = await progressResponse.json();
        if (progressResult.success) {
          setCompletedSkills(
            Array.isArray(progressResult.data?.completedSkills)
              ? progressResult.data.completedSkills.map(String)
              : []
          );
          setProfileProgress({
            careerScore:
              typeof progressResult.data?.careerScore === "number"
                ? progressResult.data.careerScore
                : 0,
            stageProgress: {
              beginner: (progressResult.data?.stageProgress?.beginner || "not-started") as StageStatus,
              intermediate: (progressResult.data?.stageProgress?.intermediate || "not-started") as StageStatus,
              advanced: (progressResult.data?.stageProgress?.advanced || "not-started") as StageStatus,
            },
          });
        }
        const tasksResult = await tasksResponse.json();
        if (tasksResult.success && requestVersion === tasksMutationVersionRef.current) {
          setCompletedTasks(
            Array.isArray(tasksResult.data?.completedTasks)
              ? tasksResult.data.completedTasks.map(String)
              : []
          );
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
    const refreshProgress = async () => {
      try {
        if (document.visibilityState === "hidden") return;
        const requestVersion = tasksMutationVersionRef.current;
        const [response, tasksResponse] = await Promise.all([
          fetch("/api/user/profile-progress", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/tasks", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
        ]);
        const result = await response.json();
        if (result.success) {
          setCompletedSkills(
            Array.isArray(result.data?.completedSkills)
              ? result.data.completedSkills.map(String)
              : []
          );
          setProfileProgress({
            careerScore:
              typeof result.data?.careerScore === "number" ? result.data.careerScore : 0,
            stageProgress: {
              beginner: (result.data?.stageProgress?.beginner || "not-started") as StageStatus,
              intermediate: (result.data?.stageProgress?.intermediate || "not-started") as StageStatus,
              advanced: (result.data?.stageProgress?.advanced || "not-started") as StageStatus,
            },
          });
        }
        const tasksResult = await tasksResponse.json();
        if (tasksResult.success && requestVersion === tasksMutationVersionRef.current) {
          setCompletedTasks(
            Array.isArray(tasksResult.data?.completedTasks)
              ? tasksResult.data.completedTasks.map(String)
              : []
          );
        }
      } catch (error) {
        console.error("Failed to refresh roadmap progress:", error);
      }
    };

    window.addEventListener("focus", refreshProgress);
    document.addEventListener("visibilitychange", refreshProgress);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "tasks_sync_ts") void refreshProgress();
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("focus", refreshProgress);
      document.removeEventListener("visibilitychange", refreshProgress);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

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

  const toolItems =
    Array.isArray(data.tools) && data.tools.length > 0
      ? data.tools
      : (data.toolsToLearn || []).map((name) => ({
          name,
          description: `${name} learning path`,
          youtubePlaylist: `https://www.youtube.com/results?search_query=${encodeURIComponent(
            `${name} playlist`
          )}`,
        }));

  const groupedRequiredSkills = data.requiredSkills ||
    (() => {
      const all = data.requiredTechnicalSkills || [];
      const chunk = Math.ceil(all.length / 3) || 0;
      return {
        core: all.slice(0, chunk),
        advanced: all.slice(chunk, chunk * 2),
        industry: all.slice(chunk * 2),
      };
    })();

  const toggleTask = async (taskId: string, completed: boolean) => {
    tasksMutationVersionRef.current += 1;
    const previousTasks = completedTasks;
    const nextTasks = completed
      ? Array.from(new Set([...previousTasks, taskId]))
      : previousTasks.filter((id) => id !== taskId);
    setCompletedTasks(nextTasks);
    setTogglingTaskIds((prev) => new Set(prev).add(taskId));
    try {
      const response = await fetch("/api/tasks/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-task-source": "roadmap",
        },
        credentials: "include",
        body: JSON.stringify({ taskId, completed }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Failed to update task");
      const serverTasks = Array.isArray(result.data?.completedTasks)
        ? result.data.completedTasks.map(String)
        : null;
      if (serverTasks && serverTasks.length >= 0) {
        setCompletedTasks(serverTasks);
      } else if (result.data?.taskId) {
        setCompletedTasks((prev) =>
          result.data.completed
            ? Array.from(new Set([...prev, String(result.data.taskId)]))
            : prev.filter((id) => id !== String(result.data.taskId))
        );
      }
      localStorage.setItem("tasks_sync_ts", String(Date.now()));
    } catch (error) {
      console.error("Failed to toggle roadmap task:", error);
      setCompletedTasks(previousTasks);
      toast.error("Unable to update task right now");
    } finally {
      setTogglingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const stageTaskGroups = [
    {
      key: "Beginner",
      labelClass: "bg-emerald-100 text-emerald-700",
      items: (data.roadmap.beginner || []).map((task) => ({
        id: makeTaskId(task),
        title: task,
        completed: completedTasks.includes(makeTaskId(task)),
      })),
    },
    {
      key: "Intermediate",
      labelClass: "bg-blue-100 text-blue-700",
      items: (data.roadmap.intermediate || []).map((task) => ({
        id: makeTaskId(task),
        title: task,
        completed: completedTasks.includes(makeTaskId(task)),
      })),
    },
    {
      key: "Advanced",
      labelClass: "bg-purple-100 text-purple-700",
      items: (data.roadmap.advanced || []).map((task) => ({
        id: makeTaskId(task),
        title: task,
        completed: completedTasks.includes(makeTaskId(task)),
      })),
    },
  ];

  const stageProgressMap = new Map(
    stageTaskGroups.map((group) => {
      const total = Math.max(1, group.items.length);
      const done = group.items.filter((item) => item.completed).length;
      return [group.key, Math.round((done / total) * 100)];
    })
  );
  const allRoadmapTasks = stageTaskGroups.flatMap((group) => group.items);
  const totalRoadmapTasks = Math.max(1, allRoadmapTasks.length);
  const completedRoadmapTasks = allRoadmapTasks.filter((item) => item.completed).length;
  const completionPercent = Math.round((completedRoadmapTasks / totalRoadmapTasks) * 100);

  const stageStatuses = [
    {
      key: "Beginner",
      progress: stageProgressMap.get("Beginner") || 0,
      status:
        (stageProgressMap.get("Beginner") || 0) >= 100
          ? "Completed"
          : (stageProgressMap.get("Beginner") || 0) > 0
          ? "In Progress"
          : "Not Started",
    },
    {
      key: "Intermediate",
      progress: stageProgressMap.get("Intermediate") || 0,
      status:
        (stageProgressMap.get("Intermediate") || 0) >= 100
          ? "Completed"
          : (stageProgressMap.get("Intermediate") || 0) > 0
          ? "In Progress"
          : "Not Started",
    },
    {
      key: "Advanced",
      progress: stageProgressMap.get("Advanced") || 0,
      status:
        (stageProgressMap.get("Advanced") || 0) >= 100
          ? "Completed"
          : (stageProgressMap.get("Advanced") || 0) > 0
          ? "In Progress"
          : "Not Started",
    },
  ];

  const stageStatusColor = (status: string) => {
    if (status === "Completed") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "In Progress") return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  const skillLevelBars = (() => {
    const candidates =
      (data.requiredTechnicalSkills && data.requiredTechnicalSkills.length > 0
        ? data.requiredTechnicalSkills
        : data.toolsToLearn || []
      ).slice(0, 6);

    const fallback = (data.roadmap.beginner || []).slice(0, 6);
    const skills = candidates.length > 0 ? candidates : fallback;
    const gapMap = new Map((data.skillGapPreview || []).map((item) => [item.skill, item.gap]));

    return skills.map((skill, index) => {
      if (isTaskCompleted(skill, completedSkills)) {
        return { skill, value: 100 };
      }
      const gap = gapMap.get(skill);
      const value =
        typeof gap === "number"
          ? Math.max(0, Math.min(100, Math.round(100 - gap)))
          : Math.max(25, Math.min(95, 35 + index * 10));
      return { skill, value };
    });
  })();

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-indigo-200 blur-3xl opacity-30" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-blue-200 blur-3xl opacity-25" />
      </div>
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Career Roadmap
              </h1>
              <p className="text-sm text-slate-600">
                Your personalized AI-generated learning journey.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="rounded-full border-slate-300 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                onClick={() => router.push("/dashboard")}
              >
                Back to Dashboard
              </Button>
              <Button
                className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                onClick={() => router.push("/progress-tracker")}
              >
                <LineChart className="mr-2 h-4 w-4" />
                Progress Tracker
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Roadmap Progress
              </p>
              <p className="text-sm text-slate-600">Beginner to Advanced stage completion</p>
            </div>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
              {completionPercent}%
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {stageStatuses.map((stage) => (
              <div key={stage.key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stage.key}</p>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-700"
                    style={{ width: `${animateBars ? stage.progress : 0}%` }}
                  />
                </div>
                <span
                  className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${stageStatusColor(stage.status)}`}
                >
                  {stage.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="rounded-2xl border border-indigo-200 bg-white shadow-xl xl:col-span-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <CardHeader>
              <CardTitle className="text-slate-900">Career Completion</CardTitle>
              <CardDescription>Keep learning to unlock the next stage.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <div className="relative h-36 w-36">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="48" strokeWidth="10" className="fill-none stroke-slate-200" />
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    strokeWidth="10"
                    strokeLinecap="round"
                    className="fill-none stroke-indigo-500 transition-all duration-700"
                    style={{
                      strokeDasharray: 301.59,
                      strokeDashoffset: 301.59 - (completionPercent / 100) * 301.59,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-slate-900">
                  {completionPercent}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200 bg-white shadow-lg xl:col-span-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="text-slate-900">Career Intelligence Snapshot</CardTitle>
              <CardDescription>
                Your personalized roadmap analytics generated dynamically from your selected role.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                </div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Strength Profile</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{data.strengthProfile}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                  <UserCircle2 className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Career Persona</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{data.careerPersona}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                  <Target className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Recommended Career</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{data.suggestedCareerPath}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-100">
                  <Clock3 className="h-5 w-5 text-amber-600" />
                </div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Estimated Timeline</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{data.estimatedTimeline || "N/A"}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="text-slate-900">Roadmap Timeline</CardTitle>
              <CardDescription>Progressive stage-by-stage learning path.</CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={timelineRef} className="relative space-y-6 pl-8">
                <div className="absolute left-3 top-1 h-[calc(100%-0.5rem)] w-0.5 bg-indigo-200" />

                {stageTaskGroups.map((stage) => (
                  <div key={stage.key} className="relative">
                    <div className="absolute -left-[27px] top-4 h-3 w-3 rounded-full bg-indigo-600 ring-4 ring-indigo-100" />
                    <Card
                      data-timeline-item
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-sm opacity-0 translate-y-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${stage.labelClass}`}>
                            {stage.key}
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            {stageProgressMap.get(stage.key) || 0}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-700"
                            style={{
                              width: `${animateBars ? stageProgressMap.get(stage.key) || 0 : 0}%`,
                            }}
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1.5">
                          {stage.items.map((item) => (
                            <li
                              key={item.id}
                              className={`group rounded-lg border px-2 py-2 text-sm transition-all ${
                                item.completed
                                  ? "border-emerald-200 bg-emerald-50/70"
                                  : "border-transparent bg-white/60 hover:bg-white"
                              }`}
                            >
                              <label className="flex cursor-pointer items-start gap-3">
                                <input
                                  type="checkbox"
                                  className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 accent-emerald-600 focus:ring-emerald-500"
                                  checked={item.completed}
                                  disabled={togglingTaskIds.has(item.id)}
                                  onChange={(event) => void toggleTask(item.id, event.target.checked)}
                                />
                                <div className="flex-1">
                                  <p
                                    className={
                                      item.completed
                                        ? "font-medium text-emerald-700"
                                        : "text-slate-700"
                                    }
                                  >
                                    {item.title}
                                  </p>
                                  <p className={`mt-1 text-xs ${item.completed ? "text-slate-500" : "text-slate-600"}`}>
                                    {`Track progress for ${stage.key.toLowerCase()} stage.`}
                                  </p>
                                  {item.completed && (
                                    <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                      Completed
                                    </span>
                                  )}
                                </div>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="text-slate-900">Skill Level Visualization</CardTitle>
              <CardDescription>Progress bars derived from your roadmap analytics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {skillLevelBars.map((skill) => (
                <div key={skill.skill} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{skill.skill}</span>
                    <span className="text-slate-500">{skill.value}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-200">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 transition-all duration-700"
                      style={{ width: `${animateBars ? skill.value : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {Array.isArray(toolItems) && toolItems.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-indigo-600" />
              <h2 className="text-2xl font-bold text-slate-900">Skills Stack</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {toolItems.map((tool) => (
                <a
                  key={tool.name}
                  href={tool.youtubePlaylist}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={tool.description}
                  className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <Youtube className="h-3.5 w-3.5" />
                  <span>{tool.name}</span>
                  <ExternalLink className="h-3 w-3 opacity-70" />
                </a>
              ))}
            </div>
          </section>
        )}

        {Array.isArray(data.certifications) && data.certifications.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600" />
              <h2 className="text-2xl font-bold text-slate-900">Recommended Certifications</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.certifications.map((cert) => (
                <div
                  key={cert}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{cert}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {groupedRequiredSkills &&
          (groupedRequiredSkills.core?.length > 0 ||
            groupedRequiredSkills.advanced?.length > 0 ||
            groupedRequiredSkills.industry?.length > 0) && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-center gap-2">
                <CircleDashed className="h-5 w-5 text-indigo-600" />
                <h2 className="text-2xl font-bold text-slate-900">Required Technical Skills</h2>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {[
                  { title: "Core Skills", values: groupedRequiredSkills.core || [] },
                  { title: "Advanced Skills", values: groupedRequiredSkills.advanced || [] },
                  { title: "Industry Skills", values: groupedRequiredSkills.industry || [] },
                ].map((group) => (
                  <div key={group.title} className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{group.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      {group.values.map((item) => (
                        <span
                          key={`${group.title}-${item}`}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        {Array.isArray(data.requiredSoftSkills) && data.requiredSoftSkills.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <h2 className="text-3xl font-bold text-slate-900">Required Soft Skills</h2>
            <ul className="space-y-2 text-slate-600">
              {data.requiredSoftSkills.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </section>
        )}

        {Array.isArray(data.realWorldProjects) && data.realWorldProjects.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
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
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
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
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <h2 className="text-3xl font-bold text-slate-900">Portfolio Requirements</h2>
              <ul className="space-y-2 text-slate-600">
                {data.portfolioRequirements.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </section>
          )}

        {Array.isArray(data.internshipStrategy) && data.internshipStrategy.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
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
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <h2 className="text-3xl font-bold text-slate-900">Freelancing Strategy</h2>
              <ul className="space-y-2 text-slate-600">
                {data.freelancingStrategy.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </section>
          )}

        {Array.isArray(data.resumeTips) && data.resumeTips.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
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
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <h2 className="text-3xl font-bold text-slate-900">Job Application Platforms</h2>
              <div className="flex flex-wrap gap-2">
                {data.jobPlatformsToApply.map((platform) => (
                  <a
                    key={platform}
                    href={
                      JOB_PLATFORM_LINKS[platform.trim().toLowerCase()] ||
                      `https://www.google.com/search?q=${encodeURIComponent(platform + " jobs")}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-200"
                  >
                    {platform}
                    <ExternalLink className="h-3 w-3 opacity-70" />
                  </a>
                ))}
              </div>
            </section>
          )}

        {data.salaryInsight && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <h2 className="text-3xl font-bold text-slate-900">Salary Insight</h2>
            <p className="text-slate-600">{data.salaryInsight}</p>
          </section>
        )}

        {Array.isArray(data.jobReadyChecklist) && data.jobReadyChecklist.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
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
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
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
