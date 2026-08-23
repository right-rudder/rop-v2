import type { FlightSchool } from "./types";

/** Build the deep-nested URL for a school detail page */
export function schoolHref(
  school: Pick<FlightSchool, "stateSlug" | "citySlug" | "primaryAirportCode" | "slug">,
): string {
  return `/${school.stateSlug}/${school.citySlug}/${school.primaryAirportCode.toLowerCase()}/${school.slug}`;
}

/** Convert a display string to a URL slug: "Arizona Pilot Academy" → "arizona-pilot-academy" */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Convert a slug back to a title-cased display string: "st-louis" → "St Louis" */
export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** 3–4 character alphanumeric airport identifier (ICAO / IATA / FAA LID), any case */
export function isAirportCode(code: string): boolean {
  return /^[A-Za-z0-9]{3,4}$/.test(code);
}

/** Absolute http(s) URL — the only kind we store or link to */
export function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Pick the airport row for a user-supplied code from a single `or=` lookup
 * over icao / iata / faa_lid. ICAO — the canonical slug — wins; otherwise the
 * first row (callers order by icao) so an ambiguous alternate identifier
 * resolves deterministically instead of throwing.
 */
export function pickAirportMatch<T extends { icao: string }>(
  rows: readonly T[],
  code: string,
): T | undefined {
  return rows.find((r) => r.icao === code) ?? rows[0];
}
