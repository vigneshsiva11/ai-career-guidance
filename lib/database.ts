import type {
  User,
  Question,
  Answer,
  Subject,
  Reply,
  QuizAttendance,
} from "./types";
import { connectDatabase } from "@/server/config/database";
import { UserModel } from "@/server/models/User";
import { QuestionModel } from "@/server/models/Question";
import { AnswerModel } from "@/server/models/Answer";
import { ReplyModel } from "@/server/models/Reply";
import { QuizAttendanceModel } from "@/server/models/QuizAttendance";

const mockQuestions: Question[] = [];
const mockAnswers: Answer[] = [];
const mockReplies: Reply[] = [];
const mockQuizAttendance: QuizAttendance[] = [];

const mockSubjects: Subject[] = [
  {
    id: 1,
    name: "Mathematics",
    code: "MATH",
    description: "Basic to advanced mathematics",
    education_level: "all",
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Science",
    code: "SCI",
    description: "Physics, Chemistry, Biology",
    education_level: "all",
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: "English",
    code: "ENG",
    description: "English language and literature",
    education_level: "all",
    created_at: new Date().toISOString(),
  },
];

interface Scholarship {
  id: string;
  name: string;
  provider: string;
  amount: number;
  category: string;
  description: string;
  eligibleStates: string[];
  minGrade: number;
  maxGrade: number;
  deadline: string;
  requirements: string[];
  applicationUrl: string;
}

interface ScholarshipApplication {
  id: string;
  userId: string;
  scholarshipId: string;
  status: "applied" | "under_review" | "approved" | "rejected";
  appliedAt: string;
  documents: string[];
}

interface Notification {
  id: string;
  userId: string;
  type: "scholarship" | "question" | "system" | "reminder";
  title: string;
  message: string;
  scholarshipId?: string;
  read: boolean;
  createdAt: string;
}

const mockScholarships: Scholarship[] = [
  {
    id: "nmmss",
    name: "National Means-cum-Merit Scholarship (NMMSS)",
    provider: "Ministry of Education, Government of India",
    amount: 12000,
    category: "Merit-cum-Means",
    description: "Scholarship support for eligible students.",
    eligibleStates: ["All"],
    minGrade: 9,
    maxGrade: 12,
    deadline: "2026-03-31",
    requirements: ["Income criteria as per latest notification"],
    applicationUrl: "https://scholarships.gov.in/",
  },
];

const mockScholarshipApplications: ScholarshipApplication[] = [];
const mockNotifications: Notification[] = [];

export const mockDatabase = {
  users: [] as User[],
  questions: mockQuestions,
  answers: mockAnswers,
  replies: mockReplies,
  subjects: mockSubjects,
  scholarships: mockScholarships,
  scholarshipApplications: mockScholarshipApplications,
  notifications: mockNotifications,
  quizAttendance: mockQuizAttendance,
};

function toPublicUser(doc: any): User {
  const legacyId =
    typeof doc.legacyId === "number" && !Number.isNaN(doc.legacyId)
      ? doc.legacyId
      : Number.parseInt(String(doc._id).slice(-6), 16);

  return {
    id: legacyId,
    phone_number: doc.phone_number || "",
    name: doc.name,
    user_type: (doc.role || "student") as User["user_type"],
    preferred_language: doc.preferred_language || "en",
    location: doc.location || "",
    education_level: doc.education_level || "",
    created_at: new Date(doc.createdAt || Date.now()).toISOString(),
    updated_at: new Date(doc.updatedAt || Date.now()).toISOString(),
  };
}

async function nextLegacyId() {
  await connectDatabase();
  const latest = await UserModel.findOne({}, { legacyId: 1 })
    .sort({ legacyId: -1 })
    .lean();
  return (latest?.legacyId || 0) + 1;
}

async function nextModelLegacyId(model: any) {
  await connectDatabase();
  const latest = await model
    .findOne({}, { legacyId: 1 })
    .sort({ legacyId: -1 })
    .lean();
  return (latest?.legacyId || 0) + 1;
}

export async function createUser(
  userData: Omit<User, "id" | "created_at" | "updated_at"> & {
    password?: string;
    email?: string;
    roll_number?: string;
  }
): Promise<User> {
  await connectDatabase();
  const legacyId = await nextLegacyId();

  const email =
    userData.email ||
    (userData.phone_number
      ? `${userData.phone_number.replace(/\D/g, "")}@classless.local`
      : `user${legacyId}@classless.local`);

  const created = await UserModel.create({
    name: userData.name,
    email,
    password: userData.password || "",
    role: userData.user_type,
    assessmentCompleted: false,
    phone_number: userData.phone_number,
    roll_number: userData.roll_number || undefined,
    preferred_language: userData.preferred_language || "en",
    location: userData.location || "",
    education_level: userData.education_level || "",
    legacyId,
  });

  return toPublicUser(created);
}

