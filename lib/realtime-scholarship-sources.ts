// Real-time scholarship data sources
// Integrates with multiple government and private scholarship APIs

export interface RealtimeScholarship {
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
  isLive: boolean;
  lastUpdated: string;
  source: "nsp" | "aicte" | "state" | "private" | "manual";
  priority: "high" | "medium" | "low";
  tags: string[];
}

export interface ScholarshipUpdate {
  type: "new" | "updated" | "deadline_approaching" | "expired";
  scholarship: RealtimeScholarship;
  timestamp: string;
}

// Government scholarship sources
export class NSPDataSource {
  private baseUrl = "https://scholarships.gov.in/api";
  private apiKey = process.env.NSP_API_KEY;

  async fetchLiveScholarships(): Promise<RealtimeScholarship[]> {
    if (!this.apiKey) {
      console.warn("NSP API key not configured, returning sample data");
      return this.getSampleData();
    }

    try {
      const response = await fetch(`${this.baseUrl}/scholarships`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 300 }, // 5 minutes cache
      });

      if (!response.ok) throw new Error(`NSP API error: ${response.status}`);

      const data = await response.json();
      return this.normalizeNSPData(data);
    } catch (error) {
      console.error("NSP API fetch failed:", error);
      return [];
    }
  }

  private normalizeNSPData(data: any[]): RealtimeScholarship[] {
    return data.map((item) => ({
      id: `nsp_${item.schemeId || item.id}`,
      name: item.schemeName || item.name,
      provider: item.ministry || "Government of India",
      amount: item.maxAmount || item.amount || 0,
      category: item.schemeCategory || "General",
      description: item.description || item.details || "",
      eligibleStates: this.parseStates(item.states || item.eligibleStates),
      minGrade: item.minGrade || 1,
      maxGrade: item.maxGrade || 12,
      deadline: item.lastDate || item.deadline || "",
      requirements: this.parseRequirements(
        item.eligibility || item.requirements
      ),
      applicationUrl:
        item.applyUrl || item.url || "https://scholarships.gov.in/",
      isLive: item.isActive !== false,
      lastUpdated: new Date().toISOString(),
      source: "nsp" as const,
      priority: this.calculatePriority(item),
      tags: this.generateTags(item),
    }));
  }

  private parseStates(states: any): string[] {
    if (!states) return ["All"];
    if (Array.isArray(states)) return states;
    return states.split(",").map((s: string) => s.trim());
  }

  private parseRequirements(req: any): string[] {
    if (!req) return [];
    if (Array.isArray(req)) return req;
    return req
      .split("\n")
      .map((r: string) => r.trim())
      .filter(Boolean);
  }

  private calculatePriority(item: any): "high" | "medium" | "low" {
    const amount = item.maxAmount || item.amount || 0;
    const daysLeft = this.getDaysUntilDeadline(item.lastDate || item.deadline);

    if (amount >= 50000 || daysLeft <= 7) return "high";
    if (amount >= 20000 || daysLeft <= 30) return "medium";
    return "low";
  }

  private generateTags(item: any): string[] {
    const tags = [];
    if (item.schemeCategory) tags.push(item.schemeCategory.toLowerCase());
    if (item.ministry)
      tags.push(item.ministry.toLowerCase().replace(/\s+/g, "-"));
    if (item.maxAmount >= 50000) tags.push("high-value");
    if (this.getDaysUntilDeadline(item.lastDate) <= 30) tags.push("urgent");
    return tags;
  }

  private getDaysUntilDeadline(deadline: string): number {
    if (!deadline) return 365;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getSampleData(): RealtimeScholarship[] {
    const today = new Date();
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return [
      {
        id: "nsp_merit_001",
        name: "National Merit Scholarship Scheme",
        provider: "Ministry of Education, Government of India",
        amount: 100000,
        category: "Merit",
        description:
          "Awarded to meritorious students from economically weaker sections for pursuing higher education.",
        eligibleStates: ["All"],
        minGrade: 9,
        maxGrade: 12,
        deadline: nextMonth.toISOString().split("T")[0],
        requirements: [
          "Minimum 80% marks in previous examination",
          "Family income below ₹3.5 lakhs per annum",
          "Valid Aadhaar card",
          "Bank account details",
        ],
        applicationUrl: "https://scholarships.gov.in/",
        isLive: true,
        lastUpdated: new Date().toISOString(),
        source: "nsp",
        priority: "high",
        tags: ["merit", "high-value", "government"],
      },
      {
        id: "nsp_need_002",
        name: "Post Matric Scholarship for SC/ST Students",
        provider: "Ministry of Social Justice and Empowerment",
        amount: 75000,
        category: "SC/ST",
        description:
          "Financial assistance for SC/ST students pursuing post-matriculation courses.",
        eligibleStates: ["All"],
        minGrade: 10,
        maxGrade: 12,
        deadline: nextWeek.toISOString().split("T")[0],
        requirements: [
          "SC/ST certificate",
          "Income certificate",
          "Previous year mark sheet",
          "Admission proof",
        ],
        applicationUrl: "https://scholarships.gov.in/",
        isLive: true,
        lastUpdated: new Date().toISOString(),
        source: "nsp",
        priority: "high",
        tags: ["sc-st", "urgent", "government"],
      },
      {
        id: "nsp_minority_003",
        name: "Pre-Matric Scholarship for Minorities",
        provider: "Ministry of Minority Affairs",
        amount: 50000,
        category: "Minority",
        description:
          "Scholarship for minority community students studying in classes 1-10.",
        eligibleStates: ["All"],
        minGrade: 1,
        maxGrade: 10,
        deadline: nextMonth.toISOString().split("T")[0],
        requirements: [
          "Minority community certificate",
          "Income certificate (below ₹1 lakh)",
          "School admission proof",
          "Bank account details",
        ],
        applicationUrl: "https://scholarships.gov.in/",
        isLive: true,
        lastUpdated: new Date().toISOString(),
        source: "nsp",
        priority: "medium",
        tags: ["minority", "pre-matric", "government"],
      },
    ];
  }
}

