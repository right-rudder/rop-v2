"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionalMotif } from "@/components/ui/SectionalMotif";

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
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center">
      <SectionalMotif className="pointer-events-none absolute left-1/2 top-1/2 h-[50rem] w-[50rem] -translate-x-1/2 -translate-y-1/2 opacity-[0.1]" />
      <div className="relative">
        <Eyebrow accent className="justify-center">
          Something went wrong
        </Eyebrow>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink md:text-5xl">
          We couldn&apos;t load this page.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          Try again in a moment. If it keeps happening, head back to the home page.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-muted">Reference: {error.digest}</p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button href="/" variant="secondary">
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
