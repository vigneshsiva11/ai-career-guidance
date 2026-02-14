// Real-time updates system for scholarships
// Uses Server-Sent Events (SSE) for live updates

import {
  realtimeScholarshipAggregator,
  type RealtimeScholarship,
  type ScholarshipUpdate,
} from "./realtime-scholarship-sources";

export interface RealtimeUpdateEvent {
  type:
    | "scholarship_update"
    | "new_scholarship"
    | "deadline_alert"
    | "system_status";
  data: any;
  timestamp: string;
}

export class RealtimeUpdateService {
  private clients = new Set<Response>();
  private updateInterval: NodeJS.Timeout | null = null;
  private lastUpdateTime = new Date().toISOString();

  constructor() {
    this.startUpdateLoop();
  }

  private startUpdateLoop() {
    // Check for updates every 2 minutes
    this.updateInterval = setInterval(async () => {
      try {
        const updates =
          await realtimeScholarshipAggregator.getScholarshipUpdates(
            this.lastUpdateTime
          );

        if (updates.length > 0) {
          this.broadcastUpdates(updates);
          this.lastUpdateTime = new Date().toISOString();
        }
      } catch (error) {
        console.error("Error in update loop:", error);
      }
    }, 2 * 60 * 1000); // 2 minutes
  }

  addClient(response: Response) {
    this.clients.add(response);

    // Send initial connection confirmation
    this.sendToClient(response, {
      type: "system_status",
      data: { status: "connected", message: "Real-time updates enabled" },
      timestamp: new Date().toISOString(),
    });
  }

  removeClient(response: Response) {
    this.clients.delete(response);
  }

  private async broadcastUpdates(updates: ScholarshipUpdate[]) {
    const events: RealtimeUpdateEvent[] = updates.map((update) => ({
      type: this.mapUpdateType(update.type),
      data: update,
      timestamp: update.timestamp,
    }));

    // Send to all connected clients
    for (const client of this.clients) {
      try {
        for (const event of events) {
          this.sendToClient(client, event);
        }
      } catch (error) {
        console.error("Error sending update to client:", error);
        this.clients.delete(client);
      }
    }
  }

  private mapUpdateType(updateType: string): RealtimeUpdateEvent["type"] {
    switch (updateType) {
      case "new":
        return "new_scholarship";
      case "updated":
        return "scholarship_update";
      case "deadline_approaching":
        return "deadline_alert";
      default:
        return "scholarship_update";
    }
  }

  private sendToClient(response: Response, event: RealtimeUpdateEvent) {
    try {
      const data = `data: ${JSON.stringify(event)}\n\n`;
      // Note: In a real implementation, you'd need to handle the Response stream properly
      // This is a simplified version for demonstration
    } catch (error) {
      console.error("Error sending data to client:", error);
    }
  }

  async getLiveScholarships(state?: string): Promise<RealtimeScholarship[]> {
    return await realtimeScholarshipAggregator.fetchAllScholarships(state);
  }

  async getRecentUpdates(limit = 10): Promise<ScholarshipUpdate[]> {
    const updates = await realtimeScholarshipAggregator.getScholarshipUpdates();
    return updates.slice(0, limit);
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.clients.clear();
  }
}

// Singleton instance
export const realtimeUpdateService = new RealtimeUpdateService();

// Utility functions for deadline tracking
export function getDeadlineStatus(deadline: string): {
  status: "expired" | "urgent" | "approaching" | "normal";
  daysLeft: number;
  message: string;
} {
  if (!deadline) {
    return {
      status: "normal",
      daysLeft: 365,
      message: "No deadline specified",
    };
  }

  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return {
      status: "expired",
      daysLeft: 0,
      message: "Application deadline has passed",
    };
  }

  if (daysLeft <= 3) {
    return {
      status: "urgent",
      daysLeft,
      message: `Only ${daysLeft} day${daysLeft === 1 ? "" : "s"} left!`,
    };
  }

  if (daysLeft <= 7) {
    return {
      status: "approaching",
      daysLeft,
      message: `${daysLeft} days remaining`,
    };
  }

  return {
    status: "normal",
    daysLeft,
    message: `${daysLeft} days remaining`,
  };
}

export function formatScholarshipAmount(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}K`;
  }
  return `₹${amount}`;
}

export function getPriorityColor(priority: "high" | "medium" | "low"): string {
  switch (priority) {
    case "high":
      return "text-red-600 bg-red-50 border-red-200";
    case "medium":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "low":
      return "text-green-600 bg-green-50 border-green-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export function getSourceIcon(source: string): string {
  switch (source) {
    case "nsp":
      return "🏛️";
    case "aicte":
      return "🎓";
    case "state":
      return "🏛️";
    case "private":
      return "🏢";
    default:
      return "📋";
  }
}
