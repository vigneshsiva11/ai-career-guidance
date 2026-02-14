"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  Clock,
  Phone,
  Users,
  BookOpen,
  ArrowLeft,
  Navigation,
  CheckCircle,
  AlertCircle,
  Calendar,
  Star,
} from "lucide-react"
import Link from "next/link"
import type { LearningStation } from "@/lib/types"

export default function StationDetailPage() {
  const params = useParams()
  const [station, setStation] = useState<LearningStation | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStationDetails()
  }, [params.id])

  const fetchStationDetails = async () => {
    try {
      // Mock station data - in production, fetch from API
      const mockStation: LearningStation = {
        id: Number.parseInt(params.id as string),
        name: "Community Center - Sector 15",
        location: "Sector 15, Chandigarh, Punjab 160015",
        contact_person: "Rajesh Kumar",
        contact_phone: "+91-9876543210",
        operating_hours: "9:00 AM - 6:00 PM (Monday to Saturday)",
        available_subjects: ["Mathematics", "Science", "English", "Computer Science"],
        is_active: true,
        created_at: new Date().toISOString(),
      }

      setStation(mockStation)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching station details:", error)
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading station details...</p>
        </div>
      </div>
    )
  }

  if (!station) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Station Not Found</h2>
          <p className="text-gray-600 mb-4">The learning station you're looking for doesn't exist.</p>
          <Link href="/stations">
            <Button>Back to Stations</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/stations">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Stations
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <MapPin className="h-6 w-6 text-orange-600" />
              <h1 className="text-xl font-bold text-gray-900">Station Details</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Station Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{station.name}</CardTitle>
                <div className="flex items-center space-x-2 mb-4">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-600">{station.location}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant={station.is_active ? "default" : "destructive"}>
                    {station.is_active ? "Open" : "Temporarily Closed"}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">4.8 (24 reviews)</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                className="flex-1"
                disabled={!station.is_active}
                onClick={() => window.open(`/kiosk?station_id=${station.id}`, "_blank")}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Start Learning Session
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent">
                <Navigation className="h-4 w-4 mr-2" />
                Get Directions
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Operating Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Operating Hours</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{station.operating_hours}</p>
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">Currently Open</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Subjects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Available Subjects</span>
                </CardTitle>
                <CardDescription>Subjects you can learn at this station</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {station.available_subjects.map((subject) => (
                    <div key={subject} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{subject}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Station Features</CardTitle>
                <CardDescription>What's available at this learning station</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">High-speed Internet</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Computer Access</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Printing Facility</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Study Materials</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Multilingual Support</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Supervised Learning</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>What's happening at this station</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">15 students learned today</p>
                      <p className="text-xs text-gray-500">Most popular subject: Mathematics</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <BookOpen className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">127 questions answered this week</p>
                      <p className="text-xs text-gray-500">Average response time: 2.3 seconds</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Star className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">New volunteer joined</p>
                      <p className="text-xs text-gray-500">Priya Singh - Computer Science tutor</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Contact</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {station.contact_person && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Station Coordinator</p>
                    <p className="text-gray-600">{station.contact_person}</p>
                  </div>
                )}
                {station.contact_phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone</p>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{station.contact_phone}</span>
                    </div>
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Station
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Students</span>
                  <span className="font-medium">1,247</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Questions Answered</span>
                  <span className="font-medium">8,934</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <span className="font-medium">94.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg. Session Time</span>
                  <span className="font-medium">45 min</span>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Upcoming Events</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Math Workshop</p>
                  <p className="text-xs text-blue-700">Tomorrow, 2:00 PM - 4:00 PM</p>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-900">Science Fair Prep</p>
                  <p className="text-xs text-green-700">Friday, 3:00 PM - 5:00 PM</p>
                </div>
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  View All Events
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
