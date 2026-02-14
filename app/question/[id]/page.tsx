"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  BookOpen,
  ArrowLeft,
  Bot,
  User,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import type { Question, Answer, User as UserType, Reply } from "@/lib/types"

interface QuestionWithAnswers extends Question {
  answers: Answer[]
}

export default function QuestionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [question, setQuestion] = useState<QuestionWithAnswers | null>(null)
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [teacherAnswer, setTeacherAnswer] = useState("")
  const [isSubmittingTeacherAnswer, setIsSubmittingTeacherAnswer] = useState(false)
  const [replies, setReplies] = useState<Reply[]>([])
  const [newReply, setNewReply] = useState("")
  const replyInputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("classless_user")
    if (!userData) {
      router.push("/auth/login")
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)

    // Fetch question details
    fetchQuestion()
  }, [params.id, router])

  const fetchQuestion = async () => {
    try {
      const response = await fetch(`/api/questions/${params.id}`)
      const result = await response.json()

      if (result.success) {
        setQuestion(result.data)
        // Fetch replies in parallel
        try {
          const r = await fetch(`/api/questions/${params.id}/replies`)
          const rd = await r.json()
          if (rd.success) setReplies(rd.data as Reply[])
        } catch (e) {
          console.error("Error fetching replies:", e)
        }
      } else {
        toast.error("Question not found")
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error fetching question:", error)
      toast.error("Failed to load question")
    }
  }

  const handlePostReply = async () => {
    if (!newReply.trim() || !user) return
    try {
      const res = await fetch(`/api/questions/${params.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, text: newReply.trim() })
      })
      const data = await res.json()
      if (data.success) {
        setReplies((prev) => [...prev, data.data as Reply])
        setNewReply("")
        toast.success('Reply added')
      } else {
        toast.error(data.error || 'Failed to add reply')
      }
    } catch (e) {
      console.error('Reply error:', e)
      toast.error('Failed to add reply')
    }
  }

  const focusReplyBox = () => {
    try {
      replyInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => replyInputRef.current?.focus(), 300)
    } catch {}
  }

  const handleGetAIAnswer = async () => {
    if (!question) return

    setIsLoadingAI(true)
    try {
      const response = await fetch("/api/ai/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question_id: question.id,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        // Refresh question to show new answer
        await fetchQuestion()
      } else {
        toast.error(result.error || "Failed to generate AI answer")
      }
    } catch (error) {
      console.error("Error getting AI answer:", error)
      toast.error("Failed to get AI answer")
    } finally {
      setIsLoadingAI(false)
    }
  }

  const handleSubmitTeacherAnswer = async () => {
    if (!question || !teacherAnswer.trim()) return

    setIsSubmittingTeacherAnswer(true)
    try {
      const response = await fetch("/api/answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question_id: question.id,
          answer_text: teacherAnswer,
          answer_type: "teacher",
          teacher_id: user?.id,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Answer submitted successfully!")
        setTeacherAnswer("")
        await fetchQuestion()
      } else {
        toast.error(result.error || "Failed to submit answer")
      }
    } catch (error) {
      console.error("Error submitting teacher answer:", error)
      toast.error("Failed to submit answer")
    } finally {
      setIsSubmittingTeacherAnswer(false)
    }
  }

  if (!question || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    )
  }

  const aiAnswers = question.answers.filter((a) => a.answer_type === "ai")
  const teacherAnswers = question.answers.filter((a) => a.answer_type === "teacher")
  const hasAIAnswer = aiAnswers.length > 0

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
              <h1 className="text-xl font-bold text-gray-900">Question Details</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Question Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{question.question_text}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(question.created_at).toLocaleDateString()}</span>
                  </div>
                  <Badge variant="secondary">{question.language.toUpperCase()}</Badge>
                  <Badge variant="outline">{question.difficulty_level}</Badge>
                </div>
              </div>
              <Badge
                variant={
                  question.status === "answered"
                    ? "default"
                    : question.status === "pending"
                      ? "secondary"
                      : "destructive"
                }
              >
                {question.status}
              </Badge>
            </div>
          </CardHeader>

          {question.question_type !== "text" && (
            <CardContent>
              {question.question_type === "image" && question.image_url && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Attached Image:</p>
                  <img
                    src={question.image_url || "/placeholder.svg"}
                    alt="Question attachment"
                    className="max-w-full h-auto rounded-lg border"
                  />
                </div>
              )}
              {question.question_type === "voice" && question.audio_url && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Audio Question:</p>
                  <audio controls className="w-full">
                    <source src={question.audio_url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* AI Answer Section */}
        {!hasAIAnswer && question.status === "pending" && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-blue-600" />
                <span>AI Tutor</span>
              </CardTitle>
              <CardDescription>Get an instant AI-powered answer to this question</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleGetAIAnswer} disabled={isLoadingAI}>
                {isLoadingAI ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Answer...
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4 mr-2" />
                    Get AI Answer
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Answers Section */}
        {question.answers.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Answers</h2>

            {/* AI Answers */}
            {aiAnswers.map((answer) => (
              <Card key={answer.id} className="border-blue-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">AI Tutor</CardTitle>
                      {answer.confidence_score && (
                        <Badge variant={answer.confidence_score > 0.7 ? "default" : "secondary"}>
                          {Math.round(answer.confidence_score * 100)}% confidence
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {answer.confidence_score && answer.confidence_score < 0.7 && (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-sm text-gray-500">{new Date(answer.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{answer.answer_text}</p>
                  </div>

                  {answer.confidence_score && answer.confidence_score < 0.7 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <p className="text-sm text-yellow-800">
                          This answer has low confidence. A teacher review is recommended.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Helpful
                      </Button>
                      <Button variant="outline" size="sm">
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        Not Helpful
                      </Button>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500">{answer.helpful_votes} people found this helpful</span>
                      <Button size="sm" onClick={focusReplyBox}>Reply</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Teacher Answers */}
            {teacherAnswers.map((answer) => (
              <Card key={answer.id} className="border-green-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-lg">Teacher</CardTitle>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">{new Date(answer.created_at).toLocaleString()}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{answer.answer_text}</p>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Helpful
                      </Button>
                      <Button variant="outline" size="sm">
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        Not Helpful
                      </Button>
                    </div>
                    <span className="text-sm text-gray-500">{answer.helpful_votes} people found this helpful</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Replies Thread */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Discussion</span>
            </CardTitle>
            <CardDescription>Continue the conversation about this question</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {replies.length === 0 ? (
                <p className="text-sm text-gray-600">No replies yet. Be the first to reply.</p>
              ) : (
                <div className="space-y-3">
                  {replies.map((r) => (
                    <div key={r.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>User #{r.user_id}</span>
                        <span>{new Date(r.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-800 whitespace-pre-wrap text-sm">{r.text}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Textarea
                  placeholder="Write a reply to continue the discussion..."
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  ref={replyInputRef}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button onClick={handlePostReply} disabled={!newReply.trim()}>Reply</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teacher Answer Form */}
        {user.user_type === "teacher" && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <span>Add Teacher Answer</span>
              </CardTitle>
              <CardDescription>Provide a detailed answer to help this student learn better</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Write your detailed answer here... Include step-by-step explanations and examples."
                  value={teacherAnswer}
                  onChange={(e) => setTeacherAnswer(e.target.value)}
                  rows={6}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitTeacherAnswer}
                    disabled={isSubmittingTeacherAnswer || !teacherAnswer.trim()}
                  >
                    {isSubmittingTeacherAnswer ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Answer"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
