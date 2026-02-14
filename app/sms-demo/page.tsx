"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Phone, Send, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { getTollFreeNumber } from "@/lib/config"

interface SMSMessage {
  from: "user" | "system"
  message: string
  timestamp: string
}

export default function SMSDemoPage() {
  const [phoneNumber, setPhoneNumber] = useState("+91-9876543210")
  const [message, setMessage] = useState("")
  const [conversation, setConversation] = useState<SMSMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSendSMS = async () => {
    if (!message.trim()) return

    setIsLoading(true)

    // Add user message to conversation
    const userMessage: SMSMessage = {
      from: "user",
      message: message,
      timestamp: new Date().toLocaleTimeString(),
    }

    setConversation((prev) => [...prev, userMessage])

    try {
      // Send to SMS webhook
      const response = await fetch("/api/sms/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          From: phoneNumber,
          Body: message,
          MessageSid: `demo_${Date.now()}`,
        }),
      })

      if (response.ok) {
        // Simulate system response (in real implementation, this would come via webhook)
        setTimeout(() => {
          const systemMessage: SMSMessage = {
            from: "system",
            message: "SMS processed! Check console for response details.",
            timestamp: new Date().toLocaleTimeString(),
          }
          setConversation((prev) => [...prev, systemMessage])
        }, 1000)

        toast.success("SMS sent successfully!")
      } else {
        toast.error("Failed to send SMS")
      }
    } catch (error) {
      console.error("SMS error:", error)
      toast.error("Error sending SMS")
    } finally {
      setIsLoading(false)
      setMessage("")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-6 w-6 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">SMS Demo</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* SMS Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <span>SMS Interface</span>
              </CardTitle>
              <CardDescription>Test the SMS functionality of Classless AI Tutor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91-9876543210"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={3}
                />
              </div>

              <Button onClick={handleSendSMS} disabled={isLoading || !message.trim()} className="w-full">
                {isLoading ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send SMS
                  </>
                )}
              </Button>

              {/* Sample Messages */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-2">Try these sample messages:</p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage("REGISTER John Smith EN")}
                    className="w-full text-left justify-start bg-transparent"
                  >
                    REGISTER John Smith EN
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage("What is photosynthesis?")}
                    className="w-full text-left justify-start bg-transparent"
                  >
                    What is photosynthesis?
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage("Solve 2x + 5 = 15")}
                    className="w-full text-left justify-start bg-transparent"
                  >
                    Solve 2x + 5 = 15
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage("HELP")}
                    className="w-full text-left justify-start bg-transparent"
                  >
                    HELP
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversation History */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
              <CardDescription>SMS conversation history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {conversation.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No messages yet. Send an SMS to start!</p>
                ) : (
                  conversation.map((msg, index) => (
                    <div key={index} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.from === "user" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-75 mt-1">{msg.timestamp}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* IVR Demo Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-purple-600" />
              <span>IVR (Voice Call) System</span>
            </CardTitle>
            <CardDescription>Interactive Voice Response system for voice-based learning</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How it works:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Call {getTollFreeNumber('voice')}</li>
                  <li>• Register with voice: "My name is John, English"</li>
                  <li>• Ask questions by speaking</li>
                  <li>• Get AI answers in your language</li>
                  <li>• Continue conversation or hang up</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Supported Languages:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• English</li>
                  <li>• Hindi (हिंदी)</li>
                  <li>• Punjabi (ਪੰਜਾਬੀ)</li>
                  <li>• Bengali (বাংলা)</li>
                  <li>• Tamil (தமிழ்)</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                <strong>Note:</strong> This is a demo implementation. In production, integrate with Twilio, Exotel, or
                similar services for real SMS and voice capabilities.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
