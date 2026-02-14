"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, Phone } from "lucide-react"
import { toast } from "sonner"
import { getTollFreeNumber } from "@/lib/config"

export default function ExistingLoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Check if user exists
      const response = await fetch(`/api/users?phone=${encodeURIComponent(phoneNumber)}`)
      const result = await response.json()

      if (result.success && result.data) {
        // Store user info in localStorage (simple auth for hackathon)
        localStorage.setItem("classless_user", JSON.stringify(result.data))
        toast.success("Login successful!")
        router.push("/dashboard")
      } else {
        toast.error("User not found. Please register first.")
        router.push("/auth/login")
      }
    } catch (error) {
      console.error("Login error:", error)
      toast.error("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-4 hover:opacity-80 transition-opacity">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Classless</h1>
          </Link>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Enter your phone number to access your learning dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91-9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/auth/login" className="text-blue-600 hover:underline">
                Register here
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-gray-500 text-center">
              You can also access Classless via:
              <br />
              SMS: Text to {getTollFreeNumber('sms')} | Call: {getTollFreeNumber('voice')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
