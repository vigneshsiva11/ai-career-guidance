import { type NextRequest, NextResponse } from "next/server";
import { contentManagementService } from "@/lib/content-management-service";

// GET - Get content statistics and management info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "stats";

    await contentManagementService.initialize();

    switch (action) {
      case "stats":
        const stats = await contentManagementService.getContentStatistics();
        return NextResponse.json({
          success: true,
          data: {
            statistics: stats,
            availableSubjects: contentManagementService.getAvailableSubjects(),
            availableGrades: contentManagementService.getAvailableGrades(),
          },
        });

      case "suggestions":
        const grade = searchParams.get("grade")
          ? parseInt(searchParams.get("grade")!)
          : undefined;
        const subject = searchParams.get("subject") || undefined;

        if (!grade || !subject) {
          return NextResponse.json(
            {
              success: false,
              error: "Missing required parameters: grade and subject",
            },
            { status: 400 }
          );
        }

        const suggestions =
          await contentManagementService.getContentSuggestions(grade, subject);
        return NextResponse.json({
          success: true,
          data: suggestions,
        });

      case "export":
        const exportFilters = {
          grade: searchParams.get("grade")
            ? parseInt(searchParams.get("grade")!)
            : undefined,
          subject: searchParams.get("subject") || undefined,
          chapter: searchParams.get("chapter") || undefined,
          topic: searchParams.get("topic") || undefined,
          difficulty: searchParams.get("difficulty") || undefined,
          tags: searchParams.get("tags")?.split(",") || undefined,
        };

        const exportedContent = await contentManagementService.exportContent(
          exportFilters
        );
        return NextResponse.json({
          success: true,
          data: {
            content: exportedContent,
            count: exportedContent.length,
            filters: exportFilters,
          },
        });

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[Content Management API] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// POST - Initialize or manage content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    await contentManagementService.initialize();

    switch (action) {
      case "initialize":
        await contentManagementService.initializeWithDefaultContent();
        return NextResponse.json({
          success: true,
          data: {
            message: "Content initialized with default educational content",
          },
        });

      case "initialize-syllabus":
        const { board, language } = body || {};
        await contentManagementService.initializeWithSyllabus({
          board,
          language,
        });
        return NextResponse.json({
          success: true,
          data: {
            message: "Syllabus (Classes 1-12) initialized successfully",
          },
        });

      case "clear":
        await contentManagementService.clearAllContent();
        return NextResponse.json({
          success: true,
          data: {
            message: "All content cleared successfully",
          },
        });

      case "import":
        const { content } = body;
        if (!content || !Array.isArray(content)) {
          return NextResponse.json(
            { success: false, error: "Missing or invalid content array" },
            { status: 400 }
          );
        }

        await contentManagementService.importContent(content);
        return NextResponse.json({
          success: true,
          data: {
            message: `Imported ${content.length} content pieces successfully`,
            count: content.length,
          },
        });

      case "batch-add":
        const { contents } = body;
        if (!contents || !Array.isArray(contents)) {
          return NextResponse.json(
            { success: false, error: "Missing or invalid contents array" },
            { status: 400 }
          );
        }

        const ids = await contentManagementService.addMultipleContent(contents);
        return NextResponse.json({
          success: true,
          data: {
            message: `Added ${ids.length} content pieces successfully`,
            ids,
            count: ids.length,
          },
        });

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[Content Management API] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
