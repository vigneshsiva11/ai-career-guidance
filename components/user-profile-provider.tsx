"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FullProfilePayload } from "@/lib/user-full-profile";

type UserProfileStatus = "loading" | "ready" | "error" | "unauthorized";

type UserProfileContextValue = {
  status: UserProfileStatus;
  data: FullProfilePayload | null;
  error: string;
  refreshProfile: (options?: { force?: boolean }) => Promise<FullProfilePayload | null>;
  patchProfile: (
    updater: FullProfilePayload | ((current: FullProfilePayload | null) => FullProfilePayload | null),
  ) => void;
};

const STORAGE_KEY = "classless:user-full-profile:v1";
const AUTH_STORAGE_KEY = "classless_user";
const STALE_AFTER_MS = 5 * 60 * 1000;

let memoryCache: { data: FullProfilePayload; cachedAtMs: number } | null = null;
let inflightRequest: Promise<FullProfilePayload | null> | null = null;

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

function parseStoredProfile() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data?: FullProfilePayload; cachedAtMs?: number };
    if (!parsed?.data || typeof parsed.cachedAtMs !== "number") return null;
    return { data: parsed.data, cachedAtMs: parsed.cachedAtMs };
  } catch {
    return null;
  }
}

function persistProfile(entry: { data: FullProfilePayload; cachedAtMs: number } | null) {
  if (typeof window === "undefined") return;

  try {
    if (!entry) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // Ignore localStorage write failures so the in-memory cache still works.
  }
}

function hasStoredAuthHint() {
  if (typeof window === "undefined") return false;

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && typeof parsed === "object" && parsed.id);
  } catch {
    return false;
  }
}

async function parseJsonSafely(response: Response) {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON response (status ${response.status}).`);
  }
}

function isEntryFresh(entry: { cachedAtMs: number } | null) {
  if (!entry) return false;
  return Date.now() - entry.cachedAtMs < STALE_AFTER_MS;
}

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const initialEntry = memoryCache;
  const [status, setStatus] = useState<UserProfileStatus>(initialEntry ? "ready" : "loading");
  const [data, setData] = useState<FullProfilePayload | null>(initialEntry?.data || null);
  const [error, setError] = useState("");
  const hasHydratedCacheRef = useRef(false);

  const applyProfile = useCallback((entry: { data: FullProfilePayload; cachedAtMs: number } | null) => {
    memoryCache = entry;
    persistProfile(entry);
    setData(entry?.data || null);
    setStatus(entry ? "ready" : "loading");
    setError("");
  }, []);

  const patchProfile = useCallback(
    (
      updater: FullProfilePayload | ((current: FullProfilePayload | null) => FullProfilePayload | null),
    ) => {
      setData((current) => {
        const next =
          typeof updater === "function"
            ? (updater as (current: FullProfilePayload | null) => FullProfilePayload | null)(current)
            : updater;

        if (next) {
          const entry = { data: next, cachedAtMs: Date.now() };
          memoryCache = entry;
          persistProfile(entry);
          setStatus("ready");
          setError("");
        }

        return next;
      });
    },
    [],
  );

  const refreshProfile = useCallback(async (options?: { force?: boolean }) => {
    const force = Boolean(options?.force);

    if (!force && isEntryFresh(memoryCache)) {
      return memoryCache?.data || null;
    }

    if (!force && inflightRequest) {
      return inflightRequest;
    }

    inflightRequest = (async () => {
      try {
        if (!force && !hasStoredAuthHint()) {
          memoryCache = null;
          persistProfile(null);
          setData(null);
          setStatus("unauthorized");
          setError("");
          return null;
        }

        const response = await fetch("/api/user/full-profile", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        if (response.status === 401) {
          memoryCache = null;
          persistProfile(null);
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(AUTH_STORAGE_KEY);
          }
          setData(null);
          setStatus("unauthorized");
          setError("");
          return null;
        }

        const result = await parseJsonSafely(response);
        if (!result.success || !result.data) {
          throw new Error(result.error || "Failed to load profile");
        }

        const entry = {
          data: result.data as FullProfilePayload,
          cachedAtMs: Date.now(),
        };
        applyProfile(entry);
        return entry.data;
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : "Failed to load profile";
        setError(message);
        setStatus(memoryCache ? "ready" : "error");
        return memoryCache?.data || null;
      } finally {
        inflightRequest = null;
      }
    })();

    return inflightRequest;
  }, [applyProfile]);

  useEffect(() => {
    if (!hasHydratedCacheRef.current) {
      hasHydratedCacheRef.current = true;

      if (!memoryCache) {
        const stored = parseStoredProfile();
        if (stored) {
          memoryCache = stored;
          setData(stored.data);
          setStatus("ready");
        }
      }
    }

    void refreshProfile({ force: hasStoredAuthHint() });
  }, [refreshProfile]);

  useEffect(() => {
    const handleAuthChanged = () => {
      void refreshProfile({ force: true });
    };

    window.addEventListener("classless:auth-changed", handleAuthChanged);
    window.addEventListener("classless:profile-changed", handleAuthChanged);
    window.addEventListener("storage", handleAuthChanged);

    return () => {
      window.removeEventListener("classless:auth-changed", handleAuthChanged);
      window.removeEventListener("classless:profile-changed", handleAuthChanged);
      window.removeEventListener("storage", handleAuthChanged);
    };
  }, [refreshProfile]);

  const contextValue = useMemo<UserProfileContextValue>(
    () => ({
      status,
      data,
      error,
      refreshProfile,
      patchProfile,
    }),
    [status, data, error, refreshProfile, patchProfile],
  );

  return (
    <UserProfileContext.Provider value={contextValue}>{children}</UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within UserProfileProvider");
  }
  return context;
}
