import "server-only";
// Image Generation Service for Classless - Using Google Gemini AI
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ImageGenerationRequest {
  prompt: string;
  style?:
    | "realistic"
    | "artistic"
    | "cartoon"
    | "sketch"
    | "watercolor"
    | "oil_painting"
    | "digital_art"
    | "minimalist";
  size?: "512x512" | "1024x1024" | "1024x1792" | "1792x1024";
  quality?: "standard" | "hd";
}

export interface ImageGenerationResponse {
  success: boolean;
  image?: {
    data: string; // Base64 encoded image data
    mimeType: string;
  };
  error?: string;
  metadata?: {
    prompt: string;
    style: string;
    size: string;
    timestamp: string;
    model: string;
  };
}

export class ImageGenerationService {
  private isMockMode = false;
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    // Check if we have the required API key
    const apiKey = process.env.GEMINI_API_KEY;
    console.log(
      "[Image Generation Service] API Key found:",
      apiKey ? "YES" : "NO"
    );

    this.isMockMode = !apiKey || apiKey === "your-gemini-api-key-here";
    if (this.isMockMode) {
      console.warn(
        "[Image Generation Service] Running in mock mode - GEMINI_API_KEY not found or invalid"
      );
    } else {
      console.log(
        "[Image Generation Service] Initializing Gemini AI with API key..."
      );
      this.genAI = new GoogleGenerativeAI(apiKey!);
      console.log(
        "[Image Generation Service] Gemini AI initialized successfully!"
      );
    }
  }

  async generateImage(
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    console.log(
      "[Image Generation Service] Processing request:",
      request.prompt
    );
    console.log("[Image Generation Service] Mock mode:", this.isMockMode);

    // If in mock mode, return mock response
    if (this.isMockMode) {
      console.log(
        "[Image Generation Service] Returning mock response due to mock mode"
      );
      return this.getMockResponse(request);
    }

    try {
      if (!this.genAI) {
        throw new Error("Gemini AI not initialized");
      }

      // Try different models for image generation
      const modelsToTry = [
        "gemini-2.5-flash-image-preview",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
      ];

      let generatedImage = null;
      let usedModel = "";

      for (const modelName of modelsToTry) {
        try {
          console.log(`[Image Generation Service] Trying model: ${modelName}`);

          const model = this.genAI.getGenerativeModel({ model: modelName });

          // Enhanced prompt based on style
          const enhancedPrompt = this.enhancePromptForStyle(
            request.prompt,
            request.style || "realistic"
          );

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
                usedModel = modelName;
                break;
              }
            }
          }

          if (generatedImage) {
            console.log(
              `[Image Generation Service] Success with model: ${modelName}`
            );
            break;
          }
        } catch (error: any) {
          console.error(
            `[Image Generation Service] Model ${modelName} failed:`,
            error.message
          );

          // If it's a model not found error, try next model
          if (error.message && error.message.includes("not found")) {
            continue;
          }

          // If it's a rate limit or quota error, break and return error
          if (
            error.message &&
            (error.message.includes("429") || error.message.includes("quota"))
          ) {
            throw error;
          }
        }
      }

      if (!generatedImage) {
        throw new Error("No model was able to generate an image");
      }

      console.log("[Image Generation Service] Image generated successfully!");

      return {
        success: true,
        image: generatedImage,
        metadata: {
          prompt: request.prompt,
          style: request.style || "realistic",
          size: request.size || "1024x1024",
          timestamp: new Date().toISOString(),
          model: usedModel,
        },
      };
    } catch (error: any) {
      console.error(
        "[Image Generation Service] Error generating image:",
        error
      );

      // Return appropriate error message
      if (error.message && error.message.includes("429")) {
        return {
          success: false,
          error:
            "Rate limit exceeded. Please try again later or upgrade your Gemini API plan.",
        };
      }

      return {
        success: false,
        error: "Image generation failed. Please try again or contact support.",
      };
    }
  }

  private enhancePromptForStyle(prompt: string, style: string): string {
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

  private getMockResponse(
    request: ImageGenerationRequest
  ): ImageGenerationResponse {
    // Create a more realistic mock image based on the prompt
    const mockImageData = this.createMockImageForPrompt(request.prompt);

    return {
      success: true,
      image: {
        data: mockImageData,
        mimeType: "image/svg+xml",
      },
      metadata: {
        prompt: request.prompt,
        style: request.style || "realistic",
        size: request.size || "1024x1024",
        timestamp: new Date().toISOString(),
        model: "mock",
      },
    };
  }

  private createMockImageForPrompt(prompt: string): string {
    // Create a more contextual mock image based on the prompt
    const promptLower = prompt.toLowerCase();

    let emoji = "🖼️";
    let title = "Generated Image";
    let description = "Mock Mode";

    if (promptLower.includes("cat")) {
      emoji = "🐱";
      title = "Cat Image";
      description = "Mock Cat";
    } else if (promptLower.includes("dog")) {
      emoji = "🐶";
      title = "Dog Image";
      description = "Mock Dog";
    } else if (
      promptLower.includes("sunset") ||
      promptLower.includes("sunrise")
    ) {
      emoji = "🌅";
      title = "Sunset Image";
      description = "Mock Sunset";
    } else if (promptLower.includes("robot")) {
      emoji = "🤖";
      title = "Robot Image";
      description = "Mock Robot";
    } else if (promptLower.includes("flower") || promptLower.includes("rose")) {
      emoji = "🌸";
      title = "Flower Image";
      description = "Mock Flower";
    } else if (promptLower.includes("car") || promptLower.includes("vehicle")) {
      emoji = "🚗";
      title = "Car Image";
      description = "Mock Car";
    } else if (promptLower.includes("house") || promptLower.includes("home")) {
      emoji = "🏠";
      title = "House Image";
      description = "Mock House";
    } else if (promptLower.includes("tree") || promptLower.includes("forest")) {
      emoji = "🌳";
      title = "Tree Image";
      description = "Mock Tree";
    }

    // Create SVG with the appropriate emoji and styling
    const svgContent = `
      <svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="1024" height="1024" fill="#F3F4F6"/>
        <rect x="64" y="64" width="896" height="896" rx="16" fill="white" stroke="#E5E7EB" stroke-width="2"/>
        <text x="512" y="400" font-family="Arial, sans-serif" font-size="120" fill="#374151" text-anchor="middle" dy=".3em">${emoji}</text>
        <text x="512" y="520" font-family="Arial, sans-serif" font-size="32" fill="#6B7280" text-anchor="middle" dy=".3em">${title}</text>
        <text x="512" y="580" font-family="Arial, sans-serif" font-size="20" fill="#9CA3AF" text-anchor="middle" dy=".3em">${description}</text>
        <text x="512" y="650" font-family="Arial, sans-serif" font-size="16" fill="#9CA3AF" text-anchor="middle" dy=".3em">API Rate Limit Exceeded</text>
        <text x="512" y="680" font-family="Arial, sans-serif" font-size="14" fill="#9CA3AF" text-anchor="middle" dy=".3em">Try again later or upgrade your plan</text>
      </svg>
    `;

    return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString(
      "base64"
    )}`;
  }

  // Method to detect if a question is asking for image generation
  static isImageGenerationRequest(question: string): boolean {
    const imageKeywords = [
      "generate image",
      "create image",
      "draw",
      "picture",
      "photo",
      "illustration",
      "visual",
      "diagram",
      "chart",
      "graph",
      "sketch",
      "painting",
      "artwork",
      "show me",
      "can you show",
      "make a",
      "create a",
      "generate a",
    ];

    const questionLower = question.toLowerCase();
    return imageKeywords.some((keyword) => questionLower.includes(keyword));
  }

  // Method to extract image generation prompt from question
  static extractImagePrompt(question: string): string {
    // Remove common question prefixes
    const prefixes = [
      "generate an image of",
      "create an image of",
      "draw",
      "show me",
      "can you show",
      "make a",
      "create a",
      "generate a",
      "i want to see",
      "i need an image of",
    ];

    let prompt = question.toLowerCase();

    for (const prefix of prefixes) {
      if (prompt.includes(prefix)) {
        prompt = prompt.replace(prefix, "").trim();
        break;
      }
    }

    // Clean up the prompt
    prompt = prompt.replace(/[?.,!]+$/, "").trim();

    return prompt || question;
  }
}

// Singleton instance
export const imageGenerationService = new ImageGenerationService();
