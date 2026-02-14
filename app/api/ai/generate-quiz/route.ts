import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

type GeneratedQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const subject: string = body.subject;
    const level: string = (body.level || "beginner").toLowerCase();
    const count: number = Math.min(
      Math.max(parseInt(body.count ?? 5, 10) || 5, 1),
      50
    );
    const concept: string | undefined = body.concept || undefined;

    const useSubjectLabel =
      subject === "general" ? concept || "general" : subject;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const fallback = generateSampleQuestions(subject, level, count, concept);
      return NextResponse.json({
        success: true,
        data: ensureUnique(fallback, count),
        message: "Used local sample questions (no OPENAI_API_KEY).",
      });
    }

    const openai = new OpenAI({ apiKey });

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt({
      subject: useSubjectLabel,
      level,
      count,
    });

    // Prefer lightweight, cost-effective model; adjust if needed
    let content = "";
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      });
      content = completion.choices?.[0]?.message?.content || "";
    } catch (err: any) {
      console.error("OpenAI generation failed, falling back:", err);
      const fallback = generateSampleQuestions(subject, level, count, concept);
      return NextResponse.json({
        success: true,
        data: ensureUnique(fallback, count),
        message:
          typeof err?.status === "number" && err.status === 429
            ? "Used local sample questions (OpenAI quota exceeded)."
            : "Used local sample questions (OpenAI error).",
      });
    }

    const parsed = safeParseAIJSON(content);

    let questions: GeneratedQuestion[] = Array.isArray(parsed?.questions)
      ? parsed.questions
      : Array.isArray(parsed)
      ? parsed
      : [];

    // Validate, sanitize, deduplicate, and enforce count
    questions = sanitizeQuestions(questions);
    questions = filterByLevelHeuristic(questions, level);
    questions = ensureUnique(questions, count);

    // If AI failed or returned too few, fallback enrich using samples
    if (questions.length < count) {
      const fallback = generateSampleQuestions(subject, level, count, concept);
      questions = ensureUnique([...questions, ...fallback], count);
    }

    return NextResponse.json({
      success: true,
      data: questions.slice(0, count),
      message: "Quiz questions generated successfully",
    });
  } catch (error) {
    console.error("Error generating quiz:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate quiz questions",
      },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(): string {
  return [
    "You are an expert educator and item writer.",
    "Return STRICT JSON only. Do not include markdown fences.",
    'Output schema: {"questions": [{"question": string, "options": string[4], "correctAnswer": string}]}.',
    "Rules:",
    "- Write questions ONLY about the requested topic.",
    "- Difficulty must match level.",
    "- Each question must have exactly 4 plausible options and ONE correctAnswer which must be one of options.",
    "- Avoid duplicates and near-duplicates.",
  ].join(" ");
}

function buildUserPrompt(params: {
  subject: string;
  level: string;
  count: number;
}): string {
  const { subject, level, count } = params;
  const levelGuidance = levelDifficultyGuidance(level);
  return [
    `Generate ${count} ${level} multiple-choice questions about ${subject}.`,
    levelGuidance,
    "Ensure questions are tightly scoped to the topic and realistic.",
  ].join(" ");
}

function levelDifficultyGuidance(level: string): string {
  switch (level) {
    case "beginner":
      return "Beginner: recall facts, basic definitions, simple computations.";
    case "intermediate":
      return "Intermediate: apply concepts, multi-step reasoning, compare/contrast, explain why.";
    case "advanced":
      return "Advanced: deep conceptual understanding, edge cases, synthesis, subtle misconceptions.";
    default:
      return "Match typical difficulty for the specified level.";
  }
}

function safeParseAIJSON(content: string): any {
  try {
    const trimmed = content.trim();
    if (!trimmed) return null;
    // Some models may return inline JSON without fences due to response_format
    return JSON.parse(trimmed);
  } catch {
    // Try to extract JSON if surrounded by extra text
    const match = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function sanitizeQuestions(items: GeneratedQuestion[]): GeneratedQuestion[] {
  const cleaned: GeneratedQuestion[] = [];
  for (const q of items) {
    if (!q || typeof q.question !== "string" || !Array.isArray(q.options))
      continue;
    const questionText = q.question.trim();
    const options = q.options.map((o) => String(o).trim()).filter(Boolean);
    // Ensure exactly 4 options; if more, keep first 4; if fewer, skip
    if (options.length !== 4) continue;
    const correct = String(q.correctAnswer ?? "").trim();
    if (!correct || !options.includes(correct)) continue;
    cleaned.push({ question: questionText, options, correctAnswer: correct });
  }
  return cleaned;
}

function filterByLevelHeuristic(
  items: GeneratedQuestion[],
  level: string
): GeneratedQuestion[] {
  const minLength =
    level === "advanced" ? 60 : level === "intermediate" ? 35 : 0;
  const filtered = items.filter(
    (q) => (q.question?.trim()?.length || 0) >= minLength
  );
  // If filtering removed too many, fall back to original
  return filtered.length >= Math.min(items.length, 3) ? filtered : items;
}

function ensureUnique(
  items: GeneratedQuestion[],
  count: number
): GeneratedQuestion[] {
  const seen = new Set<string>();
  const results: GeneratedQuestion[] = [];
  for (const q of items) {
    const key = normalize(q.question);
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(q);
    if (results.length >= count) break;
  }
  return results;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

// Sample question generation function (same as in the frontend)
function ensureCount<
  T extends { question: string; options: string[]; correctAnswer: string }
>(items: T[], count: number, subjectLabel: string): T[] {
  if (items.length >= count) return items.slice(0, count);
  const result: T[] = [];
  const base =
    items.length > 0
      ? items
      : [
          {
            question: `Placeholder question about ${subjectLabel}?`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: "Option A",
          } as T,
        ];
  let i = 0;
  while (result.length < count) {
    const baseItem = base[i % base.length];
    // create a shallow variant to avoid identical keys if any logic depends on text
    result.push({
      ...baseItem,
      question: `${baseItem.question} (${result.length + 1})`,
    });
    i++;
  }
  return result;
}

function generateSampleQuestions(
  subject: string,
  level: string,
  count: number,
  concept?: string
) {
  const subjectQuestions: Record<
    string,
    {
      beginner: GeneratedQuestion[];
      intermediate: GeneratedQuestion[];
      advanced: GeneratedQuestion[];
    }
  > = {
    math: {
      beginner: [
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
      ],
      intermediate: [
        {
          question: "Solve for x: 3x + 2 = 5x - 8",
          options: ["x = 5", "x =  -5", "x =  3", "x = -3"],
          correctAnswer: "x = 5",
        },
        {
          question: "The line y = 2x + b passes through (3, 11). What is b?",
          options: ["5", "2", "-5", "-2"],
          correctAnswer: "5",
        },
        {
          question:
            "What is the probability of rolling a sum of 7 with two dice?",
          options: ["1/6", "1/8", "1/9", "1/12"],
          correctAnswer: "1/6",
        },
      ],
      advanced: [
        {
          question:
            "Given f(x) = x^3 - 3x, how many critical points does f(x) have and which are local minima?",
          options: [
            "Two critical points; x = -1 is local min",
            "Two critical points; x = 1 is local min",
            "One critical point; x = 0 is local min",
            "No critical points",
          ],
          correctAnswer: "Two critical points; x = 1 is local min",
        },
        {
          question:
            "A geometric series has first term 6 and ratio 1/3. What is the sum to infinity?",
          options: ["9", "8", "7", "6"],
          correctAnswer: "9",
        },
        {
          question:
            "If A and B are independent events with P(A)=0.6 and P(B)=0.5, what is P(A ∪ B)?",
          options: ["0.8", "0.9", "0.7", "0.3"],
          correctAnswer: "0.8",
        },
      ],
    },
    science: {
      beginner: [
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
      ],
      intermediate: [
        {
          question:
            "Which organelle is primarily responsible for ATP production in eukaryotic cells?",
          options: ["Nucleus", "Mitochondrion", "Ribosome", "Golgi apparatus"],
          correctAnswer: "Mitochondrion",
        },
        {
          question:
            "What type of bond results from the sharing of electron pairs between atoms?",
          options: [
            "Ionic bond",
            "Covalent bond",
            "Hydrogen bond",
            "Metallic bond",
          ],
          correctAnswer: "Covalent bond",
        },
        {
          question:
            "Which law explains the relationship between pressure and volume at constant temperature?",
          options: [
            "Boyle's law",
            "Charles's law",
            "Avogadro's law",
            "Dalton's law",
          ],
          correctAnswer: "Boyle's law",
        },
      ],
      advanced: [
        {
          question:
            "In enzyme kinetics, when substrate concentration is much greater than Km, the reaction rate is approximately:",
          options: [
            "Zero-order in substrate",
            "First-order in substrate",
            "Second-order overall",
            "Independent of enzyme concentration",
          ],
          correctAnswer: "Zero-order in substrate",
        },
        {
          question:
            "Which of the following particles primarily mediates the strong nuclear force?",
          options: ["Photon", "W boson", "Gluon", "Z boson"],
          correctAnswer: "Gluon",
        },
        {
          question:
            "According to Le Chatelier’s principle, adding heat to an endothermic reaction at equilibrium will:",
          options: [
            "Shift equilibrium to the products",
            "Shift equilibrium to the reactants",
            "Have no effect",
            "Decrease reaction rate but not position",
          ],
          correctAnswer: "Shift equilibrium to the products",
        },
      ],
    },
    general: {
      beginner: [
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
      ],
      intermediate: [
        {
          question:
            "Which economic indicator measures the average change over time in the prices paid by consumers for a market basket of goods and services?",
          options: ["GDP", "CPI", "PPP", "GNP"],
          correctAnswer: "CPI",
        },
        {
          question:
            "In literature, which narrative perspective uses pronouns like 'he', 'she', and offers limited insight into characters' thoughts?",
          options: [
            "First-person",
            "Second-person",
            "Third-person limited",
            "Third-person omniscient",
          ],
          correctAnswer: "Third-person limited",
        },
        {
          question:
            "Which treaty ended World War I and imposed heavy reparations on Germany?",
          options: [
            "Treaty of Paris",
            "Treaty of Versailles",
            "Treaty of Tordesillas",
            "Treaty of Utrecht",
          ],
          correctAnswer: "Treaty of Versailles",
        },
      ],
      advanced: [
        {
          question:
            "Which philosophical position asserts that moral truths are not absolute but depend on cultural or individual perspectives?",
          options: [
            "Moral realism",
            "Moral relativism",
            "Deontology",
            "Virtue ethics",
          ],
          correctAnswer: "Moral relativism",
        },
        {
          question:
            "In macroeconomics, which policy tool is primarily used by central banks to control short-term interest rates?",
          options: [
            "Open market operations",
            "Fiscal spending",
            "Tax rebates",
            "Tariff adjustments",
          ],
          correctAnswer: "Open market operations",
        },
        {
          question:
            "Which historiographical approach emphasizes structures and long-term social history over political events?",
          options: [
            "Annales School",
            "Whig history",
            "Positivism",
            "Postmodernism",
          ],
          correctAnswer: "Annales School",
        },
      ],
    },
  };

  // For General Concepts, use concept-specific questions if available
  if (subject === "general" && concept) {
    const conceptQuestions: { [key: string]: any[] } = {
      logic: [
        {
          question: "If all roses are flowers and some flowers are red, then:",
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
          question: "What method is used to handle GET requests in Express.js?",
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
          options: ["app.start()", "app.listen()", "app.run()", "app.begin()"],
          correctAnswer: "app.listen()",
        },
        {
          question: "What does app.use() do in Express.js?",
          options: [
            "Creates a new route",
            "Adds middleware to the application",
            "Starts the server",
            "Handles errors",
          ],
          correctAnswer: "Adds middleware to the application",
        },
        {
          question: "How do you handle route parameters in Express.js?",
          options: ["req.params", "req.query", "req.body", "req.headers"],
          correctAnswer: "req.params",
        },
        {
          question: "What is the purpose of app.set() in Express.js?",
          options: [
            "To set environment variables",
            "To configure application settings",
            "To create routes",
            "To handle errors",
          ],
          correctAnswer: "To configure application settings",
        },
      ],
      // Add more Express.js variations
      express: [
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
          question: "What method is used to handle GET requests in Express.js?",
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
          options: ["app.start()", "app.listen()", "app.run()", "app.begin()"],
          correctAnswer: "app.listen()",
        },
      ],
      // Add more technology concepts
      javascript: [
        {
          question: "What is the difference between let and var in JavaScript?",
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
      const shuffled = conceptSpecificQuestions.sort(() => 0.5 - Math.random());
      return ensureCount(shuffled, count, concept);
    }

    // If no exact match, check if the concept contains any known keywords
    const conceptLower = concept.toLowerCase();
    for (const [key, questions] of Object.entries(conceptQuestions)) {
      if (conceptLower.includes(key) || key.includes(conceptLower)) {
        const shuffled = questions.sort(() => 0.5 - Math.random());
        return ensureCount(shuffled, count, concept);
      }
    }

    // If still no match, generate generic questions about the concept
    const genericQuestions = [
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

    return ensureCount(genericQuestions, count, concept);
  }

  const levelKey = ["beginner", "intermediate", "advanced"].includes(level)
    ? level
    : "beginner";
  const bank =
    subjectQuestions[subject]?.[levelKey] || subjectQuestions.general[levelKey];
  const shuffled = bank.slice().sort(() => 0.5 - Math.random());
  return ensureCount(shuffled, count, `${subject}-${levelKey}`);
}
