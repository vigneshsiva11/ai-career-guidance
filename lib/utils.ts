import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple i18n store using localStorage + event dispatch
export type SupportedLanguage = 'en' | 'hi' | 'ta' | 'bn' | 'te' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'ur' | 'or' | 'as' | 'sa'

const LANGUAGE_STORAGE_KEY = 'classless_lang'

export function getStoredLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'en'
  const v = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage | null
  return (v as SupportedLanguage) || 'en'
}

export function setStoredLanguage(lang: SupportedLanguage) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
  window.dispatchEvent(new CustomEvent('classless:language-changed', { detail: { lang } }))
}

// Simple in-memory cache with TTL
type CacheEntry<T> = { value: T; expiresAt: number }
const memoryCache: Record<string, CacheEntry<unknown>> = {}

export function cacheGet<T>(key: string): T | null {
  const entry = memoryCache[key]
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    delete memoryCache[key]
    return null
  }
  return entry.value as T
}

export function cacheSet<T>(key: string, value: T, ttlMs: number) {
  memoryCache[key] = { value, expiresAt: Date.now() + ttlMs }
}
