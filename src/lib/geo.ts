/**
 * Pure geo helpers for "near me" search. No React, no Supabase, relative
 * imports only (scripts/tests run this under node --test without the
 * "@/" alias).
 */
import type { LatLng } from "./types";

/** Same rule as utils.isAirportCode; kept local so this module has no runtime imports (node --test cannot resolve extension-less TS imports). */
const AIRPORT_CODE = /^[a-z0-9]{3,4}$/i;

export const RADIUS_OPTIONS = [25, 50, 100, 250] as const;
export type Radius = (typeof RADIUS_OPTIONS)[number];
export const DEFAULT_RADIUS: Radius = 50;

export type NearOrigin =
  | { kind: "geo"; coords: LatLng }
  | { kind: "airport"; icao: string; coords: LatLng; label: string }
  | { kind: "city"; slug: string; coords: LatLng; label: string };

export type NearLookup = {
  airportByIcao: (icao: string) => { coords: LatLng; label: string } | undefined;
  cityBySlug: (slug: string) => { coords: LatLng; label: string } | undefined;
};

const EARTH_RADIUS_MI = 3958.7613;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

/** Great-circle distance in statute miles. */
export function haversineMiles(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isValidLatLng(p: { lat: number; lng: number }): p is LatLng {
  return (
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    Math.abs(p.lat) <= 90 &&
    Math.abs(p.lng) <= 180
  );
}

export function parseRadius(param: string | null): Radius {
  const n = Number(param);
  return (RADIUS_OPTIONS as readonly number[]).includes(n) ? (n as Radius) : DEFAULT_RADIUS;
}

export function centroid(points: LatLng[]): LatLng | undefined {
  if (points.length === 0) return undefined;
  let lat = 0;
  let lng = 0;
  for (const p of points) {
    lat += p.lat;
    lng += p.lng;
  }
  return { lat: lat / points.length, lng: lng / points.length };
}

export function formatMiles(miles: number): string {
  return miles < 1 ? "<1 mi" : `${Math.round(miles)} mi`;
}

export function originLabel(origin: NearOrigin): string {
  return origin.kind === "geo" ? "Your location" : origin.label;
}

/** Serialise an origin for the `near` URL param. */
export function formatNearParam(origin: NearOrigin): string {
  switch (origin.kind) {
    case "geo":
      return `${round4(origin.coords.lat)},${round4(origin.coords.lng)}`;
    case "airport":
      return origin.icao.toLowerCase();
    case "city":
      return `city:${origin.slug}`;
  }
}

/**
 * Parse the `near` URL param. Accepts `lat,lng`, an ICAO code, or
 * `city:<slug>`; anything unknown or malformed yields null.
 */
export function parseNearParam(param: string | null, lookup: NearLookup): NearOrigin | null {
  if (!param) return null;
  const value = param.trim();
  if (value.startsWith("city:")) {
    const slug = value.slice(5);
    const city = lookup.cityBySlug(slug);
    return city ? { kind: "city", slug, coords: city.coords, label: city.label } : null;
  }
  const geo = /^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(value);
  if (geo) {
    const coords = { lat: Number(geo[1]), lng: Number(geo[2]) };
    return isValidLatLng(coords)
      ? { kind: "geo", coords: { lat: round4(coords.lat), lng: round4(coords.lng) } }
      : null;
  }
  if (AIRPORT_CODE.test(value)) {
    const icao = value.toUpperCase();
    const airport = lookup.airportByIcao(icao);
    return airport ? { kind: "airport", icao, coords: airport.coords, label: airport.label } : null;
  }
  return null;
}
