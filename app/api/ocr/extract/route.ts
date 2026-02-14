import { type NextRequest, NextResponse } from "next/server"
import { ocrService } from "@/lib/ocr-service"
import type { OCRResult } from "@/lib/ocr-service"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Debug: Log all form data keys
    console.log("[OCR API] Form data keys:", Array.from(formData.keys()))
    
    const imageFile = formData.get("image") as File
    const language = (formData.get("language") as string) || "en"
    const enhanceImage = formData.get("enhance") === "true"

    console.log("[OCR API] Image file received:", imageFile)
    console.log("[OCR API] Image file type:", imageFile?.type)
    console.log("[OCR API] Image file size:", imageFile?.size)
    console.log("[OCR API] Image file name:", imageFile?.name)

    if (!imageFile) {
      return NextResponse.json(
        {
          success: false,
          error: "No image file provided",
        },
        { status: 400 },
      )
    }

    // Validate file type
    if (!imageFile.type || !imageFile.type.startsWith("image/")) {
      console.log("[OCR API] Invalid file type:", imageFile.type)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Please upload an image.",
        },
        { status: 400 },
      )
    }

    // Validate file size (max 10MB)
    if (!imageFile.size || imageFile.size > 10 * 1024 * 1024) {
      console.log("[OCR API] Invalid file size:", imageFile.size)
      return NextResponse.json(
        {
          success: false,
          error: "File too large. Maximum size is 10MB.",
        },
        { status: 400 },
      )
    }

    console.log(`[OCR] Processing image: ${imageFile.name}, Language: ${language}`)

    // Extract text from image
    const ocrResult: OCRResult = await ocrService.extractTextFromImage(imageFile, language, {
      enhanceContrast: enhanceImage,
      removeNoise: enhanceImage,
      correctSkew: enhanceImage,
      binarize: enhanceImage,
    })

    // Validate OCR result
    const validation = ocrService.validateOCRResult(ocrResult)

    // Auto-detect language if not specified or if detection differs
    const detectedLanguage = await ocrService.detectLanguage(ocrResult.text)
    if (detectedLanguage !== language) {
      console.log(`[OCR] Language mismatch: expected ${language}, detected ${detectedLanguage}`)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...ocrResult,
        detectedLanguage,
        validation,
      },
      message: validation.isValid ? "Text extracted successfully" : "Text extracted with warnings",
    })
  } catch (error) {
    console.error("OCR extraction error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to extract text from image",
      },
      { status: 500 },
    )
  }
}