export class AICTEDataSource {
  private baseUrl = "https://www.aicte-india.org/api";
  private apiKey = process.env.AICTE_API_KEY;

  async fetchLiveScholarships(): Promise<RealtimeScholarship[]> {
    if (!this.apiKey) {
      console.warn("AICTE API key not configured, returning sample data");
      return this.getSampleData();
    }

    try {
      const response = await fetch(`${this.baseUrl}/scholarships`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 600 }, // 10 minutes cache
      });

      if (!response.ok) throw new Error(`AICTE API error: ${response.status}`);

      const data = await response.json();
      return this.normalizeAICTEData(data);
    } catch (error) {
      console.error("AICTE API fetch failed:", error);
      return [];
    }
  }

  private normalizeAICTEData(data: any[]): RealtimeScholarship[] {
    return data.map((item) => ({
      id: `aicte_${item.slug || item.id}`,
      name: item.title || item.name,
      provider: "AICTE, Government of India",
      amount: item.amount || 50000,
      category: item.category || item.segment || "Technical",
      description: item.description || item.summary || "",
      eligibleStates: ["All"],
      minGrade: 12,
      maxGrade: 12,
      deadline: item.deadline || item.lastDate || "",
      requirements: this.parseRequirements(
        item.eligibility || item.requirements
      ),
      applicationUrl:
        item.url ||
        item.link ||
        "https://www.aicte-india.org/schemes/students-development-schemes",
      isLive: item.isActive !== false,
      lastUpdated: new Date().toISOString(),
      source: "aicte" as const,
      priority: this.calculatePriority(item),
      tags: this.generateTags(item),
    }));
  }

  private parseRequirements(req: any): string[] {
    if (!req) return [];
    if (Array.isArray(req)) return req;
    return req
      .split("\n")
      .map((r: string) => r.trim())
      .filter(Boolean);
  }

  private calculatePriority(item: any): "high" | "medium" | "low" {
    const amount = item.amount || 0;
    const daysLeft = this.getDaysUntilDeadline(item.deadline);

    if (amount >= 50000 || daysLeft <= 7) return "high";
    if (amount >= 20000 || daysLeft <= 30) return "medium";
    return "low";
  }

  private generateTags(item: any): string[] {
    const tags = ["technical", "aicte"];
    if (item.category) tags.push(item.category.toLowerCase());
    if (item.amount >= 50000) tags.push("high-value");
    if (this.getDaysUntilDeadline(item.deadline) <= 30) tags.push("urgent");
    return tags;
  }

  private getDaysUntilDeadline(deadline: string): number {
    if (!deadline) return 365;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getSampleData(): RealtimeScholarship[] {
    const today = new Date();
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    return [
      {
        id: "aicte_technical_001",
        name: "AICTE Pragati Scholarship for Girls",
        provider: "AICTE, Government of India",
        amount: 50000,
        category: "Technical",
        description:
          "Scholarship for girl students pursuing technical education in AICTE approved institutions.",
        eligibleStates: ["All"],
        minGrade: 12,
        maxGrade: 12,
        deadline: nextMonth.toISOString().split("T")[0],
        requirements: [
          "Girl student",
          "Admission in AICTE approved institution",
          "Family income below ₹8 lakhs per annum",
          "Valid admission proof",
        ],
        applicationUrl:
          "https://www.aicte-india.org/schemes/students-development-schemes",
        isLive: true,
        lastUpdated: new Date().toISOString(),
        source: "aicte",
        priority: "medium",
        tags: ["technical", "girls", "aicte"],
      },
    ];
  }
}

