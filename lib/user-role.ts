import "server-only";
import { AssessmentModel } from "@/server/models/Assessment";
import { CareerProgressModel } from "@/server/models/CareerProgress";
import { RoadmapModel } from "@/server/models/Roadmap";

function cleanRole(value: unknown) {
  return String(value || "").trim();
}

function normalizeRole(value: string) {
  return cleanRole(value)
    .toLowerCase()
    .replace(/[^\w\s/+.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function areRolesSame(a: string, b: string) {
  if (!a || !b) return false;
  return normalizeRole(a) === normalizeRole(b);
}

export async function resolveSelectedRoleForUser(input: {
  userId: string;
  userDoc?: { selectedRole?: string } | null;
}) {
  const profileRole = cleanRole(input.userDoc?.selectedRole);
  if (profileRole) return profileRole;

  const roadmap: any = await RoadmapModel.findOne({ userId: input.userId }).lean();
  const roadmapRole = cleanRole(roadmap?.targetRole || roadmap?.careerTitle);
  if (roadmapRole) return roadmapRole;

  const assessment: any = await AssessmentModel.findOne({ userId: input.userId }).lean();
  const assessmentRole = cleanRole(assessment?.suggestedCareer);
  if (assessmentRole) return assessmentRole;

  const progress: any = await CareerProgressModel.findOne(
    { userId: input.userId },
    { selectedRole: 1 }
  ).lean();
  const progressRole = cleanRole(progress?.selectedRole);
  if (progressRole) return progressRole;

  return "";
}
