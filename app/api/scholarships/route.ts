import { type NextRequest, NextResponse } from "next/server";
import { mockDatabase } from "@/lib/database";
import { fetchLiveScholarships } from "@/lib/scholarship-fetcher";
import { realtimeScholarshipAggregator } from "@/lib/realtime-scholarship-sources";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const state = searchParams.get("state");
  const grade = searchParams.get("grade");
  const realtime = searchParams.get("realtime") === "true";

  try {
    let scholarships = [] as typeof mockDatabase.scholarships;
    let source = "none";

    // Always try real-time scholarship aggregator first
    try {
      const realtimeScholarships =
        await realtimeScholarshipAggregator.fetchAllScholarships(
          state || undefined
        );

      if (realtimeScholarships.length > 0) {
        // Convert RealtimeScholarship to Scholarship format
        scholarships = realtimeScholarships.map((rt) => ({
          id: rt.id,
          name: rt.name,
          provider: rt.provider,
          amount: rt.amount,
          category: rt.category,
          description: rt.description,
          eligibleStates: rt.eligibleStates,
          minGrade: rt.minGrade,
          maxGrade: rt.maxGrade,
          deadline: rt.deadline,
          requirements: rt.requirements,
          applicationUrl: rt.applicationUrl,
        }));
        source = "realtime";
        console.log(
          `[Scholarships] Found ${scholarships.length} real-time scholarships`
        );
      }
    } catch (e) {
      console.error("[Scholarships] Real-time fetch failed:", e);
    }

    // If no real-time data, try live fetch as secondary option
    if (scholarships.length === 0) {
      try {
        const live = await fetchLiveScholarships({
          state: state || undefined,
          category: category || undefined,
        });
        if (Array.isArray(live) && live.length > 0) {
          scholarships = live;
          source = "live";
          console.log(
            `[Scholarships] Found ${scholarships.length} live scholarships`
          );
        }
      } catch (e) {
        console.error("[Scholarships] Live fetch failed:", e);
      }
    }

    // Filter scholarships based on criteria
    if (category) {
      scholarships = scholarships.filter((s) => s.category === category);
    }
    if (state) {
      scholarships = scholarships.filter(
        (s) =>
          s.eligibleStates.includes(state) || s.eligibleStates.includes("All")
      );
    }
    if (grade) {
      const gradeNum = Number.parseInt(grade);
      scholarships = scholarships.filter(
        (s) => gradeNum >= s.minGrade && gradeNum <= s.maxGrade
      );
    }

    return NextResponse.json({
      scholarships,
      source,
      lastUpdated: new Date().toISOString(),
      count: scholarships.length,
      isRealtimeOnly: true, // Flag to indicate we're only showing real-time data
    });
  } catch (error) {
    console.error("[Scholarships] API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch real-time scholarships",
        scholarships: [],
        source: "error",
        count: 0,
        isRealtimeOnly: true,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, scholarshipId } = body;

    // Create application record
    const application = {
      id: Date.now().toString(),
      userId,
      scholarshipId,
      status: "applied",
      appliedAt: new Date().toISOString(),
      documents: [],
    };

    mockDatabase.scholarshipApplications.push(application);

    return NextResponse.json({
      success: true,
      applicationId: application.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to apply for scholarship" },
      { status: 500 }
    );
  }
}