export class StateScholarshipDataSource {
  private baseUrl = "https://api.state-scholarships.gov.in";
  private apiKey = process.env.STATE_SCHOLARSHIPS_API_KEY;

  async fetchLiveScholarships(state?: string): Promise<RealtimeScholarship[]> {
    if (!this.apiKey) {
      console.warn("State Scholarships API key not configured");
      return [];
    }

    try {
      const url = state
        ? `${this.baseUrl}/scholarships/${state}`
        : `${this.baseUrl}/scholarships`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 900 }, // 15 minutes cache
      });

      if (!response.ok) throw new Error(`State API error: ${response.status}`);

      const data = await response.json();
      return this.normalizeStateData(data);
    } catch (error) {
      console.error("State Scholarships API fetch failed:", error);
      return [];
    }
  }

  private normalizeStateData(data: any[]): RealtimeScholarship[] {
    return data.map((item) => ({
      id: `state_${item.id || item.slug}`,
      name: item.name || item.scheme,
      provider: item.department || item.provider || "State Government",
      amount: item.amount || 0,
      category: item.category || "State",
      description: item.description || "",
      eligibleStates: this.parseStates(item.state || item.states),
      minGrade: item.minGrade || 8,
      maxGrade: item.maxGrade || 12,
      deadline: item.deadline || item.lastDate || "",
      requirements: this.parseRequirements(
        item.eligibility || item.requirements
      ),
      applicationUrl: item.url || item.applyUrl || "",
      isLive: item.isActive !== false,
      lastUpdated: new Date().toISOString(),
      source: "state" as const,
      priority: this.calculatePriority(item),
      tags: this.generateTags(item),
    }));
  }

  private parseStates(states: any): string[] {
    if (!states) return ["All"];
    if (Array.isArray(states)) return states;
    return states.split(",").map((s: string) => s.trim());
  }

  private parseRequirements(req: any): string[] {
    if (!req) return [];
    if (Array.isArray(req)) return req;
    return req
      .split("\n")
      .map((r: string) => r.trim())
      .filter(Boolean);
  }

  private calculatePriority(item: any): "high" | "medium" | "low" {
    const amount = item.amount || 0;
    const daysLeft = this.getDaysUntilDeadline(item.deadline);

    if (amount >= 30000 || daysLeft <= 7) return "high";
    if (amount >= 10000 || daysLeft <= 30) return "medium";
    return "low";
  }

  private generateTags(item: any): string[] {
    const tags = ["state"];
    if (item.category) tags.push(item.category.toLowerCase());
    if (item.department)
      tags.push(item.department.toLowerCase().replace(/\s+/g, "-"));
    if (item.amount >= 30000) tags.push("high-value");
    if (this.getDaysUntilDeadline(item.deadline) <= 30) tags.push("urgent");
    return tags;
  }

  private getDaysUntilDeadline(deadline: string): number {
    if (!deadline) return 365;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

// Private scholarship sources
export class PrivateScholarshipDataSource {
  // Configure private sources via env var PRIVATE_SCHOLARSHIP_SOURCES as a comma-separated list.
  // If not set, we skip private sources to avoid unreliable placeholders.
  private sources: string[] = (process.env.PRIVATE_SCHOLARSHIP_SOURCES || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    // Backward-compat: if explicitly set to "disabled", treat as empty
    .filter((s) => s.toLowerCase() !== "disabled");

  async fetchLiveScholarships(): Promise<RealtimeScholarship[]> {
    const results: RealtimeScholarship[] = [];

    if (!this.sources.length) {
      return results;
    }

    for (const source of this.sources) {
      try {
        // Add a short timeout to prevent long stalls on unreachable hosts
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(source, {
          headers: {
            "Content-Type": "application/json",
          },
          next: { revalidate: 1800 }, // 30 minutes cache
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) continue;

        const data = await response.json();
        const scholarships = this.normalizePrivateData(data, source);
        results.push(...scholarships);
      } catch (error) {
        console.warn(
          `Private source ${source} failed:`,
          (error as Error)?.message || error
        );
      }
    }

    return results;
  }

  private normalizePrivateData(
    data: any,
    source: string
  ): RealtimeScholarship[] {
    if (!Array.isArray(data)) return [];

    return data.map((item) => ({
      id: `private_${item.id || Math.random().toString(36).substr(2, 9)}`,
      name: item.title || item.name,
      provider: item.provider || item.company || "Private Organization",
      amount: item.amount || item.value || 0,
      category: item.category || "Private",
      description: item.description || item.summary || "",
      eligibleStates: this.parseStates(item.eligibleStates || item.states),
      minGrade: item.minGrade || 10,
      maxGrade: item.maxGrade || 12,
      deadline: item.deadline || item.lastDate || "",
      requirements: this.parseRequirements(
        item.requirements || item.eligibility
      ),
      applicationUrl: item.url || item.applyUrl || "",
      isLive: item.isActive !== false,
      lastUpdated: new Date().toISOString(),
      source: "private" as const,
      priority: this.calculatePriority(item),
      tags: this.generateTags(item, source),
    }));
  }

  private parseStates(states: any): string[] {
    if (!states) return ["All"];
    if (Array.isArray(states)) return states;
    return states.split(",").map((s: string) => s.trim());
  }

  private parseRequirements(req: any): string[] {
    if (!req) return [];
    if (Array.isArray(req)) return req;
    return req
      .split("\n")
      .map((r: string) => r.trim())
      .filter(Boolean);
  }

  private calculatePriority(item: any): "high" | "medium" | "low" {
    const amount = item.amount || item.value || 0;
    const daysLeft = this.getDaysUntilDeadline(item.deadline || item.lastDate);

    if (amount >= 100000 || daysLeft <= 7) return "high";
    if (amount >= 50000 || daysLeft <= 30) return "medium";
    return "low";
  }

  private generateTags(item: any, source: string): string[] {
    const tags = ["private"];
    if (item.category) tags.push(item.category.toLowerCase());
    if (item.provider)
      tags.push(item.provider.toLowerCase().replace(/\s+/g, "-"));
    if (item.amount >= 100000) tags.push("high-value");
    if (this.getDaysUntilDeadline(item.deadline) <= 30) tags.push("urgent");
    return tags;
  }

  private getDaysUntilDeadline(deadline: string): number {
    if (!deadline) return 365;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

// Main real-time scholarship aggregator
export class RealtimeScholarshipAggregator {
  private nspSource = new NSPDataSource();
  private aicteSource = new AICTEDataSource();
  private stateSource = new StateScholarshipDataSource();
  private privateSource = new PrivateScholarshipDataSource();
  private cache = new Map<string, RealtimeScholarship[]>();
  private lastUpdate = new Map<string, number>();

  async fetchAllScholarships(state?: string): Promise<RealtimeScholarship[]> {
    const cacheKey = `all_${state || "all"}`;
    const now = Date.now();
    const lastUpdateTime = this.lastUpdate.get(cacheKey) || 0;
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes

    // Return cached data if still fresh
    if (now - lastUpdateTime < cacheExpiry && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const [
        nspScholarships,
        aicteScholarships,
        stateScholarships,
        privateScholarships,
      ] = await Promise.allSettled([
        this.nspSource.fetchLiveScholarships(),
        this.aicteSource.fetchLiveScholarships(),
        this.stateSource.fetchLiveScholarships(state),
        this.privateSource.fetchLiveScholarships(),
      ]);

      const allScholarships: RealtimeScholarship[] = [];

      if (nspScholarships.status === "fulfilled") {
        allScholarships.push(...nspScholarships.value);
      }
      if (aicteScholarships.status === "fulfilled") {
        allScholarships.push(...aicteScholarships.value);
      }
      if (stateScholarships.status === "fulfilled") {
        allScholarships.push(...stateScholarships.value);
      }
      if (privateScholarships.status === "fulfilled") {
        allScholarships.push(...privateScholarships.value);
      }

      // Deduplicate and merge
      const deduplicated = this.deduplicateScholarships(allScholarships);

      // Cache the results
      this.cache.set(cacheKey, deduplicated);
      this.lastUpdate.set(cacheKey, now);

      return deduplicated;
    } catch (error) {
      console.error("Failed to fetch real-time scholarships:", error);
      return this.cache.get(cacheKey) || [];
    }
  }

  private deduplicateScholarships(
    scholarships: RealtimeScholarship[]
  ): RealtimeScholarship[] {
    const seen = new Set<string>();
    const result: RealtimeScholarship[] = [];

    for (const scholarship of scholarships) {
      const key = `${scholarship.name.toLowerCase()}_${scholarship.provider.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(scholarship);
      }
    }

    return result.sort((a, b) => {
      // Sort by priority first, then by amount
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      return b.amount - a.amount;
    });
  }

  async getScholarshipUpdates(since?: string): Promise<ScholarshipUpdate[]> {
    const allScholarships = await this.fetchAllScholarships();
    const updates: ScholarshipUpdate[] = [];

    for (const scholarship of allScholarships) {
      const daysLeft = this.getDaysUntilDeadline(scholarship.deadline);

      // Check for deadline approaching
      if (daysLeft <= 7 && daysLeft > 0) {
        updates.push({
          type: "deadline_approaching",
          scholarship,
          timestamp: new Date().toISOString(),
        });
      }

      // Check for recently updated scholarships
      if (since) {
        const lastUpdate = new Date(scholarship.lastUpdated);
        const sinceDate = new Date(since);
        if (lastUpdate > sinceDate) {
          updates.push({
            type: "updated",
            scholarship,
            timestamp: scholarship.lastUpdated,
          });
        }
      }
    }

    return updates;
  }

  private getDaysUntilDeadline(deadline: string): number {
    if (!deadline) return 365;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

// Export singleton instance
export const realtimeScholarshipAggregator =
  new RealtimeScholarshipAggregator();
