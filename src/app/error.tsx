"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Plane } from "lucide-react";

/**
 * Route-level error boundary. Data-layer failures (orThrow in src/lib/data.ts)
 * land here instead of Next's default error screen.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center py-20">
      <div className="mb-6 text-rose-700 dark:text-rose-400 opacity-60">
        <Plane size={64} strokeWidth={1} />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
        Something went wrong
      </h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-2">
        We couldn&apos;t load this page. Please try again in a moment.
      </p>
      {error.digest && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-8">
          Reference: {error.digest}
        </p>
      )}
      <div className="flex flex-wrap gap-3 justify-center mt-4">
        <button
          type="button"
          onClick={reset}
          className="px-5 py-2.5 bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-800 transition"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
