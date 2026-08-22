"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { Notice } from "@/components/ui/Notice";
import { cn } from "@/lib/cn";
import { formatMiles } from "@/lib/geo";
import type { LatLng } from "@/lib/types";

export type MapSchool = {
  id: string;
  name: string;
  href: string;
  airportCode: string;
  location: string;
  rating: number;
  reviewCount: number;
  coords?: LatLng;
  distanceMiles?: number;
};

type Props = {
  schools: MapSchool[];
  origin?: { coords: LatLng; label: string };
  radiusMiles?: number;
  className?: string;
  /** "tall" for a results view, "compact" for a sidebar card. */
  height?: "tall" | "compact";
  /** Zoom used when there is exactly one pin and no radius circle. */
  zoom?: number;
};

type Libs = {
  Map: typeof google.maps.Map;
  InfoWindow: typeof google.maps.InfoWindow;
  Circle: typeof google.maps.Circle;
  LatLngBounds: typeof google.maps.LatLngBounds;
  AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement;
};

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";
const MILE_IN_METERS = 1609.344;
const US_CENTER: LatLng = { lat: 39.5, lng: -98.35 };

let optionsSet = false;
async function loadLibs(): Promise<Libs> {
  if (!optionsSet) {
    setOptions({ key: API_KEY ?? "", v: "weekly" });
    optionsSet = true;
  }
  const [core, maps, marker] = await Promise.all([
    importLibrary("core"),
    importLibrary("maps"),
    importLibrary("marker"),
  ]);
  return {
    Map: maps.Map,
    InfoWindow: maps.InfoWindow,
    Circle: maps.Circle,
    LatLngBounds: core.LatLngBounds,
    AdvancedMarkerElement: marker.AdvancedMarkerElement,
  };
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function coordsKey(c: LatLng): string {
  return `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`;
}

/** Accent pill labelled with the ICAO; count badge when several schools share the pin. */
function buildPin(group: MapSchool[]): HTMLElement {
  const el = document.createElement("div");
  el.className =
    "flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-white shadow-card";
  el.textContent = group[0].airportCode;
  if (group.length > 1) {
    const badge = document.createElement("span");
    badge.className = "rounded-full bg-white/25 px-1.5 text-[10px] leading-4";
    badge.textContent = String(group.length);
    el.appendChild(badge);
  }
  return el;
}

function buildOriginDot(): HTMLElement {
  const el = document.createElement("div");
  el.className = "h-4 w-4 rounded-full border-[3px] border-white bg-sky shadow-card";
  return el;
}

/** InfoWindow body. Built with DOM APIs (textContent) so school names are never parsed as HTML. */
function buildInfo(group: MapSchool[]): HTMLElement {
  const root = document.createElement("div");
  root.className = "min-w-[220px] max-w-[280px] font-sans";
  const head = document.createElement("p");
  head.className = "mb-2 font-mono text-[11px] uppercase tracking-wider";
  head.style.opacity = "0.7";
  head.textContent = `${group[0].airportCode} · ${group[0].location}`;
  root.appendChild(head);
  const list = document.createElement("ul");
  list.className = "space-y-2";
  for (const s of group) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = s.href;
    a.className = "block font-semibold leading-tight";
    a.style.color = cssVar("--accent-ink");
    a.textContent = s.name;
    li.appendChild(a);
    const meta = document.createElement("p");
    meta.className = "mt-0.5 text-xs";
    meta.style.opacity = "0.75";
    const parts = [
      s.reviewCount > 0
        ? `★ ${s.rating.toFixed(1)} · ${s.reviewCount} review${s.reviewCount === 1 ? "" : "s"}`
        : "No reviews yet",
      s.distanceMiles !== undefined ? formatMiles(s.distanceMiles) : null,
    ].filter(Boolean);
    meta.textContent = parts.join(" · ");
    li.appendChild(meta);
    list.appendChild(li);
  }
  root.appendChild(list);
  return root;
}

