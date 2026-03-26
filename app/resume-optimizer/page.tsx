"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronRight,
  FileText,
  FileSearch,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useUserProfile } from "@/components/user-profile-provider";

type ResumeAnalysis = {
  matchedSkills: string[];
  weakSkills: string[];
  missingSkills: string[];
  jobSuggestions: Array<{
    jobTitle: string;
    description: string;
    linkedInUrl: string;
    requiredSkills: string[];
    missingSkills: string[];
  }>;
  suggestions: string[];
  selectedRole: string;
  relevantSkills: string[];
  skillImprovementPlan: string[];
  resumeFileName?: string;
  createdAt: string;
};

type ResumeApiResponse = {
  selectedRole: string;
  roleSkills: string[];
  analysis: ResumeAnalysis | null;
};

type ResumeViewStatus = "idle" | "uploading" | "analyzing" | "completed" | "error";

const LAST_RESUME_NAME_STORAGE_KEY = "classless:lastResumeFileName";

function readStoredResumeFileName() {
  if (typeof window === "undefined") return "";

  try {
    return window.localStorage.getItem(LAST_RESUME_NAME_STORAGE_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

function persistResumeFileName(fileName: string) {
  if (typeof window === "undefined") return;

  const normalized = fileName.trim();
  if (!normalized) return;

  try {
    window.localStorage.setItem(LAST_RESUME_NAME_STORAGE_KEY, normalized);
  } catch {
    // Ignore storage failures and keep the in-memory UI state usable.
  }
}

function normalizeAnalysisPayload(raw: any): ResumeAnalysis | null {
  if (!raw || typeof raw !== "object") return null;

  const legacyJobMatches = Array.isArray(raw.jobMatches) ? raw.jobMatches : [];
  const normalizedJobSuggestions = Array.isArray(raw.jobSuggestions)
    ? raw.jobSuggestions
    : legacyJobMatches.map((job: any) => ({
        jobTitle: String(job?.jobTitle || ""),
        description: "",
        linkedInUrl: "",
        requiredSkills: [],
        missingSkills: Array.isArray(job?.missingSkills) ? job.missingSkills.map(String) : [],
      }));

  return {
    matchedSkills: Array.isArray(raw.matchedSkills) ? raw.matchedSkills.map(String) : [],
    weakSkills: Array.isArray(raw.weakSkills) ? raw.weakSkills.map(String) : [],
    missingSkills: Array.isArray(raw.missingSkills) ? raw.missingSkills.map(String) : [],
    jobSuggestions: normalizedJobSuggestions.map((job: any) => ({
      jobTitle: String(job?.jobTitle || ""),
      description: String(job?.description || ""),
      linkedInUrl: String(job?.linkedInUrl || ""),
      requiredSkills: Array.isArray(job?.requiredSkills) ? job.requiredSkills.map(String) : [],
      missingSkills: Array.isArray(job?.missingSkills) ? job.missingSkills.map(String) : [],
    })),
    suggestions: Array.isArray(raw.suggestions) ? raw.suggestions.map(String) : [],
    selectedRole: String(raw.selectedRole || ""),
    relevantSkills: Array.isArray(raw.relevantSkills) ? raw.relevantSkills.map(String) : [],
    skillImprovementPlan: Array.isArray(raw.skillImprovementPlan)
      ? raw.skillImprovementPlan.map(String)
      : [],
    resumeFileName: String(raw.resumeFileName || ""),
    createdAt: String(raw.createdAt || ""),
  };
}

async function parseJsonSafely(response: Response) {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    const snippet = raw.slice(0, 160).replace(/\s+/g, " ").trim();
    throw new Error(
      snippet
        ? `Server returned invalid response (${response.status}): ${snippet}`
        : `Server returned invalid response (${response.status}).`
    );
  }
}

function SkillChip({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "yellow" | "red" | "indigo" | "slate";
}) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    yellow: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-rose-200 bg-rose-50 text-rose-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  } as const;

  const dotColor = {
    green: "bg-emerald-500",
    yellow: "bg-amber-500",
    red: "bg-rose-500",
    indigo: "bg-indigo-500",
    slate: "bg-slate-400",
  } as const;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium shadow-sm ${tones[tone]}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotColor[tone]}`} />
      {label}
    </span>
  );
}

function buildJobFitSummary(job: ResumeAnalysis["jobSuggestions"][number]) {
  if (job.missingSkills.length === 0) {
    return "Your current resume already covers the key mapped skills for this role.";
  }

  if (job.missingSkills.length <= 2) {
    return "You are close to this role. Strengthening the remaining gaps could make the resume more competitive.";
  }

  return "This role is relevant, but your resume needs stronger evidence across several core skills.";
}

export default function ResumeOptimizerPage() {
  const { status: profileStatus, data: cachedProfile } = useUserProfile();
  const [data, setData] = useState<ResumeApiResponse | null>(null);
  const [pageError, setPageError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [status, setStatus] = useState<ResumeViewStatus>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [storedResumeFileName, setStoredResumeFileName] = useState("");
  const uploadSectionRef = useRef<HTMLDivElement | null>(null);
  const hasShownExistingResumeToastRef = useRef(false);

  const analysis = data?.analysis || null;
  const isProcessing = status === "uploading" || status === "analyzing";
  const savedResumeLabel =
    analysis?.resumeFileName?.trim() ||
    storedResumeFileName ||
    "Previously uploaded resume";

  const uploadHint = useMemo(() => {
    if (selectedFile) {
      return `${selectedFile.name} - ${Math.max(1, Math.round(selectedFile.size / 1024))} KB`;
    }

    if (analysis) {
      return `Uploaded resume: ${savedResumeLabel}`;
    }

    return "Supported formats: PDF, DOCX, TXT";
  }, [analysis, savedResumeLabel, selectedFile]);

  const loadPage = async () => {
    try {
      setIsBootstrapping(true);
      setPageError("");

      const response = await fetch(`/api/resume/latest?_ts=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const result = await parseJsonSafely(response);
      if (!result.success) {
        throw new Error(result.error || "Failed to load resume optimizer");
      }

      const normalizedAnalysis = normalizeAnalysisPayload(result.data?.analysis);
      const resolvedStoredName = readStoredResumeFileName();
      if (normalizedAnalysis && !normalizedAnalysis.resumeFileName && resolvedStoredName) {
        normalizedAnalysis.resumeFileName = resolvedStoredName;
      }

      setData({
        selectedRole: String(result.data?.selectedRole || ""),
        roleSkills: Array.isArray(result.data?.roleSkills) ? result.data.roleSkills.map(String) : [],
        analysis: normalizedAnalysis,
      });
      if (result.data?.analysis && !hasShownExistingResumeToastRef.current) {
        hasShownExistingResumeToastRef.current = true;
        const fileName =
          String(result.data?.analysis?.resumeFileName || "").trim() || resolvedStoredName;
        toast.info(
          fileName
            ? `Your last uploaded resume "${fileName}" is already available and ready to review.`
            : "Your last uploaded resume analysis is ready to review.",
        );
      }
      setStatus(result.data?.analysis ? "completed" : "idle");
    } catch (error) {
      console.error("Resume optimizer load failed:", error);
      setPageError(error instanceof Error ? error.message : "Failed to load resume optimizer");
      setStatus("error");
    } finally {
      setIsBootstrapping(false);
    }
  };

  useEffect(() => {
    setStoredResumeFileName(readStoredResumeFileName());
    loadPage();
  }, []);

  useEffect(() => {
    if (cachedProfile?.selectedRole) {
      setData((current) => {
        if (current?.selectedRole === cachedProfile.selectedRole) return current;
        return {
          selectedRole: current?.selectedRole || cachedProfile.selectedRole,
          roleSkills: current?.roleSkills || cachedProfile.progressTracker.roleSkills || [],
          analysis: current?.analysis || null,
        };
      });
    }
  }, [cachedProfile]);

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please choose a resume file before starting the analysis.");
      return;
    }

    if (selectedFile.size === 0) {
      setUploadError("The selected file is empty. Please upload a valid resume.");
      return;
    }

    try {
      setStatus("uploading");
      setUploadError("");
      toast.info("Your resume is uploading. Analysis will start in a moment.");
      const formData = new FormData();
      formData.append("resume", selectedFile);

      const responsePromise = fetch("/api/resume/analyze", {
        method: "POST",
        body: formData,
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });
      setStatus("analyzing");
      const response = await responsePromise;

      const result = await parseJsonSafely(response);
      if (!result.success) {
        throw new Error(result.error || "Failed to analyze resume");
      }

      setData({
        selectedRole: result.data.selectedRole,
        roleSkills: result.data.roleSkills,
        analysis: (() => {
          const normalizedAnalysis = normalizeAnalysisPayload(result.data.analysis);
          if (!normalizedAnalysis) return null;

          const resolvedFileName =
            normalizedAnalysis.resumeFileName?.trim() ||
            selectedFile?.name?.trim() ||
            storedResumeFileName;

          if (resolvedFileName) {
            normalizedAnalysis.resumeFileName = resolvedFileName;
            persistResumeFileName(resolvedFileName);
            setStoredResumeFileName(resolvedFileName);
          }

          return normalizedAnalysis;
        })(),
      });
      toast.success(`Your resume was uploaded and analyzed successfully.`);
      setSelectedFile(null);
      setStatus("completed");
    } catch (error) {
      console.error("Resume upload failed:", error);
      setUploadError(error instanceof Error ? error.message : "Failed to analyze resume");
      toast.error(error instanceof Error ? error.message : "Failed to analyze resume");
      setStatus("error");
    } finally {
    }
  };

  const roleLabel =
    data?.selectedRole ||
    cachedProfile?.selectedRole ||
    (profileStatus === "loading" ? "Loading profile..." : "No career path selected yet");

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Resume Optimization
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Improve your resume using AI-powered insights, identify skill gaps, and discover matched job opportunities.
            </p>
          </div>
        </div>

        <div ref={uploadSectionRef} className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-slate-900">Upload Resume</CardTitle>
              <CardDescription>
                Drag and drop your resume file or click to browse. We&apos;ll analyze it using AI and map the results to your current career path.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <label
                className={`group flex cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed px-6 py-12 text-center transition-all ${
                  isDragActive
                    ? "border-indigo-500 bg-indigo-50 shadow-[0_0_0_6px_rgba(99,102,241,0.08)]"
                    : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/70"
                }`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragActive(true);
                }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragActive(false);
                  const file = event.dataTransfer.files?.[0] || null;
                  setSelectedFile(file);
                }}
              >
                {selectedFile ? (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white transition-transform group-hover:scale-105">
                      <FileText className="h-8 w-8" />
                    </div>
                    <div className="mt-5 space-y-2">
                      <p className="text-xl font-semibold text-slate-900">{selectedFile.name}</p>
                      <p className="text-sm text-slate-600">
                        Ready to analyze this newly selected resume
                      </p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Click to replace with another file
                      </p>
                    </div>
                  </>
                ) : analysis ? (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white transition-transform group-hover:scale-105">
                      <FileText className="h-8 w-8" />
                    </div>
                    <div className="mt-5 space-y-2">
                      <p className="text-xl font-semibold text-slate-900">{savedResumeLabel}</p>
                      <p className="text-sm text-slate-600">
                        This is the last resume you uploaded and analyzed
                      </p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Click to upload a newer version
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white transition-transform group-hover:scale-105">
                      <UploadCloud className="h-8 w-8" />
                    </div>
                    <div className="mt-5 space-y-2">
                      <p className="text-xl font-semibold text-slate-900">Drag and drop your resume file</p>
                      <p className="text-sm text-slate-600">or click to browse</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        PDF, DOCX, TXT
                      </p>
                    </div>
                  </>
                )}
                <Input
                  type="file"
                  accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {uploadHint}
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={isProcessing}
                  className="h-11 rounded-xl bg-indigo-600 px-6 text-white shadow-sm transition hover:bg-indigo-500"
                >
                  {status === "uploading" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading Resume...
                    </>
                  ) : status === "analyzing" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing resume using AI...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Analyze Resume
                    </>
                  )}
                </Button>
              </div>

              {uploadError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {uploadError}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-slate-900">Current Role</CardTitle>
                <CardDescription>
                  Resume analysis will use your selected career path.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                  {roleLabel}
                </div>
                {analysis?.resumeFileName ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Last uploaded resume: <span className="font-medium text-slate-900">{analysis.resumeFileName}</span>
                  </div>
                ) : null}
                {analysis?.relevantSkills?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {analysis.relevantSkills.slice(0, 5).map((skill) => (
                      <SkillChip key={skill} label={skill} tone="indigo" />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Select a role through your dashboard flow to unlock deeper AI recommendations.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {isBootstrapping ? (
          <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <CardContent className="flex items-center gap-3 py-10 text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              Checking for an existing resume analysis...
            </CardContent>
          </Card>
        ) : pageError ? (
          <Card className="rounded-3xl border border-rose-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">Unable to load Resume Optimization</CardTitle>
              <CardDescription>
                The page design is available, but the analysis service returned an error.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {pageError}
              </div>
              <Button variant="outline" onClick={loadPage} className="rounded-xl">
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : analysis ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Missing Skills</CardTitle>
                <CardDescription>
                  Only skills relevant to your selected role are included in this analysis.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">
                    <ChevronRight className="h-4 w-4" />
                    Missing Skills
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missingSkills.length > 0 ? (
                      analysis.missingSkills.map((skill) => (
                        <SkillChip key={skill} label={skill} tone="red" />
                      ))
                    ) : (
                      <SkillChip label="No missing skills detected" tone="slate" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Improvement Suggestions</CardTitle>
                <CardDescription>
                  Suggested updates to make your resume clearer and more role-aligned.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-slate-700">
                {analysis.suggestions.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <span>{item}</span>
                  </li>
                ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Matched Jobs</CardTitle>
                <CardDescription>
                  Role-aligned job suggestions with LinkedIn search links.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                {analysis.jobSuggestions.map((job) => (
                  <div
                    key={job.jobTitle}
                    className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-bold leading-tight text-slate-900">{job.jobTitle}</h3>
                        <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">{job.description}</p>
                      </div>
                      <a
                        href={job.linkedInUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
                      >
                        View Jobs
                      </a>
                    </div>

                    <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Why This Role Fits
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {buildJobFitSummary(job)}
                      </p>
                    </div>

                    <div className="mt-6">
                      <p className="text-sm font-semibold text-slate-800">Skills required</p>
                      <div className="mt-3 flex flex-wrap gap-2.5">
                        {job.requiredSkills.map((skill) => (
                          <SkillChip key={`${job.jobTitle}-${skill}-required`} label={skill} tone="indigo" />
                        ))}
                      </div>
                    </div>

                    <div className="mt-6">
                      <p className="text-sm font-semibold text-slate-800">Missing skills</p>
                      <div className="mt-3 flex flex-wrap gap-2.5">
                        {job.missingSkills.length > 0 ? (
                          job.missingSkills.map((skill) => (
                            <SkillChip key={`${job.jobTitle}-${skill}`} label={skill} tone="red" />
                          ))
                        ) : (
                          <SkillChip label="No missing mapped skills" tone="green" />
                        )}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Search Source
                        </p>
                        <p className="mt-2 text-sm text-slate-700">LinkedIn role search</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Role Focus
                        </p>
                        <p className="mt-2 text-sm text-slate-700">{roleLabel}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Skill Improvement Plan</CardTitle>
                <CardDescription>
                  Focused next steps based on your selected career role.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {analysis.skillImprovementPlan.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <Bot className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <CardContent className="grid gap-8 p-8 md:grid-cols-[0.7fr_1.3fr] md:p-10">
              <div className="flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-700">
                  <FileSearch className="h-9 w-9" />
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">No resume uploaded yet.</h3>
                  <p className="mt-2 text-slate-600">
                    Upload your resume to get:
                  </p>
                </div>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    skill gap analysis
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    role-specific improvement suggestions
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    job matching suggestions
                  </li>
                </ul>
                {uploadError && status === "error" ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {uploadError}
                  </div>
                ) : null}
                <div>
                  <Button
                    onClick={() => uploadSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className="rounded-xl bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-500"
                  >
                    Upload Resume
                  </Button>
                </div>
                <p className="text-sm text-slate-500">
                  No scores, suggestions, or matched jobs will appear until a real Gemini-powered resume analysis is available.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
