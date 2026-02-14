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
  const [savedQuestionId, setSavedQuestionId] = useState<number | null>(null);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState("");
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const replyBoxRef = useRef<HTMLTextAreaElement | null>(null);
  const [followUpText, setFollowUpText] = useState("");

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
    // Check if user is logged in
    const userData = localStorage.getItem("classless_user");
    if (!userData) {
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setFormData((prev) => ({
      ...prev,
      language: parsedUser.preferred_language || "en",
      response_language: parsedUser.preferred_language || "en",
    }));

    // Fetch supported languages
    fetchSupportedLanguages();

    // Debug: Check if file input exists
    setTimeout(() => {
      const fileInput = document.getElementById(
        "image-upload"
      ) as HTMLInputElement;
      if (fileInput) {
        console.log("File input found:", fileInput);
        console.log("File input type:", fileInput.type);
        console.log("File input accept:", fileInput.accept);
        console.log("File input display style:", fileInput.style.display);
        console.log("File input className:", fileInput.className);
      } else {
        console.log("File input not found");
      }
    }, 1000);
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
    // Reset previous AI responses so only the latest answer is shown
    setShowAIResponse(false);
    setAiResponses([]);

    try {
      const aiResponseData = await fetch("/api/ai/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question_text: text,
          language: formData.language,
          response_language: formData.response_language,
          question_type: "text",
        }),
      });

      const aiResult = await aiResponseData.json();
      if (aiResult.success) {
        setAiResponses([aiResult.data.answer]);
        setShowAIResponse(true);
        setFollowUpText("");
      } else {
        toast.error(aiResult.error || "Failed to get AI response");
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
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

    try {
      console.log("Sending request to AI service with data:", {
        question_text: formData.question_text,
        language: formData.language,
        response_language: formData.response_language,
        question_type: formData.question_type,
      });

      // Get AI response directly
      const aiResponseData = await fetch("/api/ai/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

        // Save question to history for dashboard recent questions
        try {
          const stored = localStorage.getItem("classless_user");
          const parsedUser = stored ? (JSON.parse(stored) as User) : null;
          if (parsedUser?.id) {
            const saveRes = await fetch("/api/questions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: parsedUser.id,
                subject_id: 1, // Default subject; adjust if subject selection is added
                question_text: formData.question_text,
                question_type: formData.question_type,
                language: formData.language,
              }),
            });
            const saveJson = await saveRes.json();
            if (saveJson?.success && saveJson?.data?.id) {
              setSavedQuestionId(saveJson.data.id);
              setShowDiscussion(true);
              await fetchReplies(saveJson.data.id);
            }
          }
        } catch (saveErr) {
          console.error("[Ask] Failed to save question history:", saveErr);
        }

        // Clear the form for next question
        setFormData((prev) => ({
          ...prev,
          question_text: "",
        }));
      } else {
        console.error("AI response error:", aiResult.error);
        toast.error(aiResult.error || "Failed to get AI response");
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Ask a Question
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Ask Bot */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>What would you like to learn?</CardTitle>
                <CardDescription>
                  Ask any question by typing, uploading an image, or recording
                  audio. Our AI tutor supports multiple languages.
                </CardDescription>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>📸 To upload an image:</strong> First click the
                    "Image/Photo" button above, then use the "Choose File"
                    button or the file input below.
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Language Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="language">Question Language</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) =>
                        setFormData({ ...formData, language: value })
                      }
                    >
                      <SelectTrigger>
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

                  {/* Response Language Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="response_language">Response Language</Label>
                    <Select
                      value={formData.response_language}
                      onValueChange={(value) =>
                        setFormData({ ...formData, response_language: value })
                      }
                    >
                      <SelectTrigger>
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

                  {/* Question Type */}
                  <div className="space-y-2">
                    <Label>Question Type</Label>
                    <div className="flex flex-wrap gap-2">
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
                      >
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
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Image/Photo
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
                      >
                        <Mic className="h-4 w-4 mr-2" />
                        Voice
                      </Button>
                    </div>
                    {formData.question_type === "image" && (
                      <p className="text-sm text-blue-600 mt-2 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Image upload enabled - Click "Choose File" below to
                        select an image
                      </p>
                    )}
                  </div>

                  {/* Image Upload Section */}
                  {formData.question_type === "image" && (
                    <div className="space-y-4">
                      <Label>Upload Image</Label>

                      {!selectedImage ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                          <div className="space-y-4">
                            <div className="flex justify-center">
                              <FileImage className="h-16 w-16 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-lg font-medium text-gray-900 mb-2">
                                Upload your question image
                              </p>
                              <p className="text-sm text-gray-600 mb-4">
                                Take a photo of handwritten notes, textbook
                                pages, or math problems
                              </p>
                              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                <label
                                  htmlFor="image-upload"
                                  className="cursor-pointer"
                                >
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="cursor-pointer bg-transparent"
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
                              <p className="text-xs text-gray-500 mt-2">
                                Supports JPG, PNG, WebP (max 10MB)
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Image Preview */}
                          <div className="relative border rounded-lg overflow-hidden">
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
                                className="w-full"
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
                    <Label htmlFor="question">
                      {formData.question_type === "image"
                        ? "Extracted Text (you can edit)"
                        : "Your Question"}
                    </Label>
                    <Textarea
                      id="question"
                      placeholder={
                        formData.question_type === "image"
                          ? "Text will appear here after processing the image..."
                          : formData.question_type === "voice"
                          ? "Transcribed text will appear here after recording and transcribing..."
                          : "Type your question here... Be as specific as possible for better answers."
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
                      rows={6}
                      required
                      className={
                        formData.question_type === "voice" &&
                        transcriptionSource
                          ? "border-green-500 bg-green-50"
                          : ""
                      }
                    />
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
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        {!isRecording && !audioUrl ? (
                          <>
                            <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-2">
                              Record your question
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                              Speak clearly in your preferred language
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              className="bg-transparent"
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
                                <div className="w-16 h-16 bg-red-500 rounded-full animate-pulse"></div>
                              </div>
                              <Mic className="h-12 w-12 text-red-500 mx-auto mb-4 relative z-10" />
                            </div>
                            <p className="text-red-600 mb-2 font-medium">
                              Recording...
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

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4">
                    <Link href="/dashboard">
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </Link>
                    <Button
                      type="submit"
                      disabled={isLoading || !formData.question_text}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Question
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* AI Response Display - supports multiple answers */}
          {showAIResponse && aiResponses.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <span>AI Responses</span>
                </CardTitle>
                <CardDescription>
                  Follow-up questions will be answered below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none space-y-4 max-h-80 overflow-y-auto pr-2">
                  {aiResponses.map((resp, idx) => (
                    <div
                      key={idx}
                      className="whitespace-pre-wrap text-gray-700 leading-relaxed"
                    >
                      {resp}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-end">
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
            <Card className="mt-6">
              <CardContent className="py-8">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Getting AI response...</p>
                  <p className="text-sm text-gray-500 mt-2">
                    This may take a few seconds
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Follow-up Question Box */}
          {showAIResponse && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Ask a follow-up</CardTitle>
                <CardDescription>
                  Continue the conversation with the AI tutor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFollowUpSubmit} className="space-y-3">
                  <Textarea
                    placeholder="Type your follow-up question..."
                    value={followUpText}
                    onChange={(e) => setFollowUpText(e.target.value)}
                    rows={4}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isLoading || !followUpText.trim()}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Asking...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Ask Follow-up
                        </>
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
