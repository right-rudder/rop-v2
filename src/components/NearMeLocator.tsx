"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { DEFAULT_RADIUS, formatNearParam } from "@/lib/geo";

type Status = "idle" | "locating" | "denied" | "unavailable";

/**
 * "Use my location" → the advanced search, pre-set to a radius around the
 * visitor and sorted by distance. Same geolocation contract as the search
 * page's own locate button, so a denied or unavailable position gives the
 * visitor a way forward instead of a dead end.
 */
export function NearMeLocator() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");

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
        router.push(`/search?near=${encodeURIComponent(near)}&radius=${DEFAULT_RADIUS}&sort=distance&dir=asc`);
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { timeout: 10_000, maximumAge: 300_000 },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Button onClick={locate} disabled={status === "locating"}>
          <LocateFixed size={15} aria-hidden />
          {status === "locating" ? "Finding your location…" : "Use my location"}
        </Button>
        <Button href="/search" variant="secondary">
          <Search size={15} aria-hidden />
          Search by airport or city
        </Button>
      </div>
      {status === "denied" && (
        <Notice tone="info">
          Location access was turned off. Pick a metro below, or search by airport code or city instead.
        </Notice>
      )}
      {status === "unavailable" && (
        <Notice tone="info">
          We couldn&apos;t read your location on this device. Pick a metro below, or search by airport code or city instead.
        </Notice>
      )}
    </div>
  );
}