export async function getUserByPhone(
  phone_number: string
): Promise<User | null> {
  await connectDatabase();
  const user = await UserModel.findOne({ phone_number }).lean();
  return user ? toPublicUser(user) : null;
}

export async function getAllUsers(): Promise<User[]> {
  await connectDatabase();
  const users = await UserModel.find({}).lean();
  return users.map(toPublicUser);
}

export async function createQuestion(
  questionData: Omit<Question, "id" | "created_at" | "status">
): Promise<Question> {
  const legacyId = await nextModelLegacyId(QuestionModel);
  const created = await QuestionModel.create({
    ...questionData,
    legacyId,
    status: "pending",
  });
  return {
    ...questionData,
    id: created.legacyId,
    status: created.status,
    created_at: new Date(created.created_at).toISOString(),
  };
}

export async function getQuestionById(id: number): Promise<Question | null> {
  await connectDatabase();
  const question = await QuestionModel.findOne({ legacyId: id }).lean();
  if (!question) return null;
  return {
    id: question.legacyId,
    user_id: question.user_id,
    question_text: question.question_text,
    question_type: question.question_type,
    image_url: question.image_url,
    audio_url: question.audio_url,
    language: question.language,
    response_language: question.response_language,
    status: question.status,
    created_at: new Date(question.created_at).toISOString(),
    subject_id: question.subject_id,
  } as Question;
}

export async function getQuestionsByUser(user_id: number): Promise<Question[]> {
  await connectDatabase();
  const rows = await QuestionModel.find({ user_id }).sort({ created_at: -1 }).lean();
  return rows.map((q: any) => ({
    id: q.legacyId,
    user_id: q.user_id,
    question_text: q.question_text,
    question_type: q.question_type,
    image_url: q.image_url,
    audio_url: q.audio_url,
    language: q.language,
    response_language: q.response_language,
    status: q.status,
    created_at: new Date(q.created_at).toISOString(),
    subject_id: q.subject_id,
  })) as Question[];
}

export async function getPendingQuestions(): Promise<Question[]> {
  await connectDatabase();
  const rows = await QuestionModel.find({ status: "pending" })
    .sort({ created_at: 1 })
    .lean();
  return rows.map((q: any) => ({
    id: q.legacyId,
    user_id: q.user_id,
    question_text: q.question_text,
    question_type: q.question_type,
    image_url: q.image_url,
    audio_url: q.audio_url,
    language: q.language,
    response_language: q.response_language,
    status: q.status,
    created_at: new Date(q.created_at).toISOString(),
    subject_id: q.subject_id,
  })) as Question[];
}

export async function createAnswer(
  answerData: Omit<Answer, "id" | "created_at" | "helpful_votes">
): Promise<Answer> {
  const legacyId = await nextModelLegacyId(AnswerModel);
  const created = await AnswerModel.create({
    ...answerData,
    legacyId,
    helpful_votes: 0,
  });
  await QuestionModel.updateOne(
    { legacyId: answerData.question_id },
    { $set: { status: "answered" } }
  );
  return {
    ...answerData,
    id: created.legacyId,
    helpful_votes: created.helpful_votes,
    created_at: new Date(created.created_at).toISOString(),
  };
}

export async function getRepliesByQuestion(
  question_id: number
): Promise<Reply[]> {
  await connectDatabase();
  const rows = await ReplyModel.find({ question_id }).sort({ created_at: 1 }).lean();
  return rows.map((r: any) => ({
    id: r.legacyId,
    question_id: r.question_id,
    user_id: r.user_id,
    text: r.text,
    created_at: new Date(r.created_at).toISOString(),
  })) as Reply[];
}

export async function createReply(
  replyData: Omit<Reply, "id" | "created_at">
): Promise<Reply> {
  const legacyId = await nextModelLegacyId(ReplyModel);
  const created = await ReplyModel.create({ ...replyData, legacyId });
  return {
    ...replyData,
    id: created.legacyId,
    created_at: new Date(created.created_at).toISOString(),
  };
}

