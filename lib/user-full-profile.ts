export type SkillLevel = "Beginner" | "Intermediate" | "Advanced";

export type ProgressTrackerSnapshot = {
  selectedRole: string;
  hasSelectedRole: boolean;
  roleSkills: string[];
  radarSkills?: string[];
  requiredSkills?: string[];
  completedSkills?: string[];
  completedSteps?: string[];
  completedTasks?: string[];
  totalTasks?: number;
  completedTaskCount?: number;
  careerScore?: number;
  skillCoverage?: number;
  roadmapProgress?: {
    beginnerCompleted: boolean;
    intermediateCompleted: boolean;
    advancedCompleted: boolean;
  };
  profile: {
    educationLevel: string;
    fieldOfStudy: string;
    experienceLevel: string;
    learningGoal: string;
    skillLevels: Record<string, SkillLevel>;
  };
  analysis: {
    strongSkills: string[];
    weakSkills: string[];
    missingSkills: string[];
    recommendedSkills: string[];
    recommendedActions: string[];
    metrics: {
      domainExpertise: number;
      practicalExposure: number;
      communication: number;
      executionDiscipline: number;
    };
    generatedAt: string | null;
    source: string;
  } | null;
};

export type UserProgressSnapshot = {
  userId: string;
  selectedRole: string;
  requiredSkills: string[];
  profileSkills: Record<string, SkillLevel>;
  completedSkills: string[];
  completedSteps: string[];
  completedTasks: string[];
  totalTasks: number;
  completedTaskCount: number;
  careerScore: number;
  skillCoverage: number;
  stageProgress: {
    beginner: "not-started" | "in-progress" | "completed";
    intermediate: "not-started" | "in-progress" | "completed";
    advanced: "not-started" | "in-progress" | "completed";
  };
  roadmapProgress: {
    beginnerCompleted: boolean;
    intermediateCompleted: boolean;
    advancedCompleted: boolean;
  };
};

export type RoadmapSnapshot = {
  assessmentCompleted: boolean;
  assessmentStarted: boolean;
  assessmentStep: number;
  totalQuestions: number;
  answers?: Array<{ question: string; answer: string }>;
  conversationHistory?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  result?: {
    strengthProfile: string;
    careerPersona: string;
    suggestedCareerPath: string;
    roadmap: {
      beginner: string[];
      intermediate: string[];
      advanced: string[];
    };
    requiredSkills?: {
      core: string[];
      advanced: string[];
      industry: string[];
    };
    tools?: Array<{
      name: string;
      description: string;
      youtubePlaylist: string;
    }>;
    estimatedTimeline?: string;
    toolsToLearn?: string[];
    certifications?: string[];
    realWorldProjects?: string[];
    portfolioRequirements?: string[];
    interviewPreparationTopics?: string[];
    requiredTechnicalSkills?: string[];
    requiredSoftSkills?: string[];
    internshipStrategy?: string[];
    freelancingStrategy?: string[];
    salaryInsight?: string;
    jobPlatformsToApply?: string[];
    resumeTips?: string[];
    jobReadyChecklist?: string[];
    skillGapPreview?: Array<{ skill: string; gap: number }>;
    source?: string;
  };
  updatedAt?: string | null;
};

export type FullProfileUser = {
  id: string;
  legacyId: number | null;
  name: string;
  email?: string;
  role: string;
  assessmentCompleted: boolean;
  lastLoginAt: string | null;
};

export type FullProfilePayload = {
  user: FullProfileUser;
  selectedRole: string;
  progressTracker: ProgressTrackerSnapshot;
  userProgress: UserProgressSnapshot;
  roadmap: RoadmapSnapshot | null;
  cachedAt: string;
};
