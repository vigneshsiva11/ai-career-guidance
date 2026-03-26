"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Briefcase,
  CalendarDays,
  Cloud,
  Database,
  Boxes,
  Cpu,
  Shield,
  PlayCircle,
  GraduationCap,
  LineChart,
  Map,
  Rocket,
  Target,
  UserCircle2,
  Wrench,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useUserProfile } from "@/components/user-profile-provider";

type SkillLevel = "Beginner" | "Intermediate" | "Advanced";

type ProgressData = {
  selectedRole: string;
  hasSelectedRole: boolean;
  roleSkills: string[];
  radarSkills?: string[];
  requiredSkills?: string[];
  completedSkills?: string[];
  completedSteps?: string[];
  completedTasks?: string[];
  totalTasks?: number;
  completedTaskCount?: number;
  careerScore?: number;
  skillCoverage?: number;
  roadmapProgress?: {
    beginnerCompleted: boolean;
    intermediateCompleted: boolean;
    advancedCompleted: boolean;
  };
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
};

type LearningGuide = {
  title: string;
  description: string;
  topics: string[];
  youtubePlaylists: string[];
  advice: string[];
};

type LearningItemType = "skill" | "step";
type LearningGuideSource = "cache" | "ai" | null;

type LearningGuideCacheItem = {
  guide: LearningGuide;
  source: LearningGuideSource;
  generatedAt: string | null;
};

function levelToScore(level: SkillLevel | undefined) {
  if (level === "Advanced") return 100;
  if (level === "Intermediate") return 60;
  if (level === "Beginner") return 30;
  return 0;
}

function levelToLabel(level: string | undefined): SkillLevel {
  const normalized = String(level || "").trim().toLowerCase();
  if (normalized === "advanced") return "Advanced";
  if (normalized === "intermediate") return "Intermediate";
  return "Beginner";
}

