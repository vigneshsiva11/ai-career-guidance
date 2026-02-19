"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[GlobalErrorBoundary]", error);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-slate-900">Application error</h2>
          <p className="mt-2 text-slate-600">
            A runtime error occurred. Refresh the page or retry.
          </p>
          <button
            onClick={reset}
            className="mt-4 rounded-full bg-indigo-600 px-4 py-2 text-white transition-all duration-300 hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}

