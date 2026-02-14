// TypeScript types for Classless AI Tutor platform

export interface User {
  id: number;
  phone_number: string;
  name: string;
  user_type: "student" | "teacher" | "admin";
  preferred_language: string;
  location?: string;
  education_level?: string;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
  education_level?: string;
  created_at: string;
}

export interface Question {
  id: number;
  user_id: number;
  question_text: string;
  question_type: "text" | "image" | "voice";
  image_url?: string;
  audio_url?: string;
  language: string;
  response_language: string;
  status: "pending" | "answered" | "escalated";
  created_at: string;
  user?: User;
  answers?: Answer[];
}

export interface Answer {
  id: number;
  question_id: number;
  answer_text: string;
  answer_type: "ai" | "teacher" | "peer";
  teacher_id?: number;
  confidence_score?: number;
  helpful_votes: number;
  created_at: string;
  teacher?: User;
}

export interface Reply {
  id: number;
  question_id: number;
  user_id: number;
  text: string;
  created_at: string;
}

export interface LearningSession {
  id: number;
  user_id: number;
  session_type: "web" | "sms" | "ivr" | "station";
  questions_asked: number;
  questions_answered: number;
  duration_minutes?: number;
  started_at: string;
  ended_at?: string;
}

export interface QuizAttendance {
  id: number;
  student_id: number;
  quiz_id: string;
  subject: string;
  level: string;
  attended_at: string;
  completed_at?: string;
  status: "attended" | "completed" | "abandoned";
  score?: number;
  total_questions?: number;
  completion_time?: number;
}

export interface Scholarship {
  id: number;
  title: string;
  description?: string;
  eligibility_criteria?: string;
  amount?: number;
  deadline?: string;
  application_url?: string;
  target_audience?: string;
  location?: string;
  is_active: boolean;
  created_at: string;
}

export interface LearningStation {
  id: number;
  name: string;
  location: string;
  contact_person?: string;
  contact_phone?: string;
  operating_hours?: string;
  available_subjects: string[];
  is_active: boolean;
  created_at: string;
}

export interface InteractionLog {
  id: number;
  user_id: number;
  interaction_type: "sms" | "ivr" | "web";
  message_content?: string;
  response_content?: string;
  session_id?: string;
  created_at: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Request types
export interface CreateQuestionRequest {
  question_text: string;
  subject_id: number;
  question_type?: "text" | "image" | "voice";
  image_url?: string;
  audio_url?: string;
  language?: string;
  difficulty_level?: string;
}

export interface CreateUserRequest {
  phone_number: string;
  name: string;
  user_type: "student" | "teacher";
  roll_number?: string;
  preferred_language?: string;
  location?: string;
  education_level?: string;
}

export interface SMSRequest {
  phone_number: string;
  message: string;
}

export interface IVRRequest {
  phone_number: string;
  audio_content?: string;
  session_id?: string;
}
