"use client";

import { useEffect } from "react";

export function RuntimeErrorGuard() {
  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason =
        event.reason instanceof Error ? event.reason : String(event.reason);
      console.error("[Runtime] Unhandled promise rejection:", reason);
    };

    const onWindowError = (event: ErrorEvent) => {
      console.error("[Runtime] Window error:", event.message || event.error);
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onWindowError);

    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onWindowError);
    };
  }, []);

  return null;
}

