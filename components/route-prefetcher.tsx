"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/components/user-profile-provider";

const COMMON_AUTH_ROUTES = [
  "/dashboard",
  "/progress-tracker",
  "/roadmap",
  "/resume-optimizer",
  "/ask",
  "/ask-teacher",
  "/quiz",
  "/quiz/progress",
  "/scholarships",
  "/career-guidance",
  "/notifications",
];

export function RoutePrefetcher() {
  const router = useRouter();
  const { status, data } = useUserProfile();

  useEffect(() => {
    if (status !== "ready" || !data?.user) return;

    const schedule =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? window.requestIdleCallback.bind(window)
        : (callback: IdleRequestCallback) =>
            window.setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline), 120);

    const cancel =
      typeof window !== "undefined" && "cancelIdleCallback" in window
        ? window.cancelIdleCallback.bind(window)
        : window.clearTimeout.bind(window);

    const handle = schedule(() => {
      for (const route of COMMON_AUTH_ROUTES) {
        router.prefetch(route);
      }
    });

    return () => cancel(handle);
  }, [data?.user, router, status]);

  return null;
}
