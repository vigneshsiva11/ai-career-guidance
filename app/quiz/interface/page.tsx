"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  XCircle,
  Home,
  BarChart3,
  Clock,
  Trophy,
} from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

function QuizInterfaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [quizState, setQuizState] = useState<"quiz" | "results">("quiz");
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const [quizStats, setQuizStats] = useState({
    quizzesCompleted: 0,
    averageScore: 0,
    totalTimeSpent: 0,
  });
  const [attendanceId, setAttendanceId] = useState<number | null>(null);

  const subject = searchParams.get("subject");
  const level = searchParams.get("level");
  const count = searchParams.get("count");
  const concept = searchParams.get("concept");

  useEffect(() => {
    if (subject && level && count) {
      generateQuizQuestions();
    }
  }, [subject, level, count, concept]);

  const trackQuizAttendance = async () => {
    try {
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem("classless_user")
          : null;
      const u = raw ? JSON.parse(raw) : null;
      if (u && u.id) {
        console.log(
          "[Quiz Interface] Tracking attendance for student:",
          u.id,
          "Subject:",
          subject,
          "Level:",
          level
        );

        const response = await fetch("/api/quiz/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "start",
            student_id: u.id,
            subject:
              subject === "general"
                ? concept || "general"
                : subject || "general",
            level: level || "beginner",
            quiz_id: `${subject}-${level}-${Date.now()}`,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("[Quiz Interface] Attendance tracking response:", result);
          if (result.success && result.attendance) {
            setAttendanceId(result.attendance.id);
            console.log(
              "[Quiz Interface] Attendance ID set:",
              result.attendance.id
            );
          }
        } else {
          console.error(
            "[Quiz Interface] Attendance tracking failed:",
            response.status,
            response.statusText
          );
        }
      } else {
        console.error("[Quiz Interface] No user found in localStorage");
      }
    } catch (error) {
      console.error("Error tracking quiz attendance:", error);
    }
  };

  const generateQuizQuestions = async () => {
    setIsLoading(true);

    try {
      // Check if user is logged in first
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem("classless_user")
          : null;
      console.log("[Quiz Interface] Raw user data from localStorage:", raw);

      // Track attendance when quiz starts
      await trackQuizAttendance();

      // Call the AI quiz generation API
      const response = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          level,
          count: parseInt(count || "5"),
          concept,
          prompt: `Generate ${count} ${level} level questions specifically about ${
            subject === "general" ? concept : subject
          }. The questions should be directly related to ${
            subject === "general" ? concept : subject
          } concepts, terminology, and practical applications. Each question should have 4 multiple choice options and one correct answer. Return as JSON with format: [{"question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": "..."}]`,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setQuestions(result.data);
          setQuizStartTime(Date.now());
          setIsLoading(false);
        } else {
          throw new Error(result.error || "Failed to generate questions");
        }
      } else {
        throw new Error("API request failed");
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      // Fallback to sample questions
      const sampleQuestions = generateSampleQuestions();
      setQuestions(sampleQuestions);
      setQuizStartTime(Date.now());
      setIsLoading(false);
    }
  };

  const ensureCount = (
    items: Question[],
    desired: number,
    label: string
  ): Question[] => {
    if (items.length >= desired) return items.slice(0, desired);
    const base =
      items.length > 0
        ? items
        : [
            {
              question: `Placeholder question about ${label}?`,
              options: ["Option A", "Option B", "Option C", "Option D"],
              correctAnswer: "Option A",
            },
          ];
    const result: Question[] = [];
    let i = 0;
    while (result.length < desired) {
      const b = base[i % base.length];
      result.push({ ...b, question: `${b.question} (${result.length + 1})` });
      i++;
    }
    return result;
  };

  const generateSampleQuestions = (): Question[] => {
    const subjectQuestions: { [key: string]: Question[] } = {
      math: [
        {
          question: "What is the result of 15 × 8?",
          options: ["120", "115", "125", "130"],
          correctAnswer: "120",
        },
        {
          question: "If x + 5 = 12, what is the value of x?",
          options: ["5", "6", "7", "8"],
          correctAnswer: "7",
        },
        {
          question:
            "What is the area of a rectangle with length 6 and width 4?",
          options: ["20", "24", "28", "32"],
          correctAnswer: "24",
        },
        {
          question: "What is 25% of 80?",
          options: ["15", "20", "25", "30"],
          correctAnswer: "20",
        },
        {
          question: "Solve: 3x - 7 = 14",
          options: ["x = 5", "x = 6", "x = 7", "x = 8"],
          correctAnswer: "x = 7",
        },
      ],
      science: [
        {
          question: "What is the chemical symbol for gold?",
          options: ["Ag", "Au", "Fe", "Cu"],
          correctAnswer: "Au",
        },
        {
          question: "Which planet is known as the Red Planet?",
          options: ["Venus", "Mars", "Jupiter", "Saturn"],
          correctAnswer: "Mars",
        },
        {
          question: "What is the hardest natural substance on Earth?",
          options: ["Steel", "Iron", "Diamond", "Granite"],
          correctAnswer: "Diamond",
        },
        {
          question: "What is the largest organ in the human body?",
          options: ["Heart", "Brain", "Liver", "Skin"],
          correctAnswer: "Skin",
        },
        {
          question: "What is the atomic number of carbon?",
          options: ["4", "6", "8", "12"],
          correctAnswer: "6",
        },
      ],
      general: [
        {
          question: "What is the capital of France?",
          options: ["London", "Berlin", "Paris", "Madrid"],
          correctAnswer: "Paris",
        },
        {
          question: "Who painted the Mona Lisa?",
          options: ["Van Gogh", "Da Vinci", "Picasso", "Rembrandt"],
          correctAnswer: "Da Vinci",
        },
        {
          question: "What year did World War II end?",
          options: ["1943", "1944", "1945", "1946"],
          correctAnswer: "1945",
        },
        {
          question: "What is the largest mammal in the world?",
          options: ["African Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
          correctAnswer: "Blue Whale",
        },
        {
          question: "Which element has the chemical symbol 'O'?",
          options: ["Osmium", "Oxygen", "Oganesson", "Osmium"],
          correctAnswer: "Oxygen",
        },
      ],
    };

    // For General Concepts, use concept-specific questions if available
    if (subject === "general" && concept) {
      const conceptQuestions: { [key: string]: Question[] } = {
        logic: [
          {
            question:
              "If all roses are flowers and some flowers are red, then:",
            options: [
              "All roses are red",
              "Some roses are red",
              "No roses are red",
              "Cannot determine",
            ],
            correctAnswer: "Cannot determine",
          },
          {
            question: "Complete the sequence: 2, 4, 8, 16, __",
            options: ["20", "24", "32", "30"],
            correctAnswer: "32",
          },
          {
            question:
              "Which statement is logically equivalent to 'If it rains, then I stay home'?",
            options: [
              "If I don't stay home, it doesn't rain",
              "If I stay home, it rains",
              "If it doesn't rain, I don't stay home",
              "I stay home only when it rains",
            ],
            correctAnswer: "If I don't stay home, it doesn't rain",
          },
        ],
        "critical-thinking": [
          {
            question:
              "What is the best approach to evaluate a news article's credibility?",
            options: [
              "Check the headline",
              "Verify multiple sources",
              "Trust the author's credentials",
              "Read the conclusion first",
            ],
            correctAnswer: "Verify multiple sources",
          },
          {
            question:
              "When analyzing an argument, what should you identify first?",
            options: [
              "The conclusion",
              "The evidence",
              "The author's bias",
              "The counterarguments",
            ],
            correctAnswer: "The conclusion",
          },
          {
            question: "What is a logical fallacy?",
            options: [
              "A true statement",
              "A false conclusion",
              "An error in reasoning",
              "A mathematical error",
            ],
            correctAnswer: "An error in reasoning",
          },
        ],
        "problem-solving": [
          {
            question: "What is the first step in systematic problem solving?",
            options: [
              "Implement a solution",
              "Define the problem",
              "Evaluate alternatives",
              "Generate ideas",
            ],
            correctAnswer: "Define the problem",
          },
          {
            question: "When brainstorming solutions, what should you avoid?",
            options: [
              "Quantity over quality",
              "Judging ideas too early",
              "Building on others' ideas",
              "Thinking outside the box",
            ],
            correctAnswer: "Judging ideas too early",
          },
          {
            question: "What is the purpose of a decision matrix?",
            options: [
              "To eliminate all options",
              "To compare alternatives systematically",
              "To delay decision making",
              "To simplify complex problems",
            ],
            correctAnswer: "To compare alternatives systematically",
          },
        ],
        // Add Express.js specific questions
        "express-js": [
          {
            question: "What is Express.js?",
            options: [
              "A database management system",
              "A web application framework for Node.js",
              "A frontend JavaScript library",
              "A cloud hosting service",
            ],
            correctAnswer: "A web application framework for Node.js",
          },
          {
            question: "How do you create a basic Express.js server?",
            options: [
              "const app = express()",
              "const server = new express()",
              "const app = new express()",
              "const server = express()",
            ],
            correctAnswer: "const app = express()",
          },
          {
            question:
              "What method is used to handle GET requests in Express.js?",
            options: ["app.post()", "app.get()", "app.put()", "app.delete()"],
            correctAnswer: "app.get()",
          },
          {
            question: "What is middleware in Express.js?",
            options: [
              "A database query",
              "Functions that have access to request and response objects",
              "A type of route",
              "A template engine",
            ],
            correctAnswer:
              "Functions that have access to request and response objects",
          },
          {
            question: "How do you start an Express.js server?",
            options: [
              "app.start()",
              "app.listen()",
              "app.run()",
              "app.begin()",
            ],
            correctAnswer: "app.listen()",
          },
        ],
        // Add more technology concepts
        javascript: [
          {
            question:
              "What is the difference between let and var in JavaScript?",
            options: [
              "There is no difference",
              "let has block scope, var has function scope",
              "var is newer than let",
              "let can only be used in loops",
            ],
            correctAnswer: "let has block scope, var has function scope",
          },
          {
            question: "What is a closure in JavaScript?",
            options: [
              "A function that has access to variables in its outer scope",
              "A way to close browser tabs",
              "A method to end loops",
              "A type of array",
            ],
            correctAnswer:
              "A function that has access to variables in its outer scope",
          },
          {
            question: "What does JSON stand for?",
            options: [
              "JavaScript Object Notation",
              "JavaScript Oriented Network",
              "JavaScript Online Network",
              "JavaScript Object Network",
            ],
            correctAnswer: "JavaScript Object Notation",
          },
        ],
        react: [
          {
            question: "What is React?",
            options: [
              "A database",
              "A JavaScript library for building user interfaces",
              "A programming language",
              "A web server",
            ],
            correctAnswer: "A JavaScript library for building user interfaces",
          },
          {
            question: "What is a component in React?",
            options: [
              "A database table",
              "A reusable piece of UI",
              "A CSS file",
              "A JavaScript function",
            ],
            correctAnswer: "A reusable piece of UI",
          },
          {
            question: "What hook is used for side effects in React?",
            options: ["useState", "useEffect", "useContext", "useReducer"],
            correctAnswer: "useEffect",
          },
        ],
        python: [
          {
            question: "What is Python?",
            options: [
              "A snake",
              "A programming language",
              "A web browser",
              "An operating system",
            ],
            correctAnswer: "A programming language",
          },
          {
            question: "How do you create a list in Python?",
            options: ["list()", "[]", "{}", "()"],
            correctAnswer: "[]",
          },
          {
            question: "What is the correct way to create a function in Python?",
            options: [
              "function myFunc():",
              "def myFunc():",
              "create myFunc():",
              "func myFunc():",
            ],
            correctAnswer: "def myFunc():",
          },
        ],
      };

      // First check if we have exact concept match
      const conceptSpecificQuestions = conceptQuestions[concept.toLowerCase()];
      if (conceptSpecificQuestions) {
        const shuffled = conceptSpecificQuestions.sort(
          () => 0.5 - Math.random()
        );
        return ensureCount(shuffled, parseInt(count || "5"), concept);
      }

      // If no exact match, check if the concept contains any known keywords
      const conceptLower = concept.toLowerCase();
      for (const [key, questions] of Object.entries(conceptQuestions)) {
        if (conceptLower.includes(key) || key.includes(conceptLower)) {
          const shuffled = questions.sort(() => 0.5 - Math.random());
          return ensureCount(shuffled, parseInt(count || "5"), concept);
        }
      }

      // If still no match, generate generic questions about the concept
      const genericQuestions: Question[] = [
        {
          question: `What is ${concept}?`,
          options: [
            `A type of ${concept.toLowerCase()}`,
            `A tool for ${concept.toLowerCase()}`,
            `A framework for ${concept.toLowerCase()}`,
            `A language for ${concept.toLowerCase()}`,
          ],
          correctAnswer: `A framework for ${concept.toLowerCase()}`,
        },
        {
          question: `Which of the following is NOT related to ${concept}?`,
          options: [
            `${concept} syntax`,
            `${concept} methods`,
            `${concept} properties`,
            "Unrelated technology",
          ],
          correctAnswer: "Unrelated technology",
        },
        {
          question: `What is the main purpose of ${concept}?`,
          options: [
            "To make websites look pretty",
            "To handle server-side logic",
            "To manage databases",
            "To create mobile apps",
          ],
          correctAnswer: "To handle server-side logic",
        },
        {
          question: `How do you typically install ${concept}?`,
          options: [
            "Using npm install",
            "Downloading from website",
            "Copying files manually",
            "Using a CDN link",
          ],
          correctAnswer: "Using npm install",
        },
        {
          question: `What file extension is commonly used with ${concept}?`,
          options: [".js", ".html", ".css", ".txt"],
          correctAnswer: ".js",
        },
      ];

      return ensureCount(genericQuestions, parseInt(count || "5"), concept);
    }

    // Fallback to subject questions or general questions
    const baseQuestions =
      subjectQuestions[subject || "general"] || subjectQuestions.general;
    const shuffled = baseQuestions.sort(() => 0.5 - Math.random());
    return ensureCount(shuffled, parseInt(count || "5"), subject || "general");
  };

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const handleSubmitQuiz = () => {
    const endTime = Date.now();
    const timeSpent = (endTime - quizStartTime) / (1000 * 60 * 60); // Convert to hours

    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / questions.length) * 100);

    // Update stats
    setQuizStats((prev) => ({
      quizzesCompleted: prev.quizzesCompleted + 1,
      averageScore: Math.round((prev.averageScore + score) / 2),
      totalTimeSpent: prev.totalTimeSpent + timeSpent,
    }));

    // Update attendance record with completion details
    try {
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem("classless_user")
          : null;
      const u = raw ? JSON.parse(raw) : null;
      if (u && u.id) {
        console.log(
          "[Quiz Interface] Completing quiz for student:",
          u.id,
          "Score:",
          correctAnswers,
          "Total:",
          questions.length
        );

        fetch("/api/quiz/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "complete",
            student_id: u.id,
            subject:
              subject === "general"
                ? concept || "general"
                : subject || "general",
            level: level || "beginner",
            score: correctAnswers,
            total_questions: questions.length,
            completion_time: Math.round((endTime - quizStartTime) / 1000),
            completed_at: new Date().toISOString(),
            status: "completed",
          }),
        })
          .then((response) => response.json())
          .then((result) => {
            console.log("[Quiz Interface] Quiz completion response:", result);
          })
          .catch((error) => {
            console.error("[Quiz Interface] Quiz completion error:", error);
          });
      }
    } catch (error) {
      console.error("[Quiz Interface] Error in completion tracking:", error);
    }

    setQuizState("results");
  };

  const handleRetakeQuiz = () => {
    router.push("/quiz");
  };

  const handleBackToHome = () => {
    router.push("/quiz");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Generating Your Quiz...
          </h2>
          <p className="text-gray-600">
            Creating {count} {level} level questions about{" "}
            {subject === "general" ? concept : subject}
          </p>
        </div>
      </div>
    );
  }

  if (quizState === "results") {
    const correctAnswers = questions.filter(
      (_, index) => userAnswers[index] === questions[index].correctAnswer
    ).length;
    const score = Math.round((correctAnswers / questions.length) * 100);
    const timeSpent = (Date.now() - quizStartTime) / (1000 * 60); // Convert to minutes

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Quiz Results
            </h1>
            <div className="flex justify-center space-x-4 mb-6">
              <Badge variant="outline" className="text-lg px-4 py-2">
                {subject === "general" ? concept : subject}
              </Badge>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {level}
              </Badge>
            </div>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                Your Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {score}%
                  </div>
                  <div className="text-gray-600">Score</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {correctAnswers}/{questions.length}
                  </div>
                  <div className="text-gray-600">Correct Answers</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    {Math.round(timeSpent)}m
                  </div>
                  <div className="text-gray-600">Time Taken</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Button
              onClick={handleRetakeQuiz}
              className="w-full h-16 text-lg"
              variant="outline"
            >
              Take Another Quiz
            </Button>
            <Button onClick={handleBackToHome} className="w-full h-16 text-lg">
              Back to Quiz
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Quiz</h1>
            <div className="flex space-x-2 mt-2">
              <Badge variant="outline">
                {subject === "general" ? concept : subject}
              </Badge>
              <Badge variant="outline">{level}</Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
            <div className="text-sm text-gray-600">
              Time: {Math.round((Date.now() - quizStartTime) / 1000)}s
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progress} className="h-3" />
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              {currentQuestion?.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={userAnswers[currentQuestionIndex] || ""}
              onValueChange={(value) =>
                handleAnswerSelect(currentQuestionIndex, value)
              }
            >
              {currentQuestion?.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 mb-3">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label
                    htmlFor={`option-${index}`}
                    className="text-lg cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            onClick={() =>
              setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
            }
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            Previous
          </Button>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={handleSubmitQuiz}
              disabled={!userAnswers[currentQuestionIndex]}
              className="bg-green-600 hover:bg-green-700"
            >
              Submit Quiz
            </Button>
          ) : (
            <Button
              onClick={() =>
                setCurrentQuestionIndex((prev) =>
                  Math.min(questions.length - 1, prev + 1)
                )
              }
              disabled={!userAnswers[currentQuestionIndex]}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuizInterfacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Loading Quiz...
            </h2>
            <p className="text-gray-600">Preparing your quiz interface</p>
          </div>
        </div>
      }
    >
      <QuizInterfaceContent />
    </Suspense>
  );
}
