import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      style = "realistic",
      size = "1024x1024",
    } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your-gemini-api-key-here") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file.",
        },
        { status: 500 }
      );
    }

    console.log(
      "[Image Generation] Starting image generation for prompt:",
      prompt
    );
    console.log("[Image Generation] Style:", style, "Size:", size);

    const genAI = new GoogleGenerativeAI(apiKey);

    // Try different models for image generation
    const modelsToTry = [
      "gemini-2.5-flash-image-preview",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ];

    let generatedImage = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[Image Generation] Trying model: ${modelName}`);

        const model = genAI.getGenerativeModel({ model: modelName });

        // Enhanced prompt based on style
        const enhancedPrompt = enhancePromptForStyle(prompt, style);

        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: enhancedPrompt }],
            },
          ],
        });

        const response = await result.response;

        // Check if response contains image data
        if (
          response.candidates &&
          response.candidates[0] &&
          response.candidates[0].content
        ) {
          const parts = response.candidates[0].content.parts;

          for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
              generatedImage = {
                data: part.inlineData.data,
                mimeType: part.inlineData.mimeType || "image/png",
              };
              break;
            }
          }
        }

        if (generatedImage) {
          console.log(`[Image Generation] Success with model: ${modelName}`);
          break;
        }
      } catch (error: any) {
        console.error(
          `[Image Generation] Model ${modelName} failed:`,
          error.message
        );
        lastError = error;

        // If it's a model not found error, try next model
        if (error.message && error.message.includes("not found")) {
          continue;
        }

        // If it's a rate limit or quota error, break and return error
        if (
          error.message &&
          (error.message.includes("429") || error.message.includes("quota"))
        ) {
          break;
        }
      }
    }

    if (!generatedImage) {
      console.error("[Image Generation] All models failed:", lastError);

      // Return a helpful error message
      if (lastError && lastError.message && lastError.message.includes("429")) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Rate limit exceeded. Please try again later or upgrade your Gemini API plan.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error:
            "Image generation failed. The requested model may not support image generation or there was a technical issue.",
        },
        { status: 500 }
      );
    }

    console.log("[Image Generation] Image generated successfully!");

    return NextResponse.json({
      success: true,
      data: {
        image: generatedImage.data,
        mimeType: generatedImage.mimeType,
        prompt: prompt,
        style: style,
        size: size,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[Image Generation] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during image generation",
      },
      { status: 500 }
    );
  }
}

function enhancePromptForStyle(prompt: string, style: string): string {
  const styleEnhancements: { [key: string]: string } = {
    realistic: "Create a photorealistic, high-quality image",
    artistic: "Create an artistic, creative interpretation",
    cartoon: "Create a cartoon-style, animated image",
    sketch: "Create a pencil sketch or line drawing",
    watercolor: "Create a watercolor painting style",
    oil_painting: "Create an oil painting style",
    digital_art: "Create a digital art style",
    minimalist: "Create a minimalist, clean design",
  };

  const enhancement = styleEnhancements[style] || styleEnhancements.realistic;

  return `${enhancement} of: ${prompt}. Make it high resolution and visually appealing.`;
}