function normalizeKey(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function matchesSkill(requiredSkill: string, completedSkills: string[]) {
  const required = normalizeKey(requiredSkill);
  return completedSkills.some((entry) => {
    const completed = normalizeKey(entry);
    return (
      completed === required ||
      completed.includes(required) ||
      required.includes(completed)
    );
  });
}

function scoreForSkill(data: ProgressData, skill: string) {
  return levelToScore(levelToLabel(data.profile.skillLevels?.[skill]));
}

function getSkillDescription(skill: string, role: string) {
  return `Build practical confidence in ${skill} to strengthen your ${role} readiness and project delivery quality.`;
}

function getStepDescription(step: string, role: string) {
  return `${step} is a high-impact milestone for progressing in your ${role} journey.`;
}

function buildFallbackNextSteps(role: string, skills: string[]) {
  const focus = skills.filter(Boolean).slice(0, 3);
  const roleLower = role.toLowerCase();

  if (roleLower.includes("frontend")) {
    return [
      "Build responsive web applications using modern UI patterns.",
      "Integrate REST APIs and handle loading/error states cleanly.",
      "Practice state management with Context API or Redux.",
      "Create 3 portfolio-ready frontend projects and deploy them.",
    ];
  }

  if (roleLower.includes("backend")) {
    return [
      "Build secure REST APIs with authentication and validation.",
      "Design database schemas and optimize common queries.",
      "Add logging, caching, and error handling for production readiness.",
      "Deploy backend services and monitor performance metrics.",
    ];
  }

  if (roleLower.includes("machine learning") || roleLower.includes("ml")) {
    return [
      "Practice end-to-end model workflows from preprocessing to evaluation.",
      "Train and compare baseline and advanced models on real datasets.",
      "Package and deploy an ML model API with monitoring.",
      "Document experiments and iterate based on measurable metrics.",
    ];
  }

  const roleSpecific = focus.length
    ? `Build practical projects focused on ${focus.join(", ")}.`
    : `Build practical projects aligned with ${role}.`;

  return [
    roleSpecific,
    "Practice consistently and review your progress every week.",
    "Document outcomes and decisions in a portfolio.",
    "Prepare interview-ready explanations for your core projects.",
  ];
}

function AnimatedMetricBar({
  label,
  value,
  delayMs = 0,
}: {
  label: string;
  value: number;
  delayMs?: number;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
          {clamped}%
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-3 rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 transition-all duration-700 ease-out"
          style={{ width: animated ? `${clamped}%` : "0%" }}
        />
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = 68;
  const stroke = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative h-44 w-44">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
        <circle cx="90" cy="90" r={radius} strokeWidth={stroke} className="fill-none stroke-slate-200" />
        <circle
          cx="90"
          cy="90"
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          className="fill-none stroke-indigo-500 transition-all duration-700 ease-out"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-sm font-medium text-slate-500">Career Score</p>
        <p className="text-4xl font-bold text-slate-900">{clamped}%</p>
      </div>
    </div>
  );
}

function SkillGlyph({ label }: { label: string }) {
  const normalized = label.toLowerCase();
  if (normalized.includes("cloud") || normalized.includes("deploy")) {
    return <Cloud className="h-4 w-4 text-indigo-600" />;
  }
  if (normalized.includes("sql") || normalized.includes("database")) {
    return <Database className="h-4 w-4 text-indigo-600" />;
  }
  if (normalized.includes("docker") || normalized.includes("kubernetes")) {
    return <Boxes className="h-4 w-4 text-indigo-600" />;
  }
  if (
    normalized.includes("ml") ||
    normalized.includes("machine") ||
    normalized.includes("algorithm") ||
    normalized.includes("ai")
  ) {
    return <Cpu className="h-4 w-4 text-indigo-600" />;
  }
  if (normalized.includes("security") || normalized.includes("auth")) {
    return <Shield className="h-4 w-4 text-indigo-600" />;
  }
  return <Wrench className="h-4 w-4 text-indigo-600" />;
}

export default function ProgressTrackerPage() {
  const router = useRouter();
  const { status: profileStatus, data: cachedProfile } = useUserProfile();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ProgressData | null>(null);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isLearningModalOpen, setIsLearningModalOpen] = useState(false);
  const [learningItemType, setLearningItemType] = useState<LearningItemType>("skill");
  const [learningItemName, setLearningItemName] = useState("");
  const [isLearningGuideLoading, setIsLearningGuideLoading] = useState(false);
  const [learningGuide, setLearningGuide] = useState<LearningGuide | null>(null);
  const [learningGuideSource, setLearningGuideSource] = useState<LearningGuideSource>(null);
  const [learningGuideGeneratedAt, setLearningGuideGeneratedAt] = useState<string | null>(null);
  const [learningLoaderText, setLearningLoaderText] = useState("Generating AI learning guide...");
  const [isRegeneratingSkillGuide, setIsRegeneratingSkillGuide] = useState(false);
  const [learningGuideCache, setLearningGuideCache] = useState<Record<string, LearningGuideCacheItem>>(
    {}
  );

  useEffect(() => {
    setMounted(true);
    const load = async () => {
      try {
        if (profileStatus === "unauthorized") {
          router.push("/auth/signin");
          return;
        }

        if (profileStatus === "loading" && !cachedProfile) {
          return;
        }

        if (cachedProfile?.progressTracker) {
          setData({
            ...cachedProfile.progressTracker,
            careerScore: cachedProfile.userProgress?.careerScore ?? cachedProfile.progressTracker.careerScore,
            skillCoverage: cachedProfile.userProgress?.skillCoverage ?? cachedProfile.progressTracker.skillCoverage,
            requiredSkills: cachedProfile.userProgress?.requiredSkills ?? cachedProfile.progressTracker.requiredSkills,
            totalTasks: cachedProfile.userProgress?.totalTasks ?? cachedProfile.progressTracker.totalTasks,
            completedTaskCount:
              cachedProfile.userProgress?.completedTaskCount ?? cachedProfile.progressTracker.completedTaskCount,
            completedSkills:
              cachedProfile.userProgress?.completedSkills ?? cachedProfile.progressTracker.completedSkills,
            completedSteps:
              cachedProfile.userProgress?.completedSteps ?? cachedProfile.progressTracker.completedSteps,
            completedTasks:
              cachedProfile.userProgress?.completedTasks ?? cachedProfile.progressTracker.completedTasks,
            roadmapProgress:
              cachedProfile.userProgress?.roadmapProgress ?? cachedProfile.progressTracker.roadmapProgress,
          });
        }

        const [trackerResponse, tasksResponse] = await Promise.all([
          fetch("/api/progress-tracker", {
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
        if (trackerResponse.status === 401) {
          router.push("/auth/signin");
          return;
        }
        const result = await trackerResponse.json();
        if (!result.success || !result.data) {
          throw new Error(result.error || "Failed to load progress tracker");
        }
        const tasksResult = await tasksResponse.json();
        setData({
          ...result.data,
          careerScore:
            cachedProfile?.userProgress?.careerScore ?? result.data.careerScore,
          skillCoverage:
            cachedProfile?.userProgress?.skillCoverage ?? result.data.skillCoverage,
          requiredSkills:
            cachedProfile?.userProgress?.requiredSkills ||
            result.data.requiredSkills ||
            result.data.roleSkills ||
            [],
          totalTasks:
            cachedProfile?.userProgress?.totalTasks ?? result.data.totalTasks,
          completedTaskCount:
            cachedProfile?.userProgress?.completedTaskCount ?? result.data.completedTaskCount,
          completedSkills:
            cachedProfile?.userProgress?.completedSkills || result.data.completedSkills || [],
          completedSteps:
            cachedProfile?.userProgress?.completedSteps || result.data.completedSteps || [],
          completedTasks:
            cachedProfile?.userProgress?.completedTasks ||
            (tasksResult.success && Array.isArray(tasksResult.data?.completedTasks)
              ? tasksResult.data.completedTasks.map(String)
              : result.data.completedTasks || result.data.completedSteps || []),
          roadmapProgress:
            cachedProfile?.userProgress?.roadmapProgress || result.data.roadmapProgress,
        });
      } catch (e) {
        console.error("Progress tracker page load error:", e);
        setError("Unable to load progress tracker right now.");
      } finally {
        if (profileStatus !== "loading") {
          setIsLoading(false);
        }
      }
    };

    const handleFocusReload = () => {
      if (document.visibilityState === "hidden") return;
      void load();
    };

    void load();
    window.addEventListener("focus", handleFocusReload);
    document.addEventListener("visibilitychange", handleFocusReload);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "tasks_sync_ts") void load();
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("focus", handleFocusReload);
      document.removeEventListener("visibilitychange", handleFocusReload);
      window.removeEventListener("storage", handleStorage);
    };
  }, [cachedProfile, profileStatus, router]);

  const openLearningModal = async (itemType: LearningItemType, itemName: string) => {
    if (!data) return;
    const cacheKey = `${itemType}:${itemName}`;
    setLearningItemType(itemType);
    setLearningItemName(itemName);
    setIsLearningModalOpen(true);
    setLearningLoaderText("Generating AI learning guide...");

    const cached = learningGuideCache[cacheKey];
    if (cached) {
      setLearningGuide(cached.guide);
      setLearningGuideSource(cached.source);
      setLearningGuideGeneratedAt(cached.generatedAt);
      return;
    }

    const loadingTimer = window.setTimeout(() => {
      setIsLearningGuideLoading(true);
    }, 250);
    setLearningGuide(null);
    setLearningGuideSource(null);
    setLearningGuideGeneratedAt(null);
    try {
      const response = await fetch("/api/progress-tracker/learning-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          itemType,
          itemName,
          selectedRole: data.selectedRole,
        }),
      });
      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to load learning guide");
      }
      const payload = result.data.guide ? result.data.guide : result.data;
      const guide: LearningGuide = {
        title: String(payload.title || itemName),
        description: String(payload.description || ""),
        topics: Array.isArray(payload.topics) ? payload.topics.map(String) : [],
        youtubePlaylists: Array.isArray(payload.youtubePlaylists)
          ? payload.youtubePlaylists.map(String)
          : [],
        advice: Array.isArray(payload.advice) ? payload.advice.map(String) : [],
      };
      setLearningGuide(guide);
      const source = (result.data.source as LearningGuideSource) || "ai";
      const generatedAt = result.data.generatedAt
        ? String(result.data.generatedAt)
        : null;
      setLearningGuideSource(source);
      setLearningGuideGeneratedAt(generatedAt);
      setLearningGuideCache((prev) => ({
        ...prev,
        [cacheKey]: { guide, source, generatedAt },
      }));
    } catch (e) {
      console.error("Learning guide load error:", e);
      toast.error("Failed to load learning guide");
    } finally {
      window.clearTimeout(loadingTimer);
      setIsLearningGuideLoading(false);
    }
  };

  const regenerateSkillGuide = async () => {
    if (!data || learningItemType !== "skill" || !learningItemName.trim()) return;
    setIsRegeneratingSkillGuide(true);
    setIsLearningGuideLoading(true);
    setLearningLoaderText("Regenerating AI learning guide...");
    try {
      const response = await fetch("/api/progress-tracker/learning-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          itemType: "skill",
          itemName: learningItemName,
          selectedRole: data.selectedRole,
        }),
      });
      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to regenerate skill guide");
      }
      const payload = result.data.guide ? result.data.guide : result.data;
      const guide: LearningGuide = {
        title: String(payload.title || learningItemName),
        description: String(payload.description || ""),
        topics: Array.isArray(payload.topics) ? payload.topics.map(String) : [],
        youtubePlaylists: Array.isArray(payload.youtubePlaylists)
          ? payload.youtubePlaylists.map(String)
          : [],
        advice: Array.isArray(payload.advice) ? payload.advice.map(String) : [],
      };
      const cacheKey = `skill:${learningItemName}`;
      const source: LearningGuideSource = "ai";
      const generatedAt = result.data.generatedAt
        ? String(result.data.generatedAt)
        : new Date().toISOString();
      setLearningGuide(guide);
      setLearningGuideSource(source);
      setLearningGuideGeneratedAt(generatedAt);
      setLearningGuideCache((prev) => ({
        ...prev,
        [cacheKey]: { guide, source, generatedAt },
      }));
      toast.success("Skill guide regenerated");
    } catch (e) {
      console.error("Skill guide regeneration failed:", e);
      toast.error("Failed to regenerate skill guide");
    } finally {
      setIsLearningGuideLoading(false);
      setIsRegeneratingSkillGuide(false);
      setLearningLoaderText("Generating AI learning guide...");
    }
  };

  const readinessScore = useMemo(() => {
    if (!data) return 0;
    if (typeof data.careerScore === "number") return data.careerScore;
    const requiredSkills =
      (data.requiredSkills || []).length > 0
        ? data.requiredSkills || []
        : (data.roleSkills || []).length > 0
        ? data.roleSkills || []
        : Object.keys(data.profile?.skillLevels || {});
    if (requiredSkills.length === 0) return 0;
    const scores = requiredSkills.map((skill) =>
      levelToScore(levelToLabel(data.profile.skillLevels?.[skill]))
    );
    const total = scores.reduce((sum: number, value: number) => sum + value, 0);
    return Math.round(total / requiredSkills.length);
  }, [data]);

  const radarData = useMemo(() => {
    if (!data) return [];
    const chosen =
      (data.requiredSkills || []).length > 0
        ? data.requiredSkills || []
        : (data.roleSkills || []).length > 0
        ? data.roleSkills || []
        : Object.keys(data.profile?.skillLevels || {});
    return chosen.map((skill) => ({
      skill,
      score: scoreForSkill(data, skill),
      fullMark: 100,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-slate-600">Loading progress tracker...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-xl rounded-2xl border border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle>Progress Tracker Unavailable</CardTitle>
            <CardDescription>{error || "Please try again."}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data.hasSelectedRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-xl rounded-2xl border border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle>No Career Role Selected</CardTitle>
            <CardDescription>Complete assessment and generate your roadmap first.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={() => router.push("/assessment")}>Select Career Role</Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const analysis = data.analysis;
  const requiredSkills =
    (data.requiredSkills || []).length > 0
      ? data.requiredSkills || []
      : (data.roleSkills || []).length > 0
      ? data.roleSkills || []
      : Object.keys(data.profile?.skillLevels || {});
  const strongSkillsComputed = requiredSkills.filter((skill) => {
    const level = levelToLabel(data.profile.skillLevels?.[skill]);
    return level === "Intermediate" || level === "Advanced";
  });
  const weakSkillsComputed = requiredSkills.filter((skill) => {
    const level = levelToLabel(data.profile.skillLevels?.[skill]);
    return level === "Beginner";
  });
  const selectedSkillSet = new Set(Object.keys(data.profile.skillLevels || {}));
  const missingSkillsComputed = requiredSkills.filter((skill) => !selectedSkillSet.has(skill));
  const requiredSkillCount = Math.max(1, requiredSkills.length);
  const strongCount = strongSkillsComputed.length;
  const coveragePercent =
    typeof data.skillCoverage === "number"
      ? Math.max(0, Math.min(100, Math.round(data.skillCoverage)))
      : Math.max(
          0,
          Math.min(
            100,
            Math.round((selectedSkillSet.size / requiredSkillCount) * 100)
          )
        );
  const communicationLevelEntry = Object.entries(data.profile.skillLevels || {}).find(
    ([skill]) => skill.toLowerCase().includes("communication")
  );
  const communicationScore = communicationLevelEntry
    ? levelToScore(levelToLabel(communicationLevelEntry[1]))
    : Math.max(25, Math.round(readinessScore * 0.75));
  const domainExpertiseMetric = readinessScore;
  const practicalExposureMetric = Math.max(15, Math.round(readinessScore * 0.85));
  const executionDisciplineMetric = Math.max(20, Math.round(readinessScore * 0.9));
  const recommendedSkillsResolved =
    (analysis?.recommendedSkills || []).length > 0
      ? (analysis?.recommendedSkills || [])
      : [...missingSkillsComputed, ...weakSkillsComputed].slice(0, 8);
  const recommendedActionsResolved =
    (analysis?.recommendedActions || []).length > 0
      ? (analysis?.recommendedActions || [])
      : buildFallbackNextSteps(data.selectedRole, recommendedSkillsResolved);

  const enterClass = mounted
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-2";

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 md:px-16 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              AI Career Progress Tracker
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Track your career growth with AI-powered skill analysis and progress insights.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="rounded-full border-slate-300 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={() => router.push("/dashboard")}
              className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              Update Career Profile
            </Button>
            <Button
              onClick={() => router.push("/roadmap")}
              className="rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <Map className="mr-2 h-4 w-4" />
              Roadmap
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8 md:px-16">
        <Card className={`rounded-2xl border border-indigo-200 bg-white shadow-xl transition-all duration-500 ${enterClass}`}>
          <CardContent className="flex flex-col items-center justify-between gap-6 p-6 md:flex-row">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
                Career Readiness Score
              </p>
              <p className="text-2xl font-bold text-slate-900">AI Readiness Snapshot</p>
              <p className="max-w-md text-sm text-slate-600">
                Based on your current skills and learning progress.
              </p>
            </div>
            <ScoreRing score={readinessScore} />
          </CardContent>
        </Card>

        <Card className={`rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-500 ${enterClass}`}>
          <CardHeader>
            <CardTitle className="text-slate-900">Career Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              {
                key: "role",
                title: "Selected Role",
                value: data.selectedRole,
                icon: <Briefcase className="h-4 w-4 text-indigo-600" />,
              },
              {
                key: "education",
                title: "Education",
                value: data.profile.educationLevel || "-",
                icon: <GraduationCap className="h-4 w-4 text-indigo-600" />,
              },
              {
                key: "field",
                title: "Field of Study",
                value: data.profile.fieldOfStudy || "-",
                icon: <UserCircle2 className="h-4 w-4 text-indigo-600" />,
              },
              {
                key: "exp",
                title: "Experience",
                value: data.profile.experienceLevel || "-",
                icon: <CalendarDays className="h-4 w-4 text-indigo-600" />,
              },
              {
                key: "goal",
                title: "Learning Goal",
                value: data.profile.learningGoal || "-",
                icon: <Target className="h-4 w-4 text-indigo-600" />,
              },
            ].map((item) => (
              <div
                key={item.key}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                  {item.icon}
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.title}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <Card className={`rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-500 ${enterClass}`}>
            <CardHeader>
              <CardTitle className="text-slate-900">Skill Gap Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">Strong Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {strongSkillsComputed.map((skill) => (
                    <span
                      key={skill}
                      title={`Skill relevant for ${data.selectedRole}.`}
                      className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 transition-transform duration-150 hover:scale-105"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">Weak Skills</h3>
                {weakSkillsComputed.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {weakSkillsComputed.map((skill) => (
                      <span
                        key={skill}
                        title={`Skill relevant for ${data.selectedRole}.`}
                        className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 transition-transform duration-150 hover:scale-105"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                      All Required Skills Covered
                    </div>
                    <p className="mt-1 text-xs text-emerald-700/90">
                      Based on your current analysis, no weak skills were detected.
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">Missing Skills</h3>
                {missingSkillsComputed.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {missingSkillsComputed.map((skill) => (
                      <span
                        key={skill}
                        title={`Skill relevant for ${data.selectedRole}.`}
                        className="rounded-full border border-rose-200 bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700 transition-transform duration-150 hover:scale-105"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                      All Required Skills Covered
                    </div>
                    <p className="mt-1 text-xs text-emerald-700/90">
                      You currently meet all core required skills for this role.
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Skill Coverage</p>
                  <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    {coveragePercent}%
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-700"
                    style={{ width: `${coveragePercent}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-500 ${enterClass}`}>
            <CardHeader>
              <CardTitle className="text-slate-900">Skill Radar Chart</CardTitle>
              <CardDescription>AI-estimated skill distribution for your role.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: "#334155", fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
                  <Radar
                    dataKey="score"
                    stroke="#4f46e5"
                    fill="#6366f1"
                    fillOpacity={0.35}
                    animationDuration={900}
                  />
                  <RechartsTooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className={`rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-500 ${enterClass}`}>
          <CardHeader>
            <CardTitle className="text-slate-900">Progress Metrics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <AnimatedMetricBar label="Domain Expertise" value={domainExpertiseMetric} delayMs={0} />
            <AnimatedMetricBar label="Practical Exposure" value={practicalExposureMetric} delayMs={120} />
            <AnimatedMetricBar label="Communication Skills" value={communicationScore} delayMs={240} />
            <AnimatedMetricBar label="Execution Discipline" value={executionDisciplineMetric} delayMs={360} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <Card className={`rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-500 ${enterClass}`}>
            <CardHeader>
              <CardTitle className="text-slate-900">Recommended Skills</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {recommendedSkillsResolved.map((skill) => (
                <div
                  key={skill}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                    <SkillGlyph label={skill} />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{skill}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                    {getSkillDescription(skill, data.selectedRole)}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 rounded-full border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    onClick={() => void openLearningModal("skill", skill)}
                  >
                    Learn More
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className={`rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-500 ${enterClass}`}>
            <CardHeader>
              <CardTitle className="text-slate-900">Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendedActionsResolved.map((step) => (
                (() => {
                  return (
                    <div
                      key={step}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="mb-2 flex items-center gap-3">
                        <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100">
                          <Rocket className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <button
                            type="button"
                            className="text-left text-sm font-semibold text-slate-800 transition-colors hover:text-indigo-700"
                            onClick={() => void openLearningModal("step", step)}
                          >
                            {step}
                          </button>
                          <p className="mt-1 text-xs text-slate-600">
                            {getStepDescription(step, data.selectedRole)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className={`rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-500 ${enterClass}`}>
          <CardHeader>
            <CardTitle className="text-slate-900">Optional Weekly Learning Snapshot</CardTitle>
            <CardDescription>Lightweight estimate based on your current readiness score.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Estimated Weekly Hours</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{Math.max(4, Math.round(readinessScore / 10))}h</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Estimated Improvement</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">+{Math.max(3, Math.round(readinessScore / 18))}%</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Momentum</p>
              <p className="mt-1 inline-flex items-center gap-1 text-2xl font-bold text-slate-900">
                <LineChart className="h-5 w-5 text-indigo-600" />
                Stable
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {isLearningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-300">
            <div className="flex items-start justify-between border-b border-slate-200 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  {learningItemType === "skill" ? "Skill Learning Guide" : "Step Completion Guide"}
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">{learningItemName}</h3>
                {learningGuideSource && (
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    AI Generated - {learningGuideSource === "cache" ? "Cached" : "Fresh"}
                    {learningGuideGeneratedAt
                      ? ` - ${new Date(learningGuideGeneratedAt).toLocaleString()}`
                      : ""}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {learningItemType === "skill" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    disabled={isRegeneratingSkillGuide}
                    onClick={() => void regenerateSkillGuide()}
                  >
                    {isRegeneratingSkillGuide ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Skills"
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setIsLearningModalOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
              {isLearningGuideLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {learningLoaderText}
                </div>
              ) : learningGuide ? (
                <>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="text-sm font-semibold text-slate-900">Skill Explanation</h4>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      {learningGuide.description}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="text-sm font-semibold text-slate-900">Learning Topics</h4>
                    <ul className="mt-2 space-y-2">
                      {learningGuide.topics.map((topic) => (
                        <li key={topic} className="flex items-start gap-2 text-sm text-slate-700">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-indigo-600" />
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="text-sm font-semibold text-slate-900">YouTube Learning Playlists</h4>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      {learningGuide.youtubePlaylists.map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group rounded-xl border border-slate-200 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                        >
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <PlayCircle className="h-4 w-4 text-red-500" />
                            <span className="line-clamp-2">Open Playlist Resource</span>
                          </div>
                          <p className="mt-1 break-all text-xs text-slate-500 group-hover:text-indigo-600">
                            {url}
                          </p>
                        </a>
                      ))}
                    </div>
                  </div>

                  {learningGuide.advice.length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <h4 className="text-sm font-semibold text-slate-900">AI Advice</h4>
                      <ul className="mt-2 space-y-2">
                        {learningGuide.advice.map((tip) => (
                          <li key={tip} className="text-sm text-slate-700">
                            - {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-600">No guide available for this item yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
