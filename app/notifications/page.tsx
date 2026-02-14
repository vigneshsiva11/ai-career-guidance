"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, BellRing, Check, MessageSquare, Award } from "lucide-react"

interface Notification {
  id: string
  userId: string
  type: "scholarship" | "question" | "system" | "reminder"
  title: string
  message: string
  scholarshipId?: string
  read: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}")

    try {
      const response = await fetch(`/api/notifications?userId=${user.id}`)
      const data = await response.json()
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, read: true }),
      })

      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.read)

    for (const notification of unreadNotifications) {
      await markAsRead(notification.id)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "scholarship":
        return <Award className="h-5 w-5 text-yellow-600" />
      case "question":
        return <MessageSquare className="h-5 w-5 text-blue-600" />
      case "system":
        return <Bell className="h-5 w-5 text-gray-600" />
      case "reminder":
        return <BellRing className="h-5 w-5 text-orange-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "scholarship":
        return "bg-yellow-50 border-yellow-200"
      case "question":
        return "bg-blue-50 border-blue-200"
      case "system":
        return "bg-gray-50 border-gray-200"
      case "reminder":
        return "bg-orange-50 border-orange-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600">Stay updated with scholarships, answers, and important updates</p>
            </div>
          </div>

          {unreadCount > 0 && (
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm">
                {unreadCount} unread
              </Badge>
              <Button onClick={markAllAsRead} variant="outline" size="sm">
                <Check className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No notifications yet</h3>
              <p className="text-gray-600">
                We'll notify you about new scholarships, question answers, and important updates.
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all hover:shadow-md ${
                !notification.read
                  ? `${getNotificationColor(notification.type)} border-l-4`
                  : "bg-white border-gray-200"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <CardTitle className={`text-lg ${!notification.read ? "font-bold" : "font-medium"}`}>
                        {notification.title}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={notification.type === "scholarship" ? "default" : "secondary"} className="text-xs">
                      {notification.type}
                    </Badge>
                    {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-gray-700 mb-4">{notification.message}</p>

                <div className="flex items-center gap-2">
                  {!notification.read && (
                    <Button onClick={() => markAsRead(notification.id)} variant="outline" size="sm">
                      <Check className="h-4 w-4 mr-2" />
                      Mark as read
                    </Button>
                  )}

                  {notification.scholarshipId && (
                    <Button onClick={() => (window.location.href = "/scholarships")} size="sm">
                      View Scholarship
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
