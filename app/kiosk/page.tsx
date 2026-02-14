"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Users,
  Clock,
  LogIn,
  UserPlus,
  ArrowRight,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle,
  Timer,
} from "lucide-react"
import { toast } from "sonner"
import type { User, LearningStation } from "@/lib/types"

export default function KioskPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [station, setStation] = useState<LearningStation | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [sessionTime, setSessionTime] = useState(0)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [checkInMode, setCheckInMode] = useState<"login" | "register">("login")
  const [formData, setFormData] = useState({
    phoneNumber: "",
    name: "",
    preferredLanguage: "en",
  })

  useEffect(() => {
    const stationId = searchParams.get("station_id")
    if (stationId) {
      fetchStationDetails(stationId)
    }

    // Check if user is already logged in
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem("classless_user")
      if (userData) {
        const user = JSON.parse(userData)
        setCurrentUser(user)
        startSession()
      }
    }
  }, [searchParams])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (currentUser && sessionTime > 0) {
      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [currentUser, sessionTime])

  const fetchStationDetails = async (stationId: string) => {
    // Mock station data - in production, fetch from API
    const mockStation: LearningStation = {
      id: Number.parseInt(stationId),
      name: "Community Center - Sector 15",
      location: "Sector 15, Chandigarh, Punjab",
      contact_person: "Rajesh Kumar",
      contact_phone: "+91-9876543210",
      operating_hours: "9:00 AM - 6:00 PM",
      available_subjects: ["Mathematics", "Science", "English"],
      is_active: true,
      created_at: new Date().toISOString(),
    }
    setStation(mockStation)
  }

  const startSession = () => {
    setSessionTime(1)
  }

  const handleCheckIn = async () => {
    setIsCheckingIn(true)

    try {
      if (checkInMode === "login") {
        // Try to login existing user
        const response = await fetch(`/api/users?phone=${encodeURIComponent(formData.phoneNumber)}`)
        const result = await response.json()

        if (result.success && result.data) {
          setCurrentUser(result.data)
          if (typeof window !== 'undefined') {
            localStorage.setItem("classless_user", JSON.stringify(result.data))
          }
          startSession()
          toast.success(`Welcome back, ${result.data.name}!`)
        } else {
          toast.error("User not found. Please register or check your phone number.")
          setCheckInMode("register")
        }
      } else {
        // Register new user
        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone_number: formData.phoneNumber,
            name: formData.name,
            user_type: "student",
            preferred_language: formData.preferredLanguage,
            location: station?.location || "Community Station",
            education_level: "unknown",
          }),
        })

        const result = await response.json()

        if (result.success) {
          setCurrentUser(result.data)
          if (typeof window !== 'undefined') {
            localStorage.setItem("classless_user", JSON.stringify(result.data))
          }
          startSession()
          toast.success(`Welcome to Classless, ${result.data.name}!`)
        } else {
          toast.error(result.error || "Registration failed")
        }
      }
    } catch (error) {
      console.error("Check-in error:", error)
      toast.error("Check-in failed. Please try again.")
    } finally {
      setIsCheckingIn(false)
    }
  }

  const handleEndSession = () => {
    setCurrentUser(null)
    setSessionTime(0)
    if (typeof window !== 'undefined') {
      localStorage.removeItem("classless_user")
    }
    toast.success("Session ended. Thank you for using Classless!")
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (!station) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading station information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Classless Kiosk</h1>
                <p className="text-sm text-gray-600">{station.name}</p>
              </div>
            </Link>

            {currentUser && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Timer className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-mono text-gray-700">{formatTime(sessionTime)}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleEndSession}>
                  End Session
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentUser ? (
          /* Check-in Interface */
          <div className="max-w-2xl mx-auto">
            {/* Station Info */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-6 w-6 text-orange-600" />
                  <div>
                    <CardTitle>{station.name}</CardTitle>
                    <CardDescription>{station.location}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{station.operating_hours}</span>
                  </div>
                  {station.contact_phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{station.contact_phone}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Available Subjects:</p>
                  <div className="flex flex-wrap gap-2">
                    {station.available_subjects.map((subject) => (
                      <Badge key={subject} variant="secondary">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Check-in Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {checkInMode === "login" ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                  <span>{checkInMode === "login" ? "Sign In" : "Create Account"}</span>
                </CardTitle>
                <CardDescription>
                  {checkInMode === "login"
                    ? "Enter your phone number to access your account"
                    : "Create a new account to start learning"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91-9876543210"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    required
                  />
                </div>

                {checkInMode === "register" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Preferred Language</Label>
                      <Select
                        value={formData.preferredLanguage}
                        onValueChange={(value) => setFormData({ ...formData, preferredLanguage: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="hi">Hindi (हिंदी)</SelectItem>
                          <SelectItem value="pa">Punjabi (ਪੰਜਾਬੀ)</SelectItem>
                          <SelectItem value="bn">Bengali (বাংলা)</SelectItem>
                          <SelectItem value="ta">Tamil (தமிழ்)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <Button
                  onClick={handleCheckIn}
                  disabled={isCheckingIn || !formData.phoneNumber || (checkInMode === "register" && !formData.name)}
                  className="w-full"
                >
                  {isCheckingIn ? (
                    "Processing..."
                  ) : (
                    <>
                      {checkInMode === "login" ? "Sign In" : "Create Account"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setCheckInMode(checkInMode === "login" ? "register" : "login")}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {checkInMode === "login" ? "Don't have an account? Create one" : "Already have an account? Sign in"}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <span>How to Use This Station</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Sign in with your phone number or create a new account</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Ask questions by typing, uploading images, or using voice</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Get instant AI-powered answers in your preferred language</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Your progress is automatically saved to your account</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Remember to end your session when you're done</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Learning Interface */
          <div className="space-y-8">
            {/* Welcome Message */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Welcome, {currentUser.name}!</h2>
                    <p className="text-gray-600">Ready to learn? Choose what you'd like to do:</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Session Time</p>
                    <p className="text-2xl font-mono font-bold text-blue-600">{formatTime(sessionTime)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/ask")}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                    <CardTitle>Ask a Question</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>Get instant AI-powered answers to your questions</CardDescription>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push("/dashboard")}
              >
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Users className="h-6 w-6 text-green-600" />
                    <CardTitle>My Dashboard</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>View your questions, progress, and learning history</CardDescription>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push("/ocr-demo")}
              >
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-6 w-6 text-purple-600" />
                    <CardTitle>Photo Questions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>Take photos of handwritten questions and get answers</CardDescription>
                </CardContent>
              </Card>
            </div>

            {/* Station Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Station Guidelines</CardTitle>
                <CardDescription>Please follow these guidelines while using the learning station</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">Do:</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Keep your session time reasonable (max 2 hours)</li>
                      <li>• Help other students if they need assistance</li>
                      <li>• Keep the station clean and organized</li>
                      <li>• End your session properly when done</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-800 mb-2">Don't:</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Share your account with others</li>
                      <li>• Use the station for non-educational purposes</li>
                      <li>• Leave the station without ending your session</li>
                      <li>• Disturb other learners</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
