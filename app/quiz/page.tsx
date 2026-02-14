"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Brain,
  Trophy,
  Clock,
  Target,
  ArrowRight,
  Home,
  BarChart3,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function QuizPage() {
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedConcept, setSelectedConcept] = useState<string>("");
  const [quizState, setQuizState] = useState<"selection" | "conceptSelection">(
    "selection"
  );
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [showCountPrompt, setShowCountPrompt] = useState<boolean>(false);
  const pathname = usePathname();

  const subjects = [
    {
      id: "math",
      name: "Mathematics",
      icon: "🔢",
      color: "bg-blue-100 text-blue-800",
    },
    {
      id: "science",
      name: "Science",
      icon: "🔬",
      color: "bg-green-100 text-green-800",
    },
    {
      id: "english",
      name: "English",
      icon: "📚",
      color: "bg-purple-100 text-purple-800",
    },
    {
      id: "history",
      name: "History",
      icon: "📜",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      id: "geography",
      name: "Geography",
      icon: "🌍",
      color: "bg-red-100 text-red-800",
    },
    {
      id: "computer",
      name: "Computer Science",
      icon: "💻",
      color: "bg-indigo-800",
    },
    {
      id: "general",
      name: "General Concepts",
      icon: "🧠",
      color: "bg-pink-100 text-pink-800",
    },
  ];

  const levels = [
    { id: "beginner", name: "Beginner", color: "bg-green-100 text-green-800" },
    {
      id: "intermediate",
      name: "Intermediate",
      color: "bg-yellow-100 text-yellow-800",
    },
    { id: "advanced", name: "Advanced", color: "bg-red-100 text-red-800" },
  ];

  const generalConcepts = [
    {
      id: "logic",
      name: "Logic & Reasoning",
      icon: "🧩",
      color: "bg-blue-100 text-blue-800",
    },
    {
      id: "critical-thinking",
      name: "Critical Thinking",
      icon: "💭",
      color: "bg-green-100 text-green-800",
    },
    {
      id: "problem-solving",
      name: "Problem Solving",
      icon: "🔧",
      color: "bg-purple-100 text-purple-800",
    },
    {
      id: "creativity",
      name: "Creativity",
      icon: "🎨",
      color: "bg-pink-100 text-pink-800",
    },
    {
      id: "memory",
      name: "Memory & Recall",
      icon: "🧠",
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      id: "analytical",
      name: "Analytical Skills",
      icon: "📊",
      color: "bg-orange-100 text-orange-800",
    },
    {
      id: "decision-making",
      name: "Decision Making",
      icon: "⚖️",
      color: "bg-red-100 text-red-800",
    },
    {
      id: "communication",
      name: "Communication",
      icon: "💬",
      color: "bg-teal-100 text-teal-800",
    },
  ];

  const quizCategories = [
    {
      id: "daily",
      name: "Daily Challenge",
      description: "New questions every day to keep you sharp",
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: "practice",
      name: "Practice Tests",
      description: "Comprehensive practice tests for exam preparation",
      icon: Brain,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      id: "competitive",
      name: "Competitive",
      description: "Challenge yourself against other students",
      icon: Trophy,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      id: "timed",
      name: "Timed Tests",
      description: "Speed-based quizzes to improve time management",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const handleStartQuiz = (categoryId: string) => {
    if (selectedSubject && selectedLevel) {
      // If General Concepts is selected, show concept selection first
      if (selectedSubject === "general") {
        if (!selectedConcept) {
          setQuizState("conceptSelection");
          return;
        }
      } else {
        // non-general subjects can proceed to count prompt
      }
      setShowCountPrompt(true);
    }
  };

  const handleQuestionCountSubmit = () => {
    // Redirect to quiz interface page with parameters
    const params = new URLSearchParams({
      subject: selectedSubject,
      level: selectedLevel,
      count: questionCount.toString(),
    });

    if (selectedSubject === "general" && selectedConcept) {
      params.append("concept", selectedConcept);
    }

    window.location.href = `/quiz/interface?${params.toString()}`;
  };

  const handleConceptSelection = (conceptId: string) => {
    setSelectedConcept(conceptId);
    setShowCountPrompt(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Classless</h1>
            </Link>
            <nav className="flex space-x-4">
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
              <Link href="/ask">
                <Button
                  variant={pathname === "/ask" ? "default" : "outline"}
                  className={pathname === "/ask" ? "bg-black text-white" : ""}
                >
                  Ask Question
                </Button>
              </Link>
              <Link href="/quiz">
                <Button>Quiz</Button>
              </Link>
              <Link href="/career-guidance">
                <Button variant="outline">Career Guidance</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Interactive Learning Quizzes
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Test your knowledge, challenge yourself, and track your progress
            with our comprehensive quiz system
          </p>
        </div>

        {/* Subject Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span>Choose Your Subject</span>
            </CardTitle>
            <CardDescription>
              Select a subject to start your learning journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubject(subject.id)}
                  className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedSubject === subject.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-3xl mb-2">{subject.icon}</div>
                  <div className="text-sm font-medium text-gray-900">
                    {subject.name}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Level Selection */}
        {selectedSubject && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <span>Choose Your Level</span>
              </CardTitle>
              <CardDescription>Select your proficiency level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {levels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setSelectedLevel(level.id)}
                    className={`p-6 rounded-lg border-2 transition-all hover:scale-105 ${
                      selectedLevel === level.id
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-2">
                        {level.name}
                      </div>
                      <Badge className={level.color}>{level.id}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Concept Selection for General Concepts */}
        {selectedSubject === "general" && selectedLevel && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-pink-600" />
                  <span>Choose Your Concept</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLevel("")}
                  className="text-pink-600 border-pink-300 hover:bg-pink-50"
                >
                  ← Back to Level
                </Button>
              </div>
              <CardDescription>
                Select the specific concept you want to test
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {generalConcepts.map((concept) => (
                  <button
                    key={concept.id}
                    onClick={() => setSelectedConcept(concept.id)}
                    className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                      selectedConcept === concept.id
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">{concept.icon}</div>
                      <div className="text-sm font-medium text-gray-900">
                        {concept.name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <Label htmlFor="custom-concept" className="mb-2 block">
                  Or enter your own concept
                </Label>
                <Input
                  id="custom-concept"
                  placeholder="e.g., Photosynthesis, Pythagorean theorem, Grammar tenses"
                  value={selectedConcept}
                  onChange={(e) => setSelectedConcept(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Typing here overrides the selected chip above.
                </p>
              </div>

              <div className="mt-6 flex justify-center">
                <Button
                  onClick={() => handleConceptSelection(selectedConcept)}
                  disabled={!selectedConcept}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  Start Quiz with {selectedConcept || "Selected Concept"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quiz Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quizCategories.map((category) => (
            <Card
              key={category.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardHeader>
                <div
                  className={`p-3 rounded-lg ${category.bgColor} w-fit mb-3`}
                >
                  <category.icon className={`h-6 w-6 ${category.color}`} />
                </div>
                <CardTitle className="text-lg">{category.name}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleStartQuiz(category.id)}
                  disabled={
                    !selectedSubject ||
                    !selectedLevel ||
                    (selectedSubject === "general" && !selectedConcept)
                  }
                >
                  Start Quiz
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Question Count Prompt */}
        {showCountPrompt && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span>How many questions?</span>
              </CardTitle>
              <CardDescription>
                Enter how many questions you want to generate for this quiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <Label htmlFor="question-count">Number of questions</Label>
                  <Input
                    id="question-count"
                    type="number"
                    min={1}
                    max={50}
                    value={questionCount}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!Number.isNaN(v))
                        setQuestionCount(Math.max(1, Math.min(50, v)));
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-2">Range: 1–50</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleQuestionCountSubmit}
                  >
                    Generate
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => setShowCountPrompt(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}

        {/* Call to Action */}
        {selectedSubject &&
          selectedLevel &&
          (selectedSubject !== "general" || selectedConcept) && (
            <Card className="text-center bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Ready to Start?</h3>
                <p className="text-blue-100 mb-6">
                  You've selected{" "}
                  {subjects.find((s) => s.id === selectedSubject)?.name}
                  {selectedSubject === "general" &&
                    selectedConcept &&
                    ` - ${
                      generalConcepts.find((c) => c.id === selectedConcept)
                        ?.name || selectedConcept
                    }`}
                  {` - ${
                    levels.find((l) => l.id === selectedLevel)?.name
                  } level`}
                </p>
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  onClick={() => handleStartQuiz("cta")}
                >
                  Begin Quiz Now
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}
