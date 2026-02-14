import { type NextRequest, NextResponse } from "next/server";
import { contentManagementService } from "@/lib/content-management-service";

// GET - Search and retrieve content
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("query") || "";
    const grade = searchParams.get("grade")
      ? parseInt(searchParams.get("grade")!)
      : undefined;
    const subject = searchParams.get("subject") || undefined;
    const chapter = searchParams.get("chapter") || undefined;
    const topic = searchParams.get("topic") || undefined;
    const difficulty = searchParams.get("difficulty") || undefined;
    const tags = searchParams.get("tags")?.split(",") || undefined;
    const topK = parseInt(searchParams.get("topK") || "10");

    await contentManagementService.initialize();

    const results = await contentManagementService.searchContent(
      query,
      {
        grade,
        subject,
        chapter,
        topic,
        difficulty,
        tags,
      },
      topK
    );

    return NextResponse.json({
      success: true,
      data: {
        results,
        count: results.length,
        query: {
          query,
          grade,
          subject,
          chapter,
          topic,
          difficulty,
          tags,
          topK,
        },
      },
    });
  } catch (error) {
    console.error("[Content API] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search content" },
      { status: 500 }
    );
  }
}

// POST - Add new content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, metadata, id } = body;

    if (!text || !metadata) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: text and metadata" },
        { status: 400 }
      );
    }

    await contentManagementService.initialize();

    // Validate metadata
    const validation =
      contentManagementService.validateContentMetadata(metadata);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid metadata",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const contentId = await contentManagementService.addContent(
      text,
      metadata,
      id
    );

    return NextResponse.json({
      success: true,
      data: {
        id: contentId,
        message: "Content added successfully",
      },
    });
  } catch (error) {
    console.error("[Content API] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add content" },
      { status: 500 }
    );
  }
}

// PUT - Update existing content
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, text, metadata } = body;

    if (!id || !text || !metadata) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: id, text, and metadata",
        },
        { status: 400 }
      );
    }

    await contentManagementService.initialize();

    // Validate metadata
    const validation =
      contentManagementService.validateContentMetadata(metadata);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid metadata",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    await contentManagementService.updateContent(id, text, metadata);

    return NextResponse.json({
      success: true,
      data: {
        id,
        message: "Content updated successfully",
      },
    });
  } catch (error) {
    console.error("[Content API] PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update content" },
      { status: 500 }
    );
  }
}

// DELETE - Delete content
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing required parameter: id" },
        { status: 400 }
      );
    }

    await contentManagementService.initialize();
    await contentManagementService.deleteContent(id);

    return NextResponse.json({
      success: true,
      data: {
        id,
        message: "Content deleted successfully",
      },
    });
  } catch (error) {
    console.error("[Content API] DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete content" },
      { status: 500 }
    );
  }
}
