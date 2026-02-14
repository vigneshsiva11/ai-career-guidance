"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Wifi, WifiOff, Clock, AlertTriangle } from "lucide-react";
import {
  RealtimeNotifications,
  useRealtimeNotifications,
} from "@/components/realtime-notifications";

export default function TestRealtimePage() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [testData, setTestData] = useState<any[]>([]);
  const { notifications, addNotification, markAsRead, clearAll } =
    useRealtimeNotifications();

  const testRealtimeConnection = async () => {
    try {
      const response = await fetch("/api/scholarships/realtime?type=json");
      const data = await response.json();

      setTestData(data.scholarships || []);
      setLastUpdate(data.lastUpdated || new Date().toISOString());
      setIsConnected(true);

      addNotification({
        type: "system",
        title: "Test Connection",
        message: `Fetched ${data.count} scholarships successfully`,
        priority: "medium",
      });
    } catch (error) {
      console.error("Test connection failed:", error);
      setIsConnected(false);

      addNotification({
        type: "system",
        title: "Connection Failed",
        message: "Failed to connect to real-time API",
        priority: "high",
      });
    }
  };

  const testSSEConnection = () => {
    const eventSource = new EventSource("/api/scholarships/realtime?type=sse");

    eventSource.onopen = () => {
      setIsConnected(true);
      addNotification({
        type: "system",
        title: "SSE Connected",
        message: "Server-Sent Events connection established",
        priority: "medium",
      });
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("SSE Data received:", data);

        if (data.type === "initial_data") {
          setTestData(data.data.scholarships || []);
          setLastUpdate(data.timestamp);
        }
      } catch (error) {
        console.error("Error parsing SSE data:", error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      addNotification({
        type: "system",
        title: "SSE Error",
        message: "Server-Sent Events connection lost",
        priority: "high",
      });
      eventSource.close();
    };

    // Close connection after 30 seconds for testing
    setTimeout(() => {
      eventSource.close();
      setIsConnected(false);
    }, 30000);
  };

  const simulateNewScholarship = () => {
    const newScholarship = {
      id: `test_${Date.now()}`,
      name: `Test Scholarship ${Math.floor(Math.random() * 1000)}`,
      provider: "Test Provider",
      amount: Math.floor(Math.random() * 100000) + 10000,
      category: "Test",
      description: "This is a test scholarship for demonstration purposes",
      eligibleStates: ["All"],
      minGrade: 10,
      maxGrade: 12,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      requirements: ["Test requirement 1", "Test requirement 2"],
      applicationUrl: "https://example.com",
      isLive: true,
      lastUpdated: new Date().toISOString(),
      source: "test",
      priority: "high",
      tags: ["test", "demo"],
    };

    setTestData((prev) => [newScholarship, ...prev]);

    addNotification({
      type: "new_scholarship",
      title: "New Test Scholarship",
      message: `${
        newScholarship.name
      } - ₹${newScholarship.amount.toLocaleString()}`,
      priority: "high",
    });
  };

  const simulateDeadlineAlert = () => {
    addNotification({
      type: "deadline_alert",
      title: "Deadline Alert",
      message: "Test scholarship deadline is approaching in 3 days",
      priority: "high",
    });
  };

  useEffect(() => {
    testRealtimeConnection();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Real-time Scholarships Test Page
        </h1>
        <p className="text-gray-600">
          Test the real-time scholarship functionality and notifications
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-gray-400" />
              )}
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Last Update
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {lastUpdate ? new Date(lastUpdate).toLocaleString() : "Never"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RealtimeNotifications
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onClearAll={clearAll}
            />
          </CardContent>
        </Card>
      </div>

      {/* Test Controls */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={testRealtimeConnection}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Test JSON API
            </Button>
            <Button
              onClick={testSSEConnection}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Wifi className="h-4 w-4" />
              Test SSE Connection
            </Button>
            <Button
              onClick={simulateNewScholarship}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Simulate New Scholarship
            </Button>
            <Button
              onClick={simulateDeadlineAlert}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Simulate Deadline Alert
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Data Display */}
      <Card>
        <CardHeader>
          <CardTitle>Test Data ({testData.length} items)</CardTitle>
        </CardHeader>
        <CardContent>
          {testData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No test data available. Click "Test JSON API" to load data.
            </p>
          ) : (
            <div className="space-y-4">
              {testData.slice(0, 5).map((item, index) => (
                <div key={item.id || index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{item.name}</h3>
                    <div className="flex items-center gap-2">
                      {item.isLive && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      )}
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Provider: {item.provider}</span>
                    <span>Amount: ₹{item.amount?.toLocaleString()}</span>
                    <span>Source: {item.source}</span>
                    <span>Priority: {item.priority}</span>
                  </div>
                </div>
              ))}
              {testData.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  ... and {testData.length - 5} more items
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
