import type { Scholarship } from "./database"
import { cacheGet, cacheSet } from "./utils"

export interface FetchScholarshipsOptions {
  cacheTtlMs?: number
  state?: string
  category?: string
}

const DEFAULT_TTL = 6 * 60 * 60 * 1000 // 6 hours

export async function fetchLiveScholarships(options: FetchScholarshipsOptions = {}): Promise<Scholarship[]> {
  const { cacheTtlMs = DEFAULT_TTL, state, category } = options
  const cacheKey = `scholarships:live:${state || 'all'}:${category || 'all'}`

  const cached = cacheGet<Scholarship[]>(cacheKey)
  if (cached) return cached

  const sources: Array<() => Promise<Scholarship[]>> = []

  if (process.env.NSP_API_URL) {
    sources.push(async () => {
      const url = buildUrl(process.env.NSP_API_URL as string, { state, category })
      const res = await fetch(url, { next: { revalidate: 3600 } })
      if (!res.ok) throw new Error(`NSP fetch failed: ${res.status}`)
      const data = await res.json()
      return normalizeNsp(data)
    })
  }

  if (process.env.AICTE_API_URL) {
    sources.push(async () => {
      const url = buildUrl(process.env.AICTE_API_URL as string, {})
      const res = await fetch(url, { next: { revalidate: 3600 } })
      if (!res.ok) throw new Error(`AICTE fetch failed: ${res.status}`)
      const data = await res.json()
      return normalizeAicte(data)
    })
  }

  if (process.env.STATE_SCHOLARSHIPS_API_URL) {
    sources.push(async () => {
      const url = buildUrl(process.env.STATE_SCHOLARSHIPS_API_URL as string, { state })
      const res = await fetch(url, { next: { revalidate: 3600 } })
      if (!res.ok) throw new Error(`STATE fetch failed: ${res.status}`)
      const data = await res.json()
      return normalizeState(data)
    })
  }

  if (sources.length === 0) return []

  const results: Scholarship[][] = []
  for (const loader of sources) {
    try {
      const items = await loader()
      results.push(items)
    } catch (err) {
      console.error("[Scholarships] Source error:", err)
    }
  }

  const aggregated = dedupeAndMerge(results.flat())
  if (aggregated.length > 0) {
    cacheSet(cacheKey, aggregated, cacheTtlMs)
  }
  return aggregated
}

function buildUrl(base: string, params: Record<string, string | undefined>) {
  try {
    const u = new URL(base)
    Object.entries(params).forEach(([k, v]) => {
      if (v) u.searchParams.set(k, v)
    })
    return u.toString()
  } catch {
    const qp = Object.entries(params)
      .filter(([, v]) => v)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`)
      .join("&")
    return qp ? `${base}${base.includes('?') ? '&' : '?'}${qp}` : base
  }
}

function normalizeNsp(data: any): Scholarship[] {
  if (!Array.isArray(data)) return []
  return data.map((item) => ({
    id: String(item.id || item.schemeId || item.code || cryptoRandomId()),
    name: String(item.name || item.schemeName || "Scholarship"),
    provider: String(item.provider || item.ministry || "Government of India"),
    amount: Number(item.amount || item.maxAmount || 0),
    category: String(item.category || item.schemeCategory || "General"),
    description: String(item.description || item.details || ""),
    eligibleStates: parseStates(item.states || item.eligibleStates || "All"),
    minGrade: Number(item.minGrade || 1),
    maxGrade: Number(item.maxGrade || 12),
    deadline: String(item.deadline || item.lastDate || item.closingDate || ""),
    requirements: Array.isArray(item.requirements) ? item.requirements : toArray(item.requirementsSummary || item.eligibility),
    applicationUrl: String(item.applyUrl || item.url || item.link || ""),
  }))
}

function normalizeAicte(data: any): Scholarship[] {
  if (!Array.isArray(data)) return []
  return data.map((item) => ({
    id: String(item.id || item.slug || cryptoRandomId()),
    name: String(item.title || item.name || "AICTE Scholarship"),
    provider: "AICTE, Government of India",
    amount: Number(item.amount || 50000),
    category: String(item.category || item.segment || "General"),
    description: String(item.description || item.summary || ""),
    eligibleStates: ["All"],
    minGrade: 12,
    maxGrade: 12,
    deadline: String(item.deadline || item.lastDate || ""),
    requirements: toArray(item.eligibility || item.requirements),
    applicationUrl: String(item.url || item.link || "https://www.aicte-india.org/schemes/students-development-schemes"),
  }))
}

function normalizeState(data: any): Scholarship[] {
  if (!Array.isArray(data)) return []
  return data.map((item) => ({
    id: String(item.id || cryptoRandomId()),
    name: String(item.name || item.scheme || "State Scholarship"),
    provider: String(item.provider || item.department || "State Government"),
    amount: Number(item.amount || 0),
    category: String(item.category || "State"),
    description: String(item.description || ""),
    eligibleStates: parseStates(item.state || item.states || item.eligibleStates || ""),
    minGrade: Number(item.minGrade || 8),
    maxGrade: Number(item.maxGrade || 12),
    deadline: String(item.deadline || item.lastDate || ""),
    requirements: toArray(item.eligibility || item.requiredDocs || item.requirements),
    applicationUrl: String(item.url || item.applyUrl || item.link || ""),
  }))
}

function parseStates(input: unknown): string[] {
  if (!input) return ["All"]
  if (Array.isArray(input)) return input.length ? input.map(String) : ["All"]
  const s = String(input)
  if (!s.trim()) return ["All"]
  if (s.toLowerCase() === 'all') return ["All"]
  return s.split(/[,|]/).map((x) => x.trim()).filter(Boolean)
}

function toArray(input: unknown): string[] {
  if (!input) return []
  if (Array.isArray(input)) return input.map(String)
  const s = String(input)
  return s.split(/\n|\.|;|,/).map((x) => x.trim()).filter(Boolean)
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    // @ts-ignore
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

function dedupeAndMerge(items: Scholarship[]): Scholarship[] {
  const map = new Map<string, Scholarship>()
  for (const s of items) {
    const key = `${s.name.toLowerCase()}|${s.provider.toLowerCase()}`
    if (!map.has(key)) {
      map.set(key, s)
      continue
    }
    const existing = map.get(key) as Scholarship
    // Prefer non-empty fields from either
    map.set(key, {
      ...existing,
      ...s,
      eligibleStates: existing.eligibleStates.length >= s.eligibleStates.length ? existing.eligibleStates : s.eligibleStates,
      requirements: existing.requirements.length >= s.requirements.length ? existing.requirements : s.requirements,
      amount: s.amount || existing.amount,
      deadline: s.deadline || existing.deadline,
      applicationUrl: s.applicationUrl || existing.applicationUrl,
    })
  }
  return Array.from(map.values())
}


