import { GET as getLatestResumeAnalysis } from "../upload/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export const GET = getLatestResumeAnalysis;
