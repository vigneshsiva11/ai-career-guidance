"use client";

import React from "react";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Send,
  Upload,
  Mic,
  ArrowLeft,
  Camera,
  FileImage,
  Loader2,
  CheckCircle,
  AlertTriangle,
  X,
  Brain,
  Languages,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { User, Reply } from "@/lib/types";
import type { OCRResult } from "@/lib/ocr-service";
type OCRResultExtended = OCRResult & {
  detectedLanguage?: string;
  validation?: { isValid: boolean; issues: string[] };
};

export default function AskQuestionPage() {
  const [user, setUser] = useState<User | null>(null);

  const [supportedLanguages, setSupportedLanguages] = useState<
    Record<string, string>
  >({});
  const [formData, setFormData] = useState({
    question_text: "",
    question_type: "text",
    language: "en",
    response_language: "en",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageMetadata, setImageMetadata] = useState<{
    uploadId: number;
    originalName: string;
    originalSize: number;
    originalLastModified: number;
  } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResultExtended | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponses, setAiResponses] = useState<string[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showAIResponse, setShowAIResponse] = useState(false);
  const [lastAskedQuestion, setLastAskedQuestion] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedQuestionId, setSavedQuestionId] = useState<number | null>(null);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState("");
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const replyBoxRef = useRef<HTMLTextAreaElement | null>(null);
  const [followUpText, setFollowUpText] = useState("");
  const askFormRef = useRef<HTMLFormElement | null>(null);
  const followUpFormRef = useRef<HTMLFormElement | null>(null);
  const followUpSectionRef = useRef<HTMLDivElement | null>(null);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [recordingInterval, setRecordingInterval] = useState<ReturnType<
    typeof setInterval
  > | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionSource, setTranscriptionSource] = useState<string | null>(
    null
  );

  const router = useRouter();

  useEffect(() => {
    const bootstrap = async () => {
      try {
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

        const me = meResult.data;
        const normalizedUser = {
          id: me.legacyId ?? 0,
          phone_number: "",
          name: me.name,
          user_type: me.role || "student",
          preferred_language: "en",
          location: "",
          education_level: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as User;
        setUser(normalizedUser);

        // Keep backward compatibility for pages still reading localStorage user.
        localStorage.setItem("classless_user", JSON.stringify(normalizedUser));

        setFormData((prev) => ({
          ...prev,
          language: normalizedUser.preferred_language || "en",
          response_language: normalizedUser.preferred_language || "en",
        }));

        fetchSupportedLanguages();
      } catch (error) {
        console.error("Ask page auth bootstrap failed:", error);
        router.push("/auth/signin");
      }
    };

    bootstrap();
  }, [router]);

  // Monitor image changes for debugging
  useEffect(() => {
    if (selectedImage) {
      console.log(
        "Selected image changed to:",
        selectedImage.name,
        selectedImage.size,
        selectedImage.lastModified
      );
      console.log("Image is File instance:", selectedImage instanceof File);
      console.log("Image type:", selectedImage.type);
    } else {
      console.log("Selected image cleared");
    }
  }, [selectedImage]);

  // Monitor OCR result changes for debugging
  useEffect(() => {
    if (ocrResult) {
      console.log(
        "OCR result updated:",
        ocrResult.text.substring(0, 100) + "..."
      );
    } else {
      console.log("OCR result cleared");
    }
  }, [ocrResult]);

  // Cleanup recording intervals on unmount
  useEffect(() => {
    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
      }
    };
  }, [recordingInterval, mediaRecorder, isRecording]);

  // Debug: Monitor form data changes
  useEffect(() => {
    console.log("[FormData] Current state:", formData);
  }, [formData]);

  const fetchSupportedLanguages = async () => {
    try {
      const response = await fetch("/api/ocr/languages");
      const result = await response.json();
      if (result.success) {
        setSupportedLanguages(result.data);
      }
    } catch (error) {
      console.error("Error fetching languages:", error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File upload triggered", event.target.files);
    const file = event.target.files?.[0];
    if (file) {
      console.log(
        "File selected:",
        file.name,
        file.size,
        file.type,
        "Last modified:",
        file.lastModified
      );

      // Reset all OCR-related state first
      setOcrResult(null);
      setOcrProgress(0);
      setIsProcessingOCR(false);
      setImageMetadata(null); // Clear previous metadata

      // Clear the question text when uploading a new image
      setFormData((prev) => ({
        ...prev,
        question_type: "image",
        question_text: "", // Clear previous text
      }));

      // Store the original file and metadata separately
      setSelectedImage(file);
      setIsImageLoading(true);

      // Store metadata separately to avoid breaking the File object
      setImageMetadata({
        uploadId: Date.now() + Math.random(),
        originalName: file.name,
        originalSize: file.size,
        originalLastModified: file.lastModified,
      });

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
        setIsImageLoading(false);
      };
      reader.onerror = () => {
        setIsImageLoading(false);
        toast.error("Failed to load image preview");
      };
      reader.readAsDataURL(file);

      console.log(
        "Image state reset complete for new image:",
        file.name,
        "Upload ID:",
        Date.now() + Math.random()
      );
    } else {
      console.log("No file selected");
    }
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const text = followUpText.trim();
    if (!text) return;

    setIsLoading(true);
    setIsLoadingAI(true);
    setSubmitError(null);
    // Reset previous AI responses so only the latest answer is shown
    setShowAIResponse(false);
    setAiResponses([]);

    try {
      const aiResponseData = await fetch("/api/ask-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          question_text: text,
          language: formData.language,
          response_language: formData.response_language,
          question_type: "text",
        }),
      });

      const aiResult = await aiResponseData.json();
      if (aiResult.success) {
        setLastAskedQuestion(text);
        setAiResponses([aiResult.data.answer]);
        setShowAIResponse(true);
        setFollowUpText("");
      } else {
        setSubmitError(aiResult.error || "Failed to get AI response");
        toast.error(aiResult.error || "Failed to get AI response");
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      setSubmitError("Failed to get AI response. Please try again.");
      toast.error("Failed to get AI response. Please try again.");
    } finally {
      setIsLoading(false);
      setIsLoadingAI(false);
    }
  };

  const handleProcessOCR = async () => {
    if (!selectedImage) {
      toast.error("No image selected for OCR processing");
      return;
    }

    // Validate that selectedImage is a proper File object
    if (!(selectedImage instanceof File)) {
      toast.error("Invalid image file. Please upload a new image.");
      return;
    }

    // Check if image is still loading
    if (isImageLoading) {
      toast.error("Please wait for the image to finish loading");
      return;
    }

    // Check if image preview is ready
    if (!imagePreview) {
      toast.error("Image preview not ready. Please try again.");
      return;
    }

    console.log(
      "Starting OCR processing for image:",
      selectedImage.name,
      selectedImage.size
    );
    if (imageMetadata) {
      console.log("Processing image with upload ID:", imageMetadata.uploadId);
    }

    setIsProcessingOCR(true);
    setOcrProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setOcrProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    try {
      const ocrFormData = new FormData();
      ocrFormData.append("image", selectedImage);
      ocrFormData.append("language", formData.language || "en");
      ocrFormData.append("enhance", "true");

      console.log("Sending OCR request for image:", selectedImage.name);
      console.log("FormData contents:");
      for (let [key, value] of ocrFormData.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await fetch("/api/ocr/extract", {
        method: "POST",
        body: ocrFormData,
      });

      const result = await response.json();

      if (result.success) {
        console.log(
          "OCR result received:",
          result.data.text.substring(0, 100) + "..."
        );

        // Always show success message
        toast.success("Text extracted successfully!");

        setOcrResult(result.data);
        setFormData((prev) => ({
          ...prev,
          question_text: result.data.text,
          language: result.data.detectedLanguage || prev.language,
        }));
        setOcrProgress(100);
      } else {
        console.error("OCR API error:", result.error);
        toast.error(result.error || "Failed to extract text");
      }
    } catch (error) {
      console.error("OCR error:", error);
      toast.error("Failed to process image");
    } finally {
      clearInterval(progressInterval);
      setIsProcessingOCR(false);
      setTimeout(() => setOcrProgress(0), 2000);
    }
  };

  const handleRemoveImage = () => {
    console.log("Removing image and resetting all states");
    setSelectedImage(null);
    setImageMetadata(null);
    setImagePreview(null);
    setIsImageLoading(false);
    setOcrResult(null);
    setOcrProgress(0);
    setIsProcessingOCR(false);
    setFormData((prev) => ({
      ...prev,
      question_type: "text",
      question_text: "",
    }));
  };

  const forceRefreshOCR = () => {
    if (selectedImage) {
      console.log(
        "Force refreshing OCR for current image:",
        selectedImage.name
      );
      setOcrResult(null);
      setOcrProgress(0);
      setIsProcessingOCR(false);
      setFormData((prev) => ({ ...prev, question_text: "" }));
      // Process OCR again
      handleProcessOCR();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.question_text.trim()) {
      toast.error("Please enter a question");
      return;
    }

    setIsLoading(true);
    setIsLoadingAI(true);
    setSubmitError(null);
    setLastAskedQuestion(formData.question_text.trim());

    try {
      console.log("Sending request to AI service with data:", {
        question_text: formData.question_text,
        language: formData.language,
        response_language: formData.response_language,
        question_type: formData.question_type,
      });

      const aiResponseData = await fetch("/api/ask-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          question_text: formData.question_text,
          language: formData.language,
          response_language: formData.response_language,
          question_type: formData.question_type,
        }),
      });

      console.log("AI response status:", aiResponseData.status);

      const aiResult = await aiResponseData.json();
      console.log("AI response result:", aiResult);

      if (aiResult.success) {
        setAiResponses([aiResult.data.answer]);
        setShowAIResponse(true);
        toast.success("AI response generated successfully!");

        // Clear the form for next question
        setFormData((prev) => ({
          ...prev,
          question_text: "",
        }));
      } else {
        console.error("AI response error:", aiResult.error);
        setSubmitError(aiResult.error || "Failed to get AI response");
        toast.error(aiResult.error || "Failed to get AI response");
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      setSubmitError("Failed to get AI response. Please try again.");
      toast.error("Failed to get AI response. Please try again.");
    } finally {
      setIsLoading(false);
      setIsLoadingAI(false);
    }
  };

  // RAG Tutor removed

  // Inline discussion helpers
  const fetchReplies = async (questionId: number) => {
    try {
      setIsLoadingReplies(true);
      const res = await fetch(`/api/questions/${questionId}/replies`);
      const data = await res.json();
      if (data.success) setReplies(data.data as Reply[]);
    } catch (e) {
      console.error("Fetch replies error:", e);
    } finally {
      setIsLoadingReplies(false);
    }
  };

  const postReply = async (questionId: number) => {
    try {
      if (!newReply.trim() || !user) return;
      const res = await fetch(`/api/questions/${questionId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, text: newReply.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setReplies((prev) => [...prev, data.data as Reply]);
        setNewReply("");
      }
    } catch (e) {
      console.error("Post reply error:", e);
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Prefer webm/opus when available for better compatibility
      const preferredMime = MediaRecorder.isTypeSupported(
        "audio/webm;codecs=opus"
      )
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);

      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunks, { type: finalType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      const interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      setRecordingInterval(interval);

      toast.success("Recording started! Click 'Stop Recording' when done.");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error(
        "Failed to start recording. Please check microphone permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);

      // Clear timer
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }

      toast.success("Recording stopped! Audio ready for transcription.");
    }
  };

  const clearRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsRecording(false);
    setTranscriptionSource(null);

    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }

    if (mediaRecorder) {
      mediaRecorder.stop();
      setMediaRecorder(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const transcribeAudio = async () => {
    if (!audioBlob) {
      toast.error("No audio to transcribe");
      return;
    }

    try {
      setIsTranscribing(true);
      toast.info("Transcribing your audio...");

      // Create FormData to send audio file with unique timestamp
      const formDataToSend = new FormData();
      const timestamp = Date.now();
      const ext = audioBlob.type.includes("webm")
        ? "webm"
        : audioBlob.type.includes("ogg")
        ? "ogg"
        : audioBlob.type.includes("wav")
        ? "wav"
        : "webm";
      const uniqueFilename = `recording_${timestamp}.${ext}`;
      formDataToSend.append("audio", audioBlob, uniqueFilename);
      formDataToSend.append("language", formData.language);
      formDataToSend.append("timestamp", timestamp.toString());

      // Send to transcription API
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();

      if (result.success) {
        console.log("[Transcribe] Success response:", result.data);
        console.log("[Transcribe] Transcribed text:", result.data.text);

        // Update the question text with transcribed content
        setFormData((prev) => {
          const updated = {
            ...prev,
            question_text: result.data.text,
          };
          console.log("[Transcribe] Updated form data:", updated);
          return updated;
        });

        // Store transcription source for UI display
        setTranscriptionSource(result.data.source);

        const sourceMessage =
          result.data.source === "gemini-ai" ? " using Gemini AI" : "";
        toast.success(
          `Audio transcribed successfully${sourceMessage}! (${
            result.data.words
          } words, ${Math.round(result.data.confidence * 100)}% confidence)`
        );

        // Don't clear recording yet - let user see the transcribed text
        // User can manually clear when ready
      } else {
        console.error("[Transcribe] Failed response:", result);
        toast.error(result.error || "Failed to transcribe audio");
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
      toast.error("Failed to transcribe audio. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const suggestionChips = [
    "Explain this code",
    "Debug my error",
    "Help with DSA",
    "Explain this image",
    "Interview preparation",
  ];

  const handleSuggestionClick = (chip: string) => {
    setFormData((prev) => ({
      ...prev,
      question_type: chip === "Explain this image" ? "image" : "text",
      question_text: chip === "Explain this image" ? prev.question_text : chip,
    }));
    if (chip !== "Explain this image") {
      setTimeout(() => {
        const textarea = document.getElementById("question");
        if (textarea instanceof HTMLTextAreaElement) textarea.focus();
      }, 0);
    }
  };

  const handleCopyLatestResponse = async () => {
    const latest = aiResponses[aiResponses.length - 1];
    if (!latest) {
      toast.error("No response available to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(latest);
      toast.success("Response copied");
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy response");
    }
  };

  const handleRegenerateResponse = () => {
    if (!lastAskedQuestion.trim()) {
      toast.error("No previous question to regenerate");
      return;
    }
    setFollowUpText(lastAskedQuestion);
    setTimeout(() => followUpFormRef.current?.requestSubmit(), 0);
  };

  const handleAskFollowUp = () => {
    setTimeout(
      () => followUpSectionRef.current?.scrollIntoView({ behavior: "smooth" }),
      0
    );
  };

  if (!user) return null;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/70 to-blue-100/70 py-8">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute bottom-16 right-10 h-64 w-64 rounded-full bg-purple-200/30 blur-3xl" />
      </div>
      <header className="mx-auto w-full max-w-6xl rounded-3xl border border-white/50 bg-white/65 px-4 py-4 shadow-xl backdrop-blur-xl sm:px-6">
        <div className="mx-auto w-full">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-slate-300 bg-white/90 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:bg-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Ask AI Tutor
              </h1>
              <p className="text-xs text-slate-600 sm:text-sm">
                Ask questions, upload problems, or speak to get instant AI guidance.
              </p>
            </div>
            <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm">
              AI Powered
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid gap-6">
          {/* Ask Bot */}
          <div>
            <Card className="overflow-hidden rounded-3xl border border-white/50 bg-white/80 shadow-2xl backdrop-blur-md">
              <CardHeader className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-900 to-violet-900 px-7 py-8 text-white sm:px-10 sm:py-10">
                <div className="pointer-events-none absolute right-6 top-0 h-32 w-32 rounded-full bg-violet-300/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-12 left-20 h-40 w-40 rounded-full bg-indigo-300/20 blur-3xl" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent" />
                <CardTitle className="relative text-4xl font-bold tracking-tight sm:text-5xl">
                  <span className="absolute -left-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-violet-300/30 blur-xl" />
                  <Brain className="mr-3 inline-block h-8 w-8 text-violet-200 drop-shadow-[0_0_12px_rgba(167,139,250,0.9)] sm:h-10 sm:w-10" />
                  <span className="relative">Ask Anything</span>
                </CardTitle>
                <CardDescription className="relative mt-3 max-w-2xl text-base text-indigo-100/85">
                  Your AI learning assistant is ready.
                </CardDescription>
                <div className="relative mt-6 rounded-2xl border border-white/25 bg-white/10 p-4 shadow-lg backdrop-blur-md transition-all duration-300 ease-in-out hover:bg-white/15">
                  <p className="flex items-start gap-2 text-sm text-indigo-50/95">
                    <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-indigo-100" />
                    Ask coding questions, upload screenshots, or speak your question.
                  </p>
                </div>
                <div className="relative mt-4 flex flex-wrap gap-2">
                  {suggestionChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleSuggestionClick(chip)}
                      className="rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/25"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <form ref={askFormRef} onSubmit={handleSubmit} className="space-y-6">
                  {submitError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {submitError}
                    </div>
                  )}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                      <Label htmlFor="language" className="mb-2 flex items-center gap-2 text-slate-700">
                        <Languages className="h-4 w-4 text-indigo-600" />
                        Question Language
                      </Label>
                      <Select
                        value={formData.language}
                        onValueChange={(value) =>
                          setFormData({ ...formData, language: value })
                        }
                      >
                        <SelectTrigger className="rounded-xl border-slate-200 bg-white/90 shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(supportedLanguages).map(
                            ([code, name]) => (
                              <SelectItem key={code} value={code}>
                                {name}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                      <Label htmlFor="response_language" className="mb-2 flex items-center gap-2 text-slate-700">
                        <BookOpen className="h-4 w-4 text-indigo-600" />
                        Response Language
                      </Label>
                      <Select
                        value={formData.response_language}
                        onValueChange={(value) =>
                          setFormData({ ...formData, response_language: value })
                        }
                      >
                        <SelectTrigger className="rounded-xl border-slate-200 bg-white/90 shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ta">Tamil</SelectItem>
                          <SelectItem value="hi">Hindi</SelectItem>
                          <SelectItem value="bn">Bengali</SelectItem>
                          <SelectItem value="te">Telugu</SelectItem>
                          <SelectItem value="mr">Marathi</SelectItem>
                          <SelectItem value="gu">Gujarati</SelectItem>
                          <SelectItem value="kn">Kannada</SelectItem>
                          <SelectItem value="ml">Malayalam</SelectItem>
                          <SelectItem value="pa">Punjabi</SelectItem>
                          <SelectItem value="ur">Urdu</SelectItem>
                          <SelectItem value="or">Odia</SelectItem>
                          <SelectItem value="as">Assamese</SelectItem>
                          <SelectItem value="sa">Sanskrit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Question Type */}
                  <div className="space-y-2">
                    <Label className="text-slate-700">Question Type</Label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <Button
                        type="button"
                        variant={
                          formData.question_type === "text"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setFormData({ ...formData, question_type: "text" })
                        }
                        className={`h-auto justify-start rounded-2xl p-4 transition-all duration-300 ease-in-out ${
                          formData.question_type === "text"
                            ? "scale-[1.01] border-transparent bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg hover:opacity-95"
                            : "border-slate-300 bg-white text-slate-700 hover:-translate-y-0.5 hover:bg-slate-50"
                        }`}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Text
                      </Button>
                      <Button
                        type="button"
                        variant={
                          formData.question_type === "image"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setFormData({ ...formData, question_type: "image" })
                        }
                        className={`h-auto justify-start rounded-2xl p-4 transition-all duration-300 ease-in-out ${
                          formData.question_type === "image"
                            ? "scale-[1.01] border-transparent bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg hover:opacity-95"
                            : "border-slate-300 bg-white text-slate-700 hover:-translate-y-0.5 hover:bg-slate-50"
                        }`}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Image
                      </Button>
                      <Button
                        type="button"
                        variant={
                          formData.question_type === "voice"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setFormData({ ...formData, question_type: "voice" })
                        }
                        className={`h-auto justify-start rounded-2xl p-4 transition-all duration-300 ease-in-out ${
                          formData.question_type === "voice"
                            ? "scale-[1.01] border-transparent bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg hover:opacity-95"
                            : "border-slate-300 bg-white text-slate-700 hover:-translate-y-0.5 hover:bg-slate-50"
                        }`}
                      >
                        <Mic className="h-4 w-4 mr-2" />
                        Voice
                      </Button>
                    </div>
                    {formData.question_type === "image" && (
                      <p className="text-sm text-blue-600 mt-2 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Image upload enabled - use Choose File below.
                      </p>
                    )}
                  </div>

                  {/* Image Upload Section */}
                  {formData.question_type === "image" && (
                    <div className="space-y-4">
                      <Label>Upload Image</Label>

                      {!selectedImage ? (
                        <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-blue-50/60 p-8 text-center shadow-sm transition-all duration-300 hover:border-indigo-400 hover:shadow-md">
                          <div className="space-y-4">
                            <div className="flex justify-center">
                              <FileImage className="h-16 w-16 text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-lg font-medium text-slate-900 mb-2">
                                Drag and drop your image here
                              </p>
                              <p className="text-sm text-slate-600 mb-4">
                                Take a photo of handwritten notes, textbook
                                pages, or math problems, or click to upload.
                              </p>
                              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                <label
                                  htmlFor="image-upload"
                                  className="cursor-pointer"
                                >
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="cursor-pointer rounded-full border-slate-300 bg-white transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-slate-50"
                                    onClick={() => {
                                      const fileInput = document.getElementById(
                                        "image-upload"
                                      ) as HTMLInputElement;
                                      if (fileInput) {
                                        console.log(
                                          "Button clicked, triggering file input"
                                        );
                                        fileInput.click();
                                      } else {
                                        console.log("File input not found");
                                      }
                                    }}
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Choose File
                                  </Button>
                                </label>
                                <input
                                  id="image-upload"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  className="hidden"
                                  style={{
                                    position: "absolute",
                                    left: "-9999px",
                                    opacity: 0,
                                    pointerEvents: "none",
                                  }}
                                />
                              </div>
                              <p className="text-xs text-slate-500 mt-2">
                                Supports JPG, PNG, WebP (max 10MB)
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Image Preview */}
                          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <img
                              src={imagePreview || undefined}
                              alt="Question preview"
                              className="w-full max-h-96 object-contain bg-gray-50"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={handleRemoveImage}
                              className="absolute top-2 right-2"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* OCR Processing */}
                          {!ocrResult && (
                            <div className="space-y-3">
                              <div className="text-sm text-gray-600 mb-2">
                                {selectedImage && imageMetadata && (
                                  <span>
                                    {isImageLoading ? "Loading..." : "Ready:"}{" "}
                                    {imageMetadata.originalName}
                                    {imageMetadata &&
                                      ` (ID: ${imageMetadata.uploadId})`}
                                  </span>
                                )}
                              </div>
                              <Button
                                type="button"
                                onClick={handleProcessOCR}
                                disabled={isProcessingOCR || isImageLoading}
                                className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md transition-all duration-300 ease-in-out hover:shadow-lg"
                              >
                                {isProcessingOCR ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Extracting Text...
                                  </>
                                ) : isImageLoading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Loading Image...
                                  </>
                                ) : (
                                  <>
                                    <FileImage className="h-4 w-4 mr-2" />
                                    Extract Text from Image
                                  </>
                                )}
                              </Button>

                              {isProcessingOCR && (
                                <div className="space-y-2">
                                  <Progress
                                    value={ocrProgress}
                                    className="w-full"
                                  />
                                  <p className="text-sm text-gray-600 text-center">
                                    Processing image... {ocrProgress}%
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* OCR Results */}
                          {ocrResult && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                  <span className="font-medium text-green-800">
                                    {ocrResult.confidence >= 0.95
                                      ? "Text Extracted (Gemini AI)"
                                      : "Text Extracted Successfully"}
                                  </span>
                                  <Badge
                                    variant={
                                      ocrResult.confidence >= 0.95
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {Math.round(ocrResult.confidence * 100)}%
                                    confidence
                                  </Badge>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={forceRefreshOCR}
                                  className="flex items-center space-x-2"
                                >
                                  <Loader2 className="h-4 w-4" />
                                  Refresh OCR
                                </Button>
                              </div>

                              {/* Image info */}
                              {selectedImage && imageMetadata && (
                                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                  <span>
                                    Image: {imageMetadata.originalName} | Size:{" "}
                                    {(
                                      imageMetadata.originalSize / 1024
                                    ).toFixed(1)}{" "}
                                    KB
                                  </span>
                                </div>
                              )}

                              {/* Gemini AI Info Box */}
                              {ocrResult && ocrResult.confidence >= 0.95 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                  <div className="flex items-start space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                    <div>
                                      <p className="text-sm font-medium text-green-800">
                                        Gemini AI Processing
                                      </p>
                                      <p className="text-xs text-green-700 mt-1">
                                        Your image is being processed using
                                        Google's Gemini AI for superior text
                                        extraction accuracy. This provides the
                                        highest quality results with advanced
                                        language understanding.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {ocrResult.validation &&
                                !ocrResult.validation.isValid && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <div className="flex items-start space-x-2">
                                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                                      <div>
                                        <p className="text-sm font-medium text-yellow-800">
                                          Quality Issues Detected:
                                        </p>
                                        <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                                          {ocrResult.validation.issues.map(
                                            (issue, index) => (
                                              <li key={index}>• {issue}</li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                )}

                              {(ocrResult.detectedLanguage ||
                                ocrResult.language) !== formData.language && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <p className="text-sm text-blue-800">
                                    <strong>Language detected:</strong>{" "}
                                    {(() => {
                                      const lang =
                                        ocrResult.detectedLanguage ||
                                        ocrResult.language;
                                      return supportedLanguages[lang] || lang;
                                    })()}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Question Text */}
                  <div className="space-y-2">
                    <Label htmlFor="question" className="text-slate-700">
                      {formData.question_type === "image"
                        ? "Extracted Text (you can edit)"
                        : "Your Question"}
                    </Label>
                    <div className="relative rounded-3xl border border-slate-200 bg-white/90 p-2 shadow-lg">
                      <Textarea
                        id="question"
                        placeholder={
                          formData.question_type === "image"
                            ? "Text will appear here after processing the image..."
                            : formData.question_type === "voice"
                            ? "Transcribed text will appear here after recording and transcribing..."
                            : "Ask your question here..."
                        }
                        value={formData.question_text}
                        onChange={(e) => {
                          console.log(
                            "[TextArea] Value changed to:",
                            e.target.value
                          );
                          setFormData({
                            ...formData,
                            question_text: e.target.value,
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            askFormRef.current?.requestSubmit();
                          }
                        }}
                        rows={6}
                        autoFocus
                        required
                        className={`min-h-[150px] rounded-2xl border-0 bg-slate-50/70 p-5 pb-16 text-base shadow-inner focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                          formData.question_type === "voice" && transcriptionSource
                            ? "bg-green-50"
                            : ""
                        }`}
                      />
                      <div className="absolute bottom-4 left-4 flex items-center gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-9 w-9 rounded-full border-slate-300 bg-white"
                          onClick={() =>
                            setFormData({ ...formData, question_type: "image" })
                          }
                          title="Attach image"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-9 w-9 rounded-full border-slate-300 bg-white"
                          onClick={() =>
                            setFormData({ ...formData, question_type: "voice" })
                          }
                          title="Voice mode"
                        >
                          <Mic className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !formData.question_text}
                        className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg disabled:opacity-60"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {formData.question_type === "voice" &&
                      transcriptionSource && (
                        <div className="flex items-center space-x-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>Transcribed text loaded successfully</span>
                          {transcriptionSource === "gemini-ai" && (
                            <Badge
                              variant="default"
                              className="bg-green-600 text-xs"
                            >
                              Gemini AI
                            </Badge>
                          )}
                        </div>
                      )}
                  </div>

                  {/* Voice Recording (if voice type selected) */}
                  {formData.question_type === "voice" && (
                    <div className="space-y-2">
                      <Label>Voice Recording</Label>
                      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-indigo-50/50 p-6 text-center shadow-sm">
                        {!isRecording && !audioUrl ? (
                          <>
                            <Mic className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
                            <p className="text-slate-700 mb-2 font-medium">
                              Record your question
                            </p>
                            <p className="text-sm text-slate-500 mb-4">
                              Speak clearly in your preferred language
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-full border-indigo-200 bg-white/80 transition-all duration-200 hover:-translate-y-0.5"
                              onClick={startRecording}
                            >
                              <Mic className="h-4 w-4 mr-2" />
                              Start Recording
                            </Button>
                          </>
                        ) : isRecording ? (
                          <>
                            <div className="relative">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 bg-red-500/70 rounded-full animate-pulse"></div>
                              </div>
                              <Mic className="h-12 w-12 text-red-500 mx-auto mb-4 relative z-10" />
                            </div>
                            <p className="text-red-600 mb-2 font-medium">
                              Listening...
                            </p>
                            <p className="text-2xl font-mono text-red-600 mb-4">
                              {formatTime(recordingTime)}
                            </p>
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={stopRecording}
                            >
                              <Mic className="h-4 w-4 mr-2" />
                              Stop Recording
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="space-y-4">
                              <audio controls className="w-full">
                                <source
                                  src={audioUrl || undefined}
                                  type={audioBlob?.type || "audio/webm"}
                                />
                                Your browser does not support the audio element.
                              </audio>

                              {/* Transcribed Text Preview */}
                              {formData.question_text &&
                                formData.question_type === "voice" && (
                                  <div
                                    className={`${
                                      transcriptionSource === "gemini-ai"
                                        ? "bg-green-50 border-green-200"
                                        : "bg-blue-50 border-blue-200"
                                    } border rounded-lg p-3`}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <p
                                        className={`text-sm font-medium ${
                                          transcriptionSource === "gemini-ai"
                                            ? "text-green-800"
                                            : "text-blue-800"
                                        }`}
                                      >
                                        Transcribed Text:
                                      </p>
                                      {transcriptionSource === "gemini-ai" && (
                                        <Badge
                                          variant="default"
                                          className="bg-green-600"
                                        >
                                          Gemini AI
                                        </Badge>
                                      )}
                                    </div>
                                    <p
                                      className={`text-sm ${
                                        transcriptionSource === "gemini-ai"
                                          ? "text-green-700"
                                          : "text-blue-700"
                                      }`}
                                    >
                                      {formData.question_text}
                                    </p>
                                  </div>
                                )}

                              <div className="flex space-x-2 justify-center">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={startRecording}
                                >
                                  <Mic className="h-4 w-4 mr-2" />
                                  Record Again
                                </Button>
                                <Button
                                  type="button"
                                  variant="default"
                                  onClick={transcribeAudio}
                                  disabled={isTranscribing}
                                >
                                  {isTranscribing ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Transcribing...
                                    </>
                                  ) : (
                                    <>
                                      <Brain className="h-4 w-4" />
                                      Transcribe
                                    </>
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={clearRecording}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Clear
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Submit Section */}
                  <div className="flex items-center justify-between pt-2">
                    <Link href="/dashboard">
                      <Button type="button" variant="ghost" className="rounded-full text-slate-600 hover:bg-slate-100">
                        Cancel
                      </Button>
                    </Link>
                    <Button
                      type="submit"
                      disabled={isLoading || !formData.question_text}
                      className="rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-7 py-6 text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl disabled:opacity-60"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Asking...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Ask AI
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-3xl border border-slate-200/80 bg-white/85 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">What you can ask</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  "Coding help",
                  "Debug errors",
                  "Explain screenshots",
                  "Interview preparation",
                  "Algorithm guidance",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSuggestionClick(item)}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Response Display - supports multiple answers */}
          {showAIResponse && aiResponses.length > 0 && (
            <Card className="mt-6 rounded-3xl border border-slate-200 bg-white/85 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <span>AI Conversation</span>
                </CardTitle>
                <CardDescription>
                  Continue learning with follow-up questions below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {lastAskedQuestion && (
                    <div className="ml-auto max-w-[90%] rounded-2xl bg-slate-100 p-4 text-sm text-slate-700 sm:max-w-[80%]">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">You</p>
                      <p className="whitespace-pre-wrap">{lastAskedQuestion}</p>
                    </div>
                  )}
                  {aiResponses.map((resp, idx) => (
                    <div
                      key={idx}
                      className="mr-auto max-w-[95%] rounded-2xl border border-indigo-100 bg-white p-4 shadow-md whitespace-pre-wrap leading-relaxed text-slate-700 sm:max-w-[85%]"
                    >
                      <div className="mb-2 inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">AI Assistant</div>
                      {resp}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyLatestResponse}>
                    Copy response
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRegenerateResponse}>
                    Regenerate answer
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleAskFollowUp}>
                    Ask follow-up
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAIResponse(false)}
                    size="sm"
                  >
                    Hide Responses
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Loading State */}
          {isLoadingAI && (
            <Card className="mt-6 rounded-3xl border border-slate-200 bg-white/80 shadow-lg">
              <CardContent className="py-8">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex items-center justify-center gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.2s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.1s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500" />
                  </div>
                  <p className="text-slate-700">AI is thinking...</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Generating a helpful response for you
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Follow-up Question Box */}
          {showAIResponse && (
            <Card
              ref={followUpSectionRef}
              className="mt-6 rounded-3xl border border-slate-200 bg-white/85 shadow-lg"
            >
              <CardHeader>
                <CardTitle>Ask a follow-up</CardTitle>
                <CardDescription className="text-slate-600">
                  Continue the conversation with your AI tutor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form ref={followUpFormRef} onSubmit={handleFollowUpSubmit}>
                  <div className="relative">
                    <Textarea
                    placeholder="Ask Follow-up"
                    value={followUpText}
                    onChange={(e) => setFollowUpText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
                      }
                    }}
                    className="rounded-2xl border-0 bg-slate-100/80 p-4 pr-14 shadow-inner focus-visible:ring-2 focus-visible:ring-indigo-400"
                    rows={3}
                  />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={isLoading || !followUpText.trim()}
                      className="absolute bottom-3 right-3 h-9 w-9 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
        {/* OCR Demo Link removed */}
      </div>
    </div>
  );
}
