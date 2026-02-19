"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AppErrorBoundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
        <p className="mt-2 text-slate-600">
          The page hit an unexpected error. Please retry.
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-full bg-indigo-600 px-4 py-2 text-white transition-all duration-300 hover:bg-indigo-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

