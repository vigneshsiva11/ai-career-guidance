"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Camera,
  Upload,
  FileImage,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Download,
  Copy,
  X,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import type { OCRResult } from "@/lib/ocr-service"

export default function OCRDemoPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [enhanceImage, setEnhanceImage] = useState(true)
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const supportedLanguages = {
    en: "English",
    hi: "Hindi (हिंदी)",
    pa: "Punjabi (ਪੰਜਾਬੀ)",
    bn: "Bengali (বাংলা)",
    ta: "Tamil (தமிழ்)",
    te: "Telugu (తెలుగు)",
    mr: "Marathi (मराठी)",
    gu: "Gujarati (ગુજરાતી)",
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file")
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 10MB.")
        return
      }

      setSelectedImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Reset previous results
      setOcrResult(null)
    }
  }

  const handleProcessOCR = async () => {
    if (!selectedImage) return

    setIsProcessing(true)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 200)

    try {
      const formData = new FormData()
      formData.append("image", selectedImage)
      formData.append("language", selectedLanguage)
      formData.append("enhance", enhanceImage.toString())

      const response = await fetch("/api/ocr/extract", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setOcrResult(result.data)
        setProgress(100)
        toast.success("Text extracted successfully!")
      } else {
        toast.error(result.error || "Failed to extract text")
      }
    } catch (error) {
      console.error("OCR error:", error)
      toast.error("Failed to process image")
    } finally {
      clearInterval(progressInterval)
      setIsProcessing(false)
      setTimeout(() => setProgress(0), 2000)
    }
  }

  const handleCopyText = () => {
    if (ocrResult?.text) {
      navigator.clipboard.writeText(ocrResult.text)
      toast.success("Text copied to clipboard!")
    }
  }

  const handleDownloadText = () => {
    if (ocrResult?.text) {
      const blob = new Blob([ocrResult.text], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `extracted-text-${Date.now()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Text file downloaded!")
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setOcrResult(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/ask">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Ask Question
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Camera className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">OCR Demo</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload and Settings */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Image</CardTitle>
                <CardDescription>Upload an image containing text to extract it using OCR technology</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedImage ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                    <FileImage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">Choose an image</p>
                    <p className="text-sm text-gray-600 mb-4">
                      Handwritten notes, textbook pages, math problems, or any text image
                    </p>
                    <label htmlFor="image-upload">
                      <Button type="button" variant="outline" className="cursor-pointer bg-transparent">
                        <Upload className="h-4 w-4 mr-2" />
                        Select Image
                      </Button>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">Supports JPG, PNG, WebP (max 10MB)</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative border rounded-lg overflow-hidden">
                      <img
                        src={imagePreview || ""}
                        alt="Selected image"
                        className="w-full max-h-64 object-contain bg-gray-50"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">
                      <strong>File:</strong> {selectedImage.name} ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* OCR Settings */}
            {selectedImage && (
              <Card>
                <CardHeader>
                  <CardTitle>OCR Settings</CardTitle>
                  <CardDescription>Configure text extraction options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Expected Language</Label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(supportedLanguages).map(([code, name]) => (
                          <SelectItem key={code} value={code}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enhance"
                      checked={enhanceImage}
                      onChange={(e) => setEnhanceImage(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="enhance" className="text-sm">
                      Enhance image quality (recommended)
                    </Label>
                  </div>

                  <Button onClick={handleProcessOCR} disabled={isProcessing} className="w-full">
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FileImage className="h-4 w-4 mr-2" />
                        Extract Text
                      </>
                    )}
                  </Button>

                  {isProcessing && (
                    <div className="space-y-2">
                      <Progress value={progress} className="w-full" />
                      <p className="text-sm text-gray-600 text-center">Processing... {Math.round(progress)}%</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results */}
          <div className="space-y-6">
            {ocrResult ? (
              <>
                {/* OCR Results */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <CardTitle>Extracted Text</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{Math.round(ocrResult.confidence * 100)}% confidence</Badge>
                        <Badge variant="outline">
                          {supportedLanguages[ocrResult.language as keyof typeof supportedLanguages] ||
                            ocrResult.language}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>Processing time: {(ocrResult.processingTime / 1000).toFixed(1)}s</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea value={ocrResult.text} readOnly rows={8} className="font-mono text-sm" />

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={handleCopyText} className="bg-transparent">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Text
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownloadText} className="bg-transparent">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Quality Assessment */}
                {ocrResult.validation && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        {ocrResult.validation.isValid ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        )}
                        <span>Quality Assessment</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {ocrResult.validation.isValid ? (
                        <p className="text-green-800">Text extraction quality is good!</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-yellow-800 font-medium">Issues detected:</p>
                          <ul className="text-sm text-yellow-700 space-y-1">
                            {ocrResult.validation.issues.map((issue, index) => (
                              <li key={index}>• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Language Detection */}
                {ocrResult.detectedLanguage && ocrResult.detectedLanguage !== selectedLanguage && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Language Detection</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-blue-800">
                        <strong>Detected:</strong>{" "}
                        {supportedLanguages[ocrResult.detectedLanguage as keyof typeof supportedLanguages] ||
                          ocrResult.detectedLanguage}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        This differs from your selected language (
                        {supportedLanguages[selectedLanguage as keyof typeof supportedLanguages]})
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Results</CardTitle>
                  <CardDescription>Extracted text will appear here after processing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <FileImage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Upload an image and click "Extract Text" to see results</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sample Images */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Try Sample Images</CardTitle>
            <CardDescription>Test OCR with these sample educational content images</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-4 mb-2">
                  <p className="text-sm font-mono">Math Problem: 2x + 5 = 15</p>
                </div>
                <p className="text-sm text-gray-600">Handwritten Math</p>
              </div>
              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-4 mb-2">
                  <p className="text-sm font-mono">प्रकाश संश्लेषण क्या है?</p>
                </div>
                <p className="text-sm text-gray-600">Hindi Text</p>
              </div>
              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-4 mb-2">
                  <p className="text-sm font-mono">What is photosynthesis?</p>
                </div>
                <p className="text-sm text-gray-600">English Question</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Note: This is a demo with mock results. In production, integrate with Tesseract.js or cloud OCR services.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
