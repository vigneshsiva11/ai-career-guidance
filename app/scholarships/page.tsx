"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  Search,
  Filter,
  Calendar,
  MapPin,
  GraduationCap,
  IndianRupee,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  getDeadlineStatus,
  formatScholarshipAmount,
  getPriorityColor,
  getSourceIcon,
} from "@/lib/realtime-updates";
import {
  RealtimeNotifications,
  useRealtimeNotifications,
} from "@/components/realtime-notifications";

interface Scholarship {
  id: string;
  name: string;
  provider: string;
  amount: number;
  category: string;
  description: string;
  eligibleStates: string[];
  minGrade: number;
  maxGrade: number;
  deadline: string;
  requirements: string[];
  applicationUrl: string;
  isLive?: boolean;
  lastUpdated?: string;
  source?: string;
  priority?: "high" | "medium" | "low";
  tags?: string[];
}

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [filteredScholarships, setFilteredScholarships] = useState<
    Scholarship[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [stateFilter, setStateFilter] = useState("All States");
  const [gradeFilter, setGradeFilter] = useState("All Grades");
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { notifications, addNotification, markAsRead, clearAll } =
    useRealtimeNotifications();

  useEffect(() => {
    fetchScholarships();
  }, []);

  useEffect(() => {
    filterScholarships();
  }, [scholarships, searchTerm, categoryFilter, stateFilter, gradeFilter]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && !realtimeEnabled) {
      refreshIntervalRef.current = setInterval(() => {
        fetchScholarships(false);
      }, 5 * 60 * 1000); // Refresh every 5 minutes
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, realtimeEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const fetchScholarships = async (useRealtime = false) => {
    try {
      // Always fetch real-time scholarships (no fallback to mock data)
      const url = "/api/scholarships";
      const response = await fetch(url);
      const data = await response.json();

      setScholarships(data.scholarships || []);
      setLastUpdated(data.lastUpdated || new Date().toISOString());

      if (data.source === "realtime") {
        setIsConnected(true);
      } else if (data.source === "live") {
        setIsConnected(false);
      } else {
        setIsConnected(false);
      }

      // Log the source for debugging
      console.log(
        `[Scholarships Page] Fetched ${data.count} scholarships from ${data.source} source`
      );
    } catch (error) {
      console.error("Failed to fetch real-time scholarships:", error);
      setScholarships([]);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeConnection = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource("/api/scholarships/realtime?type=sse");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      addNotification({
        type: "system",
        title: "Real-time Updates",
        message: "Connected to live scholarship updates",
        priority: "medium",
      });
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "initial_data") {
          setScholarships(data.data.scholarships || []);
          setLastUpdated(data.timestamp);
        } else if (data.type === "scholarship_update") {
          const update = data.data;
          if (update.type === "new_scholarship") {
            addNotification({
              type: "new_scholarship",
              title: "New Scholarship Available",
              message: `${update.scholarship.name} - ${formatScholarshipAmount(
                update.scholarship.amount
              )}`,
              priority: "high",
            });
            setScholarships((prev) => [update.scholarship, ...prev]);
          } else if (update.type === "deadline_alert") {
            addNotification({
              type: "deadline_alert",
              title: "Deadline Approaching",
              message: `${update.scholarship.name} deadline is approaching`,
              priority: "high",
            });
          }
        } else if (data.type === "system_status") {
          if (data.data.status === "connected") {
            setIsConnected(true);
          }
        }
      } catch (error) {
        console.error("Error parsing SSE data:", error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      addNotification({
        type: "system",
        title: "Connection Lost",
        message: "Real-time updates disconnected",
        priority: "medium",
      });
    };
  };

  const toggleRealtime = (enabled: boolean) => {
    setRealtimeEnabled(enabled);
    if (enabled) {
      setupRealtimeConnection();
    } else {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      fetchScholarships(false);
    }
  };

  const refreshData = () => {
    setLoading(true);
    fetchScholarships(realtimeEnabled);
  };

  const filterScholarships = () => {
    let filtered = scholarships;

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "All Categories") {
      filtered = filtered.filter((s) => s.category === categoryFilter);
    }

    if (stateFilter !== "All States") {
      filtered = filtered.filter(
        (s) =>
          s.eligibleStates.includes(stateFilter) ||
          s.eligibleStates.includes("All")
      );
    }

    if (gradeFilter !== "All Grades") {
      const grade = Number.parseInt(gradeFilter);
      filtered = filtered.filter(
        (s) => grade >= s.minGrade && grade <= s.maxGrade
      );
    }

    setFilteredScholarships(filtered);
  };

  const applyForScholarship = async (scholarshipId: string) => {
    const selected = scholarships.find((s) => s.id === scholarshipId);
    if (selected?.applicationUrl) {
      // Navigate user to the official application page in a new tab
      window.open(selected.applicationUrl, "_blank", "noopener,noreferrer");
    }

    // Fire-and-forget: optionally record the intent server-side
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      void fetch("/api/scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, scholarshipId }),
      });
    } catch (error) {
      // ignore analytics errors
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isDeadlineNear = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading scholarships...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Real-Time Scholarships & Government Schemes
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <RealtimeNotifications
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onClearAll={clearAll}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm text-gray-600">
                {isConnected ? "Live Data" : "Cached Data"}
              </span>
            </div>
          </div>
        </div>
        <p className="text-gray-600 text-lg">
          Discover live, real-time financial aid opportunities from government
          and private sources
        </p>

        {/* Real-time Status */}
        <Card className="mt-4">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">
                    Real-time Data Only
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="autorefresh"
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                    disabled={realtimeEnabled}
                  />
                  <label htmlFor="autorefresh" className="text-sm font-medium">
                    Auto-refresh (5min)
                  </label>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Last updated:{" "}
                {lastUpdated
                  ? new Date(lastUpdated).toLocaleTimeString()
                  : "Never"}
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Showing only live, real-time scholarship data from government and
              private sources. No mock or sample data is displayed.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Scholarships
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search scholarships..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Categories">All Categories</SelectItem>
                <SelectItem value="Merit">Merit-based</SelectItem>
                <SelectItem value="Need">Need-based</SelectItem>
                <SelectItem value="Minority">Minority</SelectItem>
                <SelectItem value="SC/ST">SC/ST</SelectItem>
                <SelectItem value="OBC">OBC</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All States">All States</SelectItem>
                <SelectItem value="All">Pan India</SelectItem>
                <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                <SelectItem value="Karnataka">Karnataka</SelectItem>
                <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                <SelectItem value="Gujarat">Gujarat</SelectItem>
                <SelectItem value="Rajasthan">Rajasthan</SelectItem>
              </SelectContent>
            </Select>

            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Grades">All Grades</SelectItem>
                <SelectItem value="6">Grade 6</SelectItem>
                <SelectItem value="7">Grade 7</SelectItem>
                <SelectItem value="8">Grade 8</SelectItem>
                <SelectItem value="9">Grade 9</SelectItem>
                <SelectItem value="10">Grade 10</SelectItem>
                <SelectItem value="11">Grade 11</SelectItem>
                <SelectItem value="12">Grade 12</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Scholarships Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredScholarships.map((scholarship) => {
          const deadlineStatus = getDeadlineStatus(scholarship.deadline);
          const priorityColor = scholarship.priority
            ? getPriorityColor(scholarship.priority)
            : "";
          const sourceIcon = scholarship.source
            ? getSourceIcon(scholarship.source)
            : "📋";

          return (
            <Card
              key={scholarship.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{sourceIcon}</span>
                      <CardTitle className="text-xl">
                        {scholarship.name}
                      </CardTitle>
                      {scholarship.isLive && (
                        <div
                          className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                          title="Live data"
                        />
                      )}
                    </div>
                    <CardDescription className="text-base">
                      by {scholarship.provider}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2">
                    {scholarship.priority && (
                      <Badge className={`text-xs ${priorityColor}`}>
                        {scholarship.priority.toUpperCase()}
                      </Badge>
                    )}
                    {deadlineStatus.status === "urgent" && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        URGENT
                      </Badge>
                    )}
                    {deadlineStatus.status === "approaching" && (
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Soon
                      </Badge>
                    )}
                    {deadlineStatus.status === "expired" && (
                      <Badge
                        variant="outline"
                        className="text-xs text-gray-500"
                      >
                        Expired
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        {formatScholarshipAmount(scholarship.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{scholarship.category}</Badge>
                      {scholarship.tags && scholarship.tags.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {scholarship.tags[0]}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm">
                    {scholarship.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{scholarship.eligibleStates.join(", ")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      <span>
                        Grade {scholarship.minGrade}-{scholarship.maxGrade}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar
                      className={`h-4 w-4 ${
                        deadlineStatus.status === "urgent"
                          ? "text-red-500"
                          : deadlineStatus.status === "approaching"
                          ? "text-yellow-500"
                          : "text-gray-500"
                      }`}
                    />
                    <span
                      className={`${
                        deadlineStatus.status === "urgent"
                          ? "text-red-600 font-semibold"
                          : deadlineStatus.status === "approaching"
                          ? "text-yellow-600"
                          : "text-gray-600"
                      }`}
                    >
                      {deadlineStatus.message}:{" "}
                      {new Date(scholarship.deadline).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Requirements:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {scholarship.requirements
                        .slice(0, 3)
                        .map((req, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      {scholarship.requirements.length > 3 && (
                        <li className="text-blue-600 text-xs">
                          +{scholarship.requirements.length - 3} more
                          requirements
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => applyForScholarship(scholarship.id)}
                      className="flex-1"
                      disabled={deadlineStatus.status === "expired"}
                    >
                      {deadlineStatus.status === "expired"
                        ? "Expired"
                        : "Apply Now"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(scholarship.applicationUrl, "_blank")
                      }
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredScholarships.length === 0 && (
        <div className="text-center py-12">
          <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No real-time scholarships available
          </h3>
          <p className="text-gray-600 mb-4">
            We're currently showing only live, real-time scholarship data. No
            active scholarships were found matching your criteria.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={refreshData}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh Data
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("All Categories");
                setStateFilter("All States");
                setGradeFilter("All Grades");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