export async function getAnswersByQuestion(
  question_id: number
): Promise<Answer[]> {
  await connectDatabase();
  const rows = await AnswerModel.find({ question_id }).sort({ created_at: 1 }).lean();
  return rows.map((a: any) => ({
    id: a.legacyId,
    question_id: a.question_id,
    answer_text: a.answer_text,
    answer_type: a.answer_type,
    teacher_id: a.teacher_id,
    confidence_score: a.confidence_score,
    helpful_votes: a.helpful_votes || 0,
    created_at: new Date(a.created_at).toISOString(),
  })) as Answer[];
}

export async function getAllSubjects(): Promise<Subject[]> {
  return mockSubjects;
}

export async function getSubjectById(id: number): Promise<Subject | null> {
  return mockSubjects.find((s) => s.id === id) || null;
}

export async function searchQuestions(
  query: string,
  subject_id?: number
): Promise<Question[]> {
  await connectDatabase();
  const filter: Record<string, any> = {
    question_text: { $regex: query, $options: "i" },
  };
  if (subject_id) filter.subject_id = subject_id;
  const rows = await QuestionModel.find(filter).sort({ created_at: -1 }).lean();
  return rows.map((q: any) => ({
    id: q.legacyId,
    user_id: q.user_id,
    question_text: q.question_text,
    question_type: q.question_type,
    image_url: q.image_url,
    audio_url: q.audio_url,
    language: q.language,
    response_language: q.response_language,
    status: q.status,
    created_at: new Date(q.created_at).toISOString(),
    subject_id: q.subject_id,
  })) as Question[];
}

export async function getRecentQuestions(limit = 10): Promise<Question[]> {
  await connectDatabase();
  const rows = await QuestionModel.find({}).sort({ created_at: -1 }).limit(limit).lean();
  return rows.map((q: any) => ({
    id: q.legacyId,
    user_id: q.user_id,
    question_text: q.question_text,
    question_type: q.question_type,
    image_url: q.image_url,
    audio_url: q.audio_url,
    language: q.language,
    response_language: q.response_language,
    status: q.status,
    created_at: new Date(q.created_at).toISOString(),
    subject_id: q.subject_id,
  })) as Question[];
}

export async function createQuizAttendance(
  attendanceData: Omit<QuizAttendance, "id">
): Promise<QuizAttendance> {
  const legacyId = await nextModelLegacyId(QuizAttendanceModel);
  const created = await QuizAttendanceModel.create({
    ...attendanceData,
    legacyId,
  });
  return { ...attendanceData, id: created.legacyId };
}

export async function getQuizAttendanceByStudent(
  student_id: number
): Promise<QuizAttendance[]> {
  await connectDatabase();
  const rows = await QuizAttendanceModel.find({ student_id }).lean();
  return rows.map((r: any) => ({
    id: r.legacyId,
    student_id: r.student_id,
    quiz_id: r.quiz_id,
    subject: r.subject,
    level: r.level,
    attended_at: r.attended_at,
    completed_at: r.completed_at,
    status: r.status,
    score: r.score,
    total_questions: r.total_questions,
    completion_time: r.completion_time,
  })) as QuizAttendance[];
}

export async function updateQuizAttendance(
  id: number,
  updates: Partial<
    Pick<
      QuizAttendance,
      | "status"
      | "completed_at"
      | "score"
      | "total_questions"
      | "completion_time"
    >
  >
): Promise<QuizAttendance | null> {
  await connectDatabase();
  const attendance = await QuizAttendanceModel.findOne({ legacyId: id });
  if (!attendance) return null;
  Object.assign(attendance, updates);
  await attendance.save();
  return {
    id: attendance.legacyId,
    student_id: attendance.student_id,
    quiz_id: attendance.quiz_id,
    subject: attendance.subject,
    level: attendance.level,
    attended_at: attendance.attended_at,
    completed_at: attendance.completed_at,
    status: attendance.status,
    score: attendance.score,
    total_questions: attendance.total_questions,
    completion_time: attendance.completion_time,
  } as QuizAttendance;
}

export async function getQuizAttendanceById(
  id: number
): Promise<QuizAttendance | null> {
  await connectDatabase();
  const attendance = await QuizAttendanceModel.findOne({ legacyId: id }).lean();
  if (!attendance) return null;
  return {
    id: attendance.legacyId,
    student_id: attendance.student_id,
    quiz_id: attendance.quiz_id,
    subject: attendance.subject,
    level: attendance.level,
    attended_at: attendance.attended_at,
    completed_at: attendance.completed_at,
    status: attendance.status,
    score: attendance.score,
    total_questions: attendance.total_questions,
    completion_time: attendance.completion_time,
  } as QuizAttendance;
}
