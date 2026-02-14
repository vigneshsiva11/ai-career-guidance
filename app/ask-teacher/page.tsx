"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, MessageSquare, Send } from "lucide-react";
import type { Reply, User, Question } from "@/lib/types";

export default function AskTeacherPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [subjectId, setSubjectId] = useState<string>("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdQuestionId, setCreatedQuestionId] = useState<number | null>(
    null
  );
  const [teacherQuestionIds, setTeacherQuestionIds] = useState<number[]>([]);
  const [allUserQuestions, setAllUserQuestions] = useState<Question[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);
  const [repliesByQuestion, setRepliesByQuestion] = useState<
    Record<number, Reply[]>
  >({});
  const [loadingRepliesByQuestion, setLoadingRepliesByQuestion] = useState<
    Record<number, boolean>
  >({});
  const [replies, setReplies] = useState<Reply[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [newReply, setNewReply] = useState("");
  const replyBoxRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("classless_user");
    if (!userData) {
      router.push("/auth/login");
      return;
    }
    const parsed = JSON.parse(userData);
    if (parsed.user_type !== "student") {
      router.push("/dashboard");
      return;
    }
    setUser(parsed);
    try {
      const stored = localStorage.getItem(
        `classless_teacher_questions_${parsed.id}`
      );
      if (stored) setTeacherQuestionIds(JSON.parse(stored));
    } catch {}

    // Handle deep link from dashboard to a specific question id
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q) setCreatedQuestionId(Number(q));
    } catch {}
  }, [router]);

  useEffect(() => {
    // Load all user questions for listing previous teacher-directed ones
    const loadQuestions = async () => {
      if (!user) return;
      try {
        const res = await fetch(`/api/questions?user_id=${user.id}`);
        const data = await res.json();
        if (data.success) setAllUserQuestions(data.data as Question[]);
      } catch (e) {
        console.error("Load user questions error:", e);
      }
    };
    void loadQuestions();
  }, [user]);

  // When teacher question ids or list loads, expand all by default and preload replies
  useEffect(() => {
    if (teacherQuestionIds.length === 0) return;
    setExpandedQuestions(Array.from(new Set([...teacherQuestionIds])));
    // Preload replies for each tracked question
    teacherQuestionIds.forEach((qid) => {
      if (!repliesByQuestion[qid]) void loadRepliesForQuestion(qid);
    });
  }, [teacherQuestionIds, allUserQuestions]);

  // Poll replies for expanded questions every 10s
  useEffect(() => {
    if (expandedQuestions.length === 0) return;
    const interval = setInterval(() => {
      expandedQuestions.forEach((qid) => void loadRepliesForQuestion(qid));
    }, 10000);
    return () => clearInterval(interval);
  }, [expandedQuestions]);

  useEffect(() => {
    if (!createdQuestionId) return;
    let intervalId: NodeJS.Timeout | null = null;
    const loadReplies = async () => {
      try {
        setIsLoadingReplies(true);
        const r = await fetch(`/api/questions/${createdQuestionId}/replies`);
        const d = await r.json();
        if (d.success) setReplies(d.data as Reply[]);
      } catch (e) {
        console.error("Load replies error:", e);
      } finally {
        setIsLoadingReplies(false);
      }
    };
    void loadReplies();
    intervalId = setInterval(loadReplies, 10000);
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [createdQuestionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !questionText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          subject_id: Number(subjectId),
          question_text: questionText.trim(),
          question_type: "text",
          language: "en",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedQuestionId(data.data.id as number);
        // Track this question id as teacher-directed for this user
        if (user) {
          setTeacherQuestionIds((prev) => {
            const next = Array.from(new Set([...prev, data.data.id]));
            localStorage.setItem(
              `classless_teacher_questions_${user.id}`,
              JSON.stringify(next)
            );
            return next;
          });
        }
        // Auto-expand and load replies for the new question
        try {
          setExpandedQuestions((prev) =>
            Array.from(new Set([...prev, data.data.id]))
          );
          await loadRepliesForQuestion(data.data.id);
        } catch {}
      }
    } catch (e) {
      console.error("Submit question error:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const postReply = async () => {
    if (!createdQuestionId || !user || !newReply.trim()) return;
    try {
      const res = await fetch(`/api/questions/${createdQuestionId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, text: newReply.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setReplies((prev) => [...prev, data.data as Reply]);
        setNewReply("");
        try {
          replyBoxRef.current?.focus();
        } catch {}
      }
    } catch (e) {
      console.error("Post reply error:", e);
    }
  };

  const loadRepliesForQuestion = async (qid: number) => {
    try {
      setLoadingRepliesByQuestion((prev) => ({ ...prev, [qid]: true }));
      const r = await fetch(`/api/questions/${qid}/replies`);
      const d = await r.json();
      if (d.success)
        setRepliesByQuestion((prev) => ({ ...prev, [qid]: d.data as Reply[] }));
    } catch (e) {
      console.error("Load replies error:", e);
    } finally {
      setLoadingRepliesByQuestion((prev) => ({ ...prev, [qid]: false }));
    }
  };

  const toggleExpand = async (qid: number) => {
    setExpandedQuestions((prev) => {
      if (prev.includes(qid)) return prev.filter((id) => id !== qid);
      return [...prev, qid];
    });
    if (!repliesByQuestion[qid]) {
      await loadRepliesForQuestion(qid);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Ask Teacher</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ask your teacher</CardTitle>
            <CardDescription>
              Send a question to your teacher. You will see replies from
              teachers below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Mathematics</SelectItem>
                    <SelectItem value="2">Science</SelectItem>
                    <SelectItem value="3">English</SelectItem>
                    <SelectItem value="4">History</SelectItem>
                    <SelectItem value="5">Geography</SelectItem>
                    <SelectItem value="6">Computer Science</SelectItem>
                    <SelectItem value="7">General Concepts</SelectItem>
                    <SelectItem value="8">Physics</SelectItem>
                    <SelectItem value="9">Chemistry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="question">Your Question</Label>
                <Textarea
                  id="question"
                  placeholder="Type your question to the teacher..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  rows={5}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Sending..." : "Send to Teacher"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {createdQuestionId && (
          <Card>
            <CardHeader>
              <CardTitle>Discussion with Teacher</CardTitle>
              <CardDescription>
                Question ID: {createdQuestionId}. Replies will appear below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isLoadingReplies && (
                  <div className="text-sm text-gray-500">
                    Loading replies...
                  </div>
                )}
                {replies.length === 0 && !isLoadingReplies && (
                  <div className="text-sm text-gray-500">
                    No replies yet. Your teacher will respond soon.
                  </div>
                )}
                {replies.map((r) => (
                  <div key={r.id} className="border rounded p-3">
                    <div className="text-xs text-gray-500 mb-1">
                      {new Date(r.created_at).toLocaleString()} by User #
                      {r.user_id}
                    </div>
                    <div className="text-sm text-gray-800">{r.text}</div>
                  </div>
                ))}

                <div className="mt-4">
                  <Label htmlFor="reply">Add a follow-up</Label>
                  <Textarea
                    id="reply"
                    ref={replyBoxRef}
                    placeholder="Write a follow-up message..."
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    rows={3}
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      onClick={postReply}
                      className="flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" /> Post Reply
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {user && teacherQuestionIds.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Previous Teacher Questions</CardTitle>
                <CardDescription>
                  Select a question below to view or continue the discussion.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allUserQuestions
                    .filter((q) => teacherQuestionIds.includes(q.id))
                    .slice()
                    .reverse()
                    .map((q) => (
                      <div key={q.id} className="border rounded p-3">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm text-gray-800 flex-1">
                            {q.question_text}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleExpand(q.id)}
                          >
                            {expandedQuestions.includes(q.id)
                              ? "Hide replies"
                              : "View replies"}
                          </Button>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Asked on {new Date(q.created_at).toLocaleString()}
                        </div>

                        {expandedQuestions.includes(q.id) && (
                          <div className="mt-3 space-y-2">
                            {loadingRepliesByQuestion[q.id] && (
                              <div className="text-sm text-gray-500">
                                Loading replies...
                              </div>
                            )}
                            {!loadingRepliesByQuestion[q.id] && (
                              <>
                                {(!repliesByQuestion[q.id] ||
                                  repliesByQuestion[q.id].length === 0) && (
                                  <div className="text-sm text-gray-500">
                                    No replies yet.
                                  </div>
                                )}
                                {repliesByQuestion[q.id] &&
                                  repliesByQuestion[q.id].map((r) => (
                                    <div
                                      key={r.id}
                                      className="border rounded p-2"
                                    >
                                      <div className="text-xs text-gray-500 mb-1">
                                        {new Date(
                                          r.created_at
                                        ).toLocaleString()}{" "}
                                        by User #{r.user_id}
                                      </div>
                                      <div className="text-sm text-gray-800">
                                        {r.text}
                                      </div>
                                    </div>
                                  ))}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