export function SchoolsMap({
  schools,
  origin,
  radiusMiles,
  className,
  height = "tall",
  zoom = 11,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const [libs, setLibs] = useState<Libs | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mappable = useMemo(() => schools.filter((s) => s.coords), [schools]);
  const missing = schools.length - mappable.length;

  // 1. Load the API once.
  useEffect(() => {
    if (!API_KEY) return;
    let cancelled = false;
    loadLibs()
      .then((l) => {
        if (!cancelled) setLibs(l);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load Google Maps.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Create the map; colorScheme is construction-only, so re-create on theme change.
  useEffect(() => {
    if (!libs || !containerRef.current) return;
    const instance = new libs.Map(containerRef.current, {
      mapId: MAP_ID,
      colorScheme: dark ? "DARK" : "LIGHT",
      center: US_CENTER,
      zoom: 4,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      gestureHandling: "cooperative",
    });
    setMap(instance);
    return () => setMap(null);
  }, [libs, dark]);

  // 3. Overlays: grouped pins, InfoWindow, origin dot + radius circle, viewport.
  useEffect(() => {
    if (!libs || !map) return;
    const info = new libs.InfoWindow();
    const markers: google.maps.marker.AdvancedMarkerElement[] = [];
    const bounds = new libs.LatLngBounds();
    const accent = cssVar("--accent");

    const groups = new Map<string, MapSchool[]>();
    for (const s of mappable) {
      const key = coordsKey(s.coords!);
      const g = groups.get(key);
      if (g) g.push(s);
      else groups.set(key, [s]);
    }
    for (const group of groups.values()) {
      const position = group[0].coords!;
      const marker = new libs.AdvancedMarkerElement({
        map,
        position,
        content: buildPin(group),
        title: group.map((s) => s.name).join(", "),
      });
      marker.addListener("click", () => {
        info.setContent(buildInfo(group));
        info.open({ map, anchor: marker });
      });
      markers.push(marker);
      bounds.extend(position);
    }

    let originMarker: google.maps.marker.AdvancedMarkerElement | null = null;
    let circle: google.maps.Circle | null = null;
    if (origin) {
      originMarker = new libs.AdvancedMarkerElement({
        map,
        position: origin.coords,
        content: buildOriginDot(),
        title: origin.label,
        zIndex: 10,
      });
      bounds.extend(origin.coords);
      if (radiusMiles) {
        circle = new libs.Circle({
          map,
          center: origin.coords,
          radius: radiusMiles * MILE_IN_METERS,
          strokeColor: accent,
          strokeOpacity: 0.8,
          strokeWeight: 1.5,
          fillColor: accent,
          fillOpacity: 0.08,
          clickable: false,
        });
        const cb = circle.getBounds();
        if (cb) bounds.union(cb);
      }
    }

    const pinCount = markers.length + (originMarker ? 1 : 0);
    if (pinCount === 1 && !circle) {
      map.setCenter(bounds.getCenter());
      map.setZoom(zoom);
    } else if (pinCount > 0) {
      map.fitBounds(bounds, 48);
    }

    return () => {
      info.close();
      for (const m of markers) m.map = null;
      if (originMarker) originMarker.map = null;
      circle?.setMap(null);
    };
  }, [libs, map, mappable, origin, radiusMiles, zoom]);

  if (!API_KEY) {
    return (
      <Notice tone="info" className={className}>
        The map view needs a Google Maps API key. Set{" "}
        <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in{" "}
        <code className="font-mono">.env.local</code> and restart the dev server. The list view works without it.
      </Notice>
    );
  }

  return (
    <div className={className}>
      <div
        role="region"
        aria-label="Map of matching flight schools"
        className={cn(
          "relative overflow-hidden rounded-2xl border border-line bg-surface-2",
          height === "compact" ? "h-56" : "h-[70vh] min-h-[420px]",
        )}
      >
        <div ref={containerRef} className="h-full w-full" />
        {!libs && !error && (
          <p className="absolute inset-0 flex items-center justify-center font-mono text-xs uppercase tracking-[0.12em] text-muted">
            Loading map…
          </p>
        )}
        {error && (
          <div className="absolute inset-x-4 top-4">
            <Notice tone="error">Couldn&apos;t load Google Maps: {error}</Notice>
          </div>
        )}
        {libs && !error && mappable.length === 0 && (
          <p className="pointer-events-none absolute inset-x-4 top-4 rounded-xl border border-line bg-surface px-4 py-3 text-center text-sm text-muted shadow-card">
            None of the matching schools have a map location yet.
          </p>
        )}
      </div>
      {missing > 0 && mappable.length > 0 && (
        <p className="mt-2 text-xs text-muted">
          {missing} matching school{missing === 1 ? " has" : "s have"} no map location and{" "}
          {missing === 1 ? "isn't" : "aren't"} shown on the map.
        </p>
      )}
    </div>
  );
}
