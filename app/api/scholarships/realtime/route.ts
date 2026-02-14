import { NextRequest, NextResponse } from "next/server";
import { realtimeUpdateService } from "@/lib/realtime-updates";
import { realtimeScholarshipAggregator } from "@/lib/realtime-scholarship-sources";

// GET /api/scholarships/realtime - Get real-time scholarship updates
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state");
  const since = searchParams.get("since");
  const type = searchParams.get("type"); // 'sse' for Server-Sent Events, 'json' for JSON response

  try {
    if (type === "sse") {
      // Server-Sent Events endpoint
      return new NextResponse(
        new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();

            // Send initial connection message
            const initialMessage = `data: ${JSON.stringify({
              type: "system_status",
              data: {
                status: "connected",
                message: "Real-time scholarship updates enabled",
              },
              timestamp: new Date().toISOString(),
            })}\n\n`;
            controller.enqueue(encoder.encode(initialMessage));

            // Send current scholarships
            realtimeScholarshipAggregator
              .fetchAllScholarships(state || undefined)
              .then((scholarships) => {
                const scholarshipsMessage = `data: ${JSON.stringify({
                  type: "initial_data",
                  data: { scholarships, count: scholarships.length },
                  timestamp: new Date().toISOString(),
                })}\n\n`;
                controller.enqueue(encoder.encode(scholarshipsMessage));
              })
              .catch((error) => {
                console.error("Error fetching initial scholarships:", error);
              });

            // Set up periodic updates
            const updateInterval = setInterval(async () => {
              try {
                const updates =
                  await realtimeScholarshipAggregator.getScholarshipUpdates(
                    since || undefined
                  );

                if (updates.length > 0) {
                  for (const update of updates) {
                    const message = `data: ${JSON.stringify({
                      type: "scholarship_update",
                      data: update,
                      timestamp: update.timestamp,
                    })}\n\n`;
                    controller.enqueue(encoder.encode(message));
                  }
                }
              } catch (error) {
                console.error("Error in SSE update loop:", error);
              }
            }, 2 * 60 * 1000); // Check every 2 minutes

            // Cleanup on close
            request.signal.addEventListener("abort", () => {
              clearInterval(updateInterval);
              controller.close();
            });
          },
        }),
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control",
          },
        }
      );
    } else {
      // Regular JSON response
      const scholarships =
        await realtimeScholarshipAggregator.fetchAllScholarships(
          state || undefined
        );
      const updates = since
        ? await realtimeScholarshipAggregator.getScholarshipUpdates(since)
        : [];

      return NextResponse.json({
        scholarships,
        updates,
        lastUpdated: new Date().toISOString(),
        count: scholarships.length,
        updateCount: updates.length,
      });
    }
  } catch (error) {
    console.error("Error in real-time scholarships API:", error);
    return NextResponse.json(
      { error: "Failed to fetch real-time scholarships" },
      { status: 500 }
    );
  }
}

// POST /api/scholarships/realtime - Trigger manual update
export async function POST(request: NextRequest) {
  try {
    const { state, forceRefresh } = await request.json();

    // Force refresh the cache
    if (forceRefresh) {
      // Clear cache and fetch fresh data
      const scholarships =
        await realtimeScholarshipAggregator.fetchAllScholarships(state);
      const updates =
        await realtimeScholarshipAggregator.getScholarshipUpdates();

      return NextResponse.json({
        scholarships,
        updates,
        lastUpdated: new Date().toISOString(),
        count: scholarships.length,
        updateCount: updates.length,
        refreshed: true,
      });
    }

    // Regular update
    const scholarships =
      await realtimeScholarshipAggregator.fetchAllScholarships(state);
    return NextResponse.json({
      scholarships,
      lastUpdated: new Date().toISOString(),
      count: scholarships.length,
    });
  } catch (error) {
    console.error("Error in real-time scholarships POST:", error);
    return NextResponse.json(
      { error: "Failed to update scholarships" },
      { status: 500 }
    );
  }
}
