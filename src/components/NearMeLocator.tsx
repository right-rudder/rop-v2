"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { DEFAULT_RADIUS, RADIUS_OPTIONS, formatNearParam, type Radius } from "@/lib/geo";
import { cn } from "@/lib/cn";

type Status = "idle" | "locating" | "denied" | "unavailable";

/**
 * "Use my location" → the advanced search, pre-set to the chosen radius
 * around the visitor and sorted by distance. Same geolocation contract as the
 * search page's own locate button, so a denied or unavailable position gives
 * the visitor a way forward instead of a dead end.
 */
export function NearMeLocator() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [radius, setRadius] = useState<Radius>(DEFAULT_RADIUS);

  const locate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation || !window.isSecureContext) {
      setStatus("unavailable");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const near = formatNearParam({
          kind: "geo",
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        });
        router.push(`/search?near=${encodeURIComponent(near)}&radius=${radius}&sort=distance&dir=asc`);
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { timeout: 10_000, maximumAge: 300_000 },
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <fieldset>
        <legend className="mb-2.5 font-mono text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Search radius
        </legend>
        <div
          role="radiogroup"
          aria-label="Search radius in miles"
          className="inline-flex rounded-xl border border-line bg-surface p-1"
        >
          {RADIUS_OPTIONS.map((r) => {
            const selected = r === radius;
            return (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setRadius(r)}
                className={cn(
                  "h-9 min-w-16 rounded-lg px-3 font-mono text-sm font-semibold tabular-nums transition-[background-color,color,box-shadow] duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                  selected ? "bg-ink text-paper shadow-sm" : "text-muted hover:text-ink",
                )}
              >
                {r}
                <span className="ml-0.5 text-[0.7em] font-medium opacity-70">mi</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button onClick={locate} disabled={status === "locating"} size="lg">
          <LocateFixed
            size={16}
            aria-hidden
            className={cn(status === "locating" && "animate-pulse")}
          />
          {status === "locating" ? "Finding your location…" : `Find schools within ${radius} miles`}
        </Button>
        <Link
          href="/search"
          className="group inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          Or search by airport or city
          <ArrowRight
            size={14}
            aria-hidden
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      {status === "denied" && (
        <Notice tone="info" className="max-w-xl">
          Location access is off for this site. Start from a metro below, or search by airport
          code or city instead.
        </Notice>
      )}
      {status === "unavailable" && (
        <Notice tone="info" className="max-w-xl">
          We couldn&apos;t read your location on this device. Start from a metro below, or search
          by airport code or city instead.
        </Notice>
      )}
    </div>
  );
}
