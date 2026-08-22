# Near-me Search + Map View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users of `/search` filter flight schools within a radius of their location (browser geolocation or a chosen airport/city), sort by distance, and switch the results to a Google Map with airport-grouped pins.

**Architecture:** Coordinates are added to `airports` (seeded) and `flight_schools` (optional override) and flow through the existing data layer into the payload `/search` already ships to the client. Distance filtering/sorting stays client-side (Haversine in `src/lib/geo.ts`) inside `AdvancedSearchExplorer`. A new `SchoolsMap` client component lazily loads the Google Maps JS API and renders one `AdvancedMarkerElement` per distinct coordinate, with an InfoWindow listing the schools at that pin.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind v4 tokens, Supabase Postgres, `@googlemaps/js-api-loader` 2.1.1, `@types/google.maps` 3.65.5, `node:test`.

**Spec:** `docs/superpowers/specs/2026-08-21-near-me-map-search-design.md`

## Global Constraints

- Read `node_modules/next/dist/docs/` before touching Next-specific APIs (AGENTS.md). Client components need `"use client"`; `NEXT_PUBLIC_` vars are inlined at build time.
- Design tokens only: `bg-paper`, `bg-surface`, `bg-surface-2`, `text-ink`, `text-muted`, `border-line`, `bg-accent`, `text-accent-ink`, `bg-accent-soft`, `text-sky`. Never raw `slate-/blue-/rose-` classes, never `dark:` variants. Primitives from `src/components/ui/*`.
- Tests are zero-dependency `node --test` files under `scripts/tests/*.test.ts` importing source with **relative** paths (the runner does not resolve the `@/` alias). `src/lib/geo.ts` must therefore use relative imports.
- SQL patches are idempotent, live in `supabase/add-*.sql`, and are also folded into `supabase/schema.sql` for fresh installs. `supabase/seed.sql` is generated — never hand-edit it.
- Pin new package versions (exact) and commit `package-lock.json`.
- Radius options: `25 | 50 | 100 | 250` miles, default `50`. URL params: `near`, `radius`, `view`, `sort=distance`.
- Env: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (required for the map), `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` (optional, default `DEMO_MAP_ID`).
- Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

## File structure

| File | Responsibility |
|---|---|
| `src/lib/geo.ts` (new) | Pure geo helpers: Haversine, radius parsing, `near` param (de)serialisation, centroid, mile formatting. No React, no Supabase. |
| `scripts/tests/geo.test.ts` (new) | Unit tests for `geo.ts`. |
| `src/lib/types.ts` | `LatLng` type; `coords?` on `Airport` and `FlightSchool`. |
| `src/lib/supabase/database.types.ts` | `latitude`/`longitude` on `airports` and `flight_schools`. |
| `src/lib/data.ts` | Map the new columns to `coords` in `toAirport` / `toSchool`. |
| `src/lib/mock-data.ts` | `coords` on the 18 seeded airports. |
| `scripts/generate-seed.ts` | Emit `latitude`/`longitude` for airports. |
| `supabase/add-coordinates.sql` (new), `supabase/schema.sql`, `supabase/seed.sql`, `supabase/README.md` | Schema patch, fresh-install schema, regenerated seed, docs. |
| `src/app/search/page.tsx` | Resolve effective coords per school; build airport and city origin options. |
| `src/components/AdvancedSearchExplorer.tsx` | Location block (geolocate, origin typeahead, radius), distance filter/sort, List/Map toggle, URL sync. |
| `src/components/SchoolsMap.tsx` (new) | Google Maps loading, grouped pins, InfoWindow, origin pin + radius circle, theme-aware. |

---

### Task 1: Geo helpers (`src/lib/geo.ts`)

**Files:**
- Create: `src/lib/geo.ts`
- Create: `scripts/tests/geo.test.ts`
- Modify: `src/lib/types.ts` (add `LatLng` — needed by `geo.ts`)

**Interfaces:**
- Consumes: `isAirportCode(code: string): boolean` from `src/lib/utils.ts`.
- Produces (used by Tasks 3–5):
  - `type LatLng = { lat: number; lng: number }` (in `types.ts`)
  - `RADIUS_OPTIONS: readonly [25, 50, 100, 250]`, `type Radius`, `DEFAULT_RADIUS: Radius`
  - `type NearOrigin = { kind: "geo"; coords } | { kind: "airport"; icao; coords; label } | { kind: "city"; slug; coords; label }`
  - `haversineMiles(a: LatLng, b: LatLng): number`
  - `isValidLatLng(p: { lat: number; lng: number }): p is LatLng`
  - `parseRadius(param: string | null): Radius`
  - `centroid(points: LatLng[]): LatLng | undefined`
  - `formatMiles(miles: number): string`
  - `formatNearParam(origin: NearOrigin): string`
  - `type NearLookup = { airportByIcao(icao): { coords; label } | undefined; cityBySlug(slug): { coords; label } | undefined }`
  - `parseNearParam(param: string | null, lookup: NearLookup): NearOrigin | null`
  - `originLabel(origin: NearOrigin): string`

- [ ] **Step 1: Add `LatLng` to `src/lib/types.ts`**

Insert directly above `export type State = {`:

```ts
/** WGS-84 coordinate pair (decimal degrees). */
export type LatLng = { lat: number; lng: number };
```

- [ ] **Step 2: Write the failing tests**

Create `scripts/tests/geo.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  haversineMiles,
  isValidLatLng,
  parseRadius,
  centroid,
  formatMiles,
  formatNearParam,
  parseNearParam,
  originLabel,
  DEFAULT_RADIUS,
  type NearLookup,
} from "../../src/lib/geo.ts";

const KLAX = { lat: 33.9425, lng: -118.4081 };
const KPHX = { lat: 33.4373, lng: -112.0078 };
const KFFZ = { lat: 33.4608, lng: -111.7283 };

const lookup: NearLookup = {
  airportByIcao: (icao) =>
    icao === "KFFZ" ? { coords: KFFZ, label: "Falcon Field Airport" } : undefined,
  cityBySlug: (slug) =>
    slug === "mesa" ? { coords: KFFZ, label: "Mesa, AZ" } : undefined,
};

test("haversineMiles: known distance and zero distance", () => {
  const d = haversineMiles(KLAX, KPHX);
  assert.ok(Math.abs(d - 370) < 3, `expected ~370 mi, got ${d}`);
  assert.equal(haversineMiles(KFFZ, KFFZ), 0);
  assert.equal(haversineMiles(KLAX, KPHX), haversineMiles(KPHX, KLAX));
});

test("isValidLatLng rejects out-of-range and non-finite values", () => {
  assert.equal(isValidLatLng({ lat: 0, lng: 0 }), true);
  assert.equal(isValidLatLng({ lat: 90, lng: -180 }), true);
  assert.equal(isValidLatLng({ lat: 91, lng: 0 }), false);
  assert.equal(isValidLatLng({ lat: 0, lng: 181 }), false);
  assert.equal(isValidLatLng({ lat: NaN, lng: 0 }), false);
});

test("parseRadius accepts only the allowed options", () => {
  assert.equal(parseRadius("25"), 25);
  assert.equal(parseRadius("250"), 250);
  assert.equal(parseRadius("30"), DEFAULT_RADIUS);
  assert.equal(parseRadius("abc"), DEFAULT_RADIUS);
  assert.equal(parseRadius(null), DEFAULT_RADIUS);
});

test("centroid averages points and is undefined for none", () => {
  assert.equal(centroid([]), undefined);
  assert.deepEqual(centroid([KFFZ]), KFFZ);
  const c = centroid([{ lat: 0, lng: 0 }, { lat: 2, lng: 4 }]);
  assert.deepEqual(c, { lat: 1, lng: 2 });
});

test("formatMiles", () => {
  assert.equal(formatMiles(0.4), "<1 mi");
  assert.equal(formatMiles(41.6), "42 mi");
  assert.equal(formatMiles(100), "100 mi");
});

test("near param: geo round-trip rounds to 4 dp", () => {
  const origin = { kind: "geo" as const, coords: { lat: 33.46081234, lng: -111.72829876 } };
  const param = formatNearParam(origin);
  assert.equal(param, "33.4608,-111.7283");
  assert.deepEqual(parseNearParam(param, lookup), {
    kind: "geo",
    coords: { lat: 33.4608, lng: -111.7283 },
  });
});

test("near param: airport and city forms resolve through the lookup", () => {
  assert.deepEqual(parseNearParam("kffz", lookup), {
    kind: "airport",
    icao: "KFFZ",
    coords: KFFZ,
    label: "Falcon Field Airport",
  });
  assert.equal(
    formatNearParam({ kind: "airport", icao: "KFFZ", coords: KFFZ, label: "x" }),
    "kffz",
  );
  assert.deepEqual(parseNearParam("city:mesa", lookup), {
    kind: "city",
    slug: "mesa",
    coords: KFFZ,
    label: "Mesa, AZ",
  });
  assert.equal(formatNearParam({ kind: "city", slug: "mesa", coords: KFFZ, label: "x" }), "city:mesa");
});

test("near param: unknown or malformed input is ignored", () => {
  assert.equal(parseNearParam(null, lookup), null);
  assert.equal(parseNearParam("", lookup), null);
  assert.equal(parseNearParam("kzzz", lookup), null);
  assert.equal(parseNearParam("city:nowhere", lookup), null);
  assert.equal(parseNearParam("95,10", lookup), null);
  assert.equal(parseNearParam("abc,def", lookup), null);
  assert.equal(parseNearParam("<script>", lookup), null);
});

test("originLabel", () => {
  assert.equal(originLabel({ kind: "geo", coords: KFFZ }), "Your location");
  assert.equal(originLabel({ kind: "airport", icao: "KFFZ", coords: KFFZ, label: "Falcon Field Airport" }), "Falcon Field Airport");
  assert.equal(originLabel({ kind: "city", slug: "mesa", coords: KFFZ, label: "Mesa, AZ" }), "Mesa, AZ");
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- --test-name-pattern=. 2>&1 | tail -20` (or `node --test scripts/tests/geo.test.ts`)
Expected: FAIL — `Cannot find module '../../src/lib/geo.ts'`.

- [ ] **Step 4: Implement `src/lib/geo.ts`**

```ts
/**
 * Pure geo helpers for "near me" search. No React, no Supabase, relative
 * imports only (scripts/tests run this under node --test without the
 * "@/" alias).
 */
import type { LatLng } from "./types";
import { isAirportCode } from "./utils";

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
  if (isAirportCode(value)) {
    const icao = value.toUpperCase();
    const airport = lookup.airportByIcao(icao);
    return airport ? { kind: "airport", icao, coords: airport.coords, label: airport.label } : null;
  }
  return null;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: all suites PASS, including 9 new `geo` tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/geo.ts src/lib/types.ts scripts/tests/geo.test.ts
git commit -m "feat(geo): haversine, radius and near-param helpers

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Coordinates in the data model

**Files:**
- Create: `supabase/add-coordinates.sql`
- Modify: `supabase/schema.sql` (the `create table public.airports` and `create table public.flight_schools` blocks)
- Modify: `src/lib/supabase/database.types.ts` (`airports` and `flight_schools` Row/Insert/Update)
- Modify: `src/lib/types.ts` (`Airport.coords?`, `FlightSchool.coords?`)
- Modify: `src/lib/data.ts` (`toAirport`, `toSchool`)
- Modify: `src/lib/mock-data.ts` (18 airport entries)
- Modify: `scripts/generate-seed.ts` (airports insert)
- Regenerate: `supabase/seed.sql`
- Modify: `supabase/README.md` (patch list)

**Interfaces:**
- Consumes: `LatLng` from Task 1.
- Produces: `Airport.coords?: LatLng`, `FlightSchool.coords?: LatLng` populated by `getAirports()` / `getFlightSchools()` and friends.

- [ ] **Step 1: Write the schema patch**

Create `supabase/add-coordinates.sql`:

```sql
-- ============================================================
-- Coordinates for airports and flight schools
--
-- airports.latitude/longitude      — airport reference point; drives
--                                     "near me" search and the map.
-- flight_schools.latitude/longitude — optional per-school override
--                                     (hangar/office). Owners may edit
--                                     it; it is NOT a protected column.
-- Effective school position = school override, else its airport.
--
-- Idempotent — safe to run on an existing database. New installs get
-- this from schema.sql. Run in: Supabase Dashboard > SQL Editor
-- ============================================================

alter table public.airports
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision;

alter table public.flight_schools
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision;

alter table public.airports
  drop constraint if exists airports_latitude_range,
  drop constraint if exists airports_longitude_range,
  drop constraint if exists airports_coords_pair;
alter table public.airports
  add constraint airports_latitude_range  check (latitude  is null or latitude  between -90  and 90),
  add constraint airports_longitude_range check (longitude is null or longitude between -180 and 180),
  add constraint airports_coords_pair     check ((latitude is null) = (longitude is null));

alter table public.flight_schools
  drop constraint if exists flight_schools_latitude_range,
  drop constraint if exists flight_schools_longitude_range,
  drop constraint if exists flight_schools_coords_pair;
alter table public.flight_schools
  add constraint flight_schools_latitude_range  check (latitude  is null or latitude  between -90  and 90),
  add constraint flight_schools_longitude_range check (longitude is null or longitude between -180 and 180),
  add constraint flight_schools_coords_pair     check ((latitude is null) = (longitude is null));

-- Backfill the seeded airports (airport reference points, FAA data).
-- Only fills rows that have no coordinates yet.
update public.airports as a
set latitude = v.lat, longitude = v.lng
from (values
  ('KFFZ', 33.4608, -111.7283),
  ('KDVT', 33.6883, -112.0826),
  ('KPHX', 33.4373, -112.0078),
  ('KCHD', 33.2691, -111.8110),
  ('KTUS', 32.1161, -110.9410),
  ('KCPS', 38.5707,  -90.1562),
  ('KSTL', 38.7487,  -90.3700),
  ('KMKC', 39.1232,  -94.5928),
  ('KOJC', 38.8476,  -94.7376),
  ('KIXD', 38.8309,  -94.8903),
  ('KFXE', 26.1973,  -80.1707),
  ('KOPF', 25.9070,  -80.2784),
  ('KPMP', 26.2471,  -80.1111),
  ('KMYF', 32.8157, -117.1396),
  ('KCRQ', 33.1283, -117.2802),
  ('KLAX', 33.9425, -118.4081),
  ('KBNA', 36.1245,  -86.6782),
  ('KCHA', 35.0353,  -85.2038)
) as v(icao, lat, lng)
where a.icao = v.icao and a.latitude is null;
```

- [ ] **Step 2: Fold the columns into `supabase/schema.sql`**

In `create table public.airports (...)`, after the `description text` line add:

```sql
  description text,
  latitude    double precision,
  longitude   double precision,
  constraint airports_latitude_range  check (latitude  is null or latitude  between -90  and 90),
  constraint airports_longitude_range check (longitude is null or longitude between -180 and 180),
  constraint airports_coords_pair     check ((latitude is null) = (longitude is null))
```

(The existing `description text` line loses its closing position; make sure the last line before `);` has no trailing comma.)

In `create table public.flight_schools (...)`, after `managed_by ... on delete set null,` add:

```sql
  latitude              double precision,
  longitude             double precision,
```

and after the existing `flight_schools_phone_length` constraint add:

```sql
  constraint flight_schools_latitude_range  check (latitude  is null or latitude  between -90  and 90),
  constraint flight_schools_longitude_range check (longitude is null or longitude between -180 and 180),
  constraint flight_schools_coords_pair     check ((latitude is null) = (longitude is null))
```

- [ ] **Step 3: Update the hand-written DB types**

In `src/lib/supabase/database.types.ts`, `airports` → `Row` add `latitude: number | null; longitude: number | null;`; `Insert` and `Update` add `latitude?: number | null; longitude?: number | null;`. Do the same for `flight_schools`.

- [ ] **Step 4: Update app types and mappers**

`src/lib/types.ts` — in `Airport` after `description?: string;`:

```ts
  /** Airport reference point; drives near-me search and the map */
  coords?: LatLng;
```

In `FlightSchool` after `managedBy?: string;`:

```ts
  /** Optional per-school override of the airport position (hangar/office) */
  coords?: LatLng;
```

`src/lib/data.ts` — add `LatLng` to the type import, then above `toAirport`:

```ts
function toCoords(lat: number | null, lng: number | null): LatLng | undefined {
  return lat !== null && lng !== null ? { lat, lng } : undefined;
}
```

In `toAirport` add `coords: toCoords(row.latitude, row.longitude),`; in `toSchool` add `coords: toCoords(row.latitude, row.longitude),`.

- [ ] **Step 5: Seed coordinates in mock data and the generator**

`src/lib/mock-data.ts` — for each of the 18 airport objects insert `coords: { lat: …, lng: … },` on its own line directly before the `description:` line, using this table:

| id | lat | lng | id | lat | lng |
|---|---|---|---|---|---|
| kffz | 33.4608 | -111.7283 | kfxe | 26.1973 | -80.1707 |
| kdvt | 33.6883 | -112.0826 | kopf | 25.9070 | -80.2784 |
| kphx | 33.4373 | -112.0078 | kpmp | 26.2471 | -80.1111 |
| kchd | 33.2691 | -111.8110 | kmyf | 32.8157 | -117.1396 |
| ktus | 32.1161 | -110.9410 | kcrq | 33.1283 | -117.2802 |
| kcps | 38.5707 | -90.1562 | klax | 33.9425 | -118.4081 |
| kstl | 38.7487 | -90.3700 | kbna | 36.1245 | -86.6782 |
| kmkc | 39.1232 | -94.5928 | kcha | 35.0353 | -85.2038 |
| kojc | 38.8476 | -94.7376 | kixd | 38.8309 | -94.8903 |

`scripts/generate-seed.ts` — airports insert: change the column list to
`["id", "name", "icao", "iata", "faa_lid", "city_slug", "state_slug", "description", "latitude", "longitude"]`
and append to each row mapper:

```ts
      lit(a.coords?.lat ?? null),
      lit(a.coords?.lng ?? null),
```

- [ ] **Step 6: Regenerate the seed and type-check**

Run: `node scripts/generate-seed.ts && git diff --stat supabase/seed.sql && npx tsc --noEmit`
Expected: `seed.sql` airports insert now has `latitude, longitude` columns with 18 numeric pairs; `tsc` reports no errors.

- [ ] **Step 7: Document the patch**

`supabase/README.md` — in the patch list after the `add-audit-hardening.sql` bullet add:

```md
- `supabase/add-coordinates.sql` — `latitude` / `longitude` on airports and
  flight schools (+ range checks) and a backfill for the seeded airports.
  Powers "near me" search and the map view on `/search`.
```

- [ ] **Step 8: Run the full test suite and commit**

Run: `npm test && npm run lint`
Expected: PASS / no lint errors.

```bash
git add supabase/add-coordinates.sql supabase/schema.sql supabase/seed.sql supabase/README.md src/lib/supabase/database.types.ts src/lib/types.ts src/lib/data.ts src/lib/mock-data.ts scripts/generate-seed.ts
git commit -m "feat(db): latitude/longitude on airports and flight schools

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: `/search` payload — effective coords and origin options

**Files:**
- Modify: `src/app/search/page.tsx`

**Interfaces:**
- Consumes: `getAirports()` from `src/lib/data.ts`; `centroid` from `src/lib/geo.ts`; `Airport.coords`, `FlightSchool.coords`.
- Produces (props consumed by Task 4):
  - `schools[i].coords?: LatLng` — school override ?? airport coords
  - `airports: { icao: string; name: string; location: string; coords: LatLng }[]` (only airports that have coords)
  - `cities[i].coords?: LatLng` — centroid of the city's airports with coords

- [ ] **Step 1: Extend the page**

Replace the imports and body of `src/app/search/page.tsx` data section:

```ts
import {
  getFlightSchools,
  getPrograms,
  getTrainerAircraft,
  getStates,
  getCities,
  getAirports,
} from "@/lib/data";
import { centroid } from "@/lib/geo";
```

Update the metadata description to: `"Filter USA flight schools by location, state, airport code, aircraft fleet, programs offered, and FAA Part 61 or Part 141 certification — or search within a radius of where you are."`

```ts
  const [flightSchools, programs, trainerAircraft, states, cities, airports] =
    await Promise.all([
      getFlightSchools(),
      getPrograms(),
      getTrainerAircraft(),
      getStates(),
      getCities(),
      getAirports(),
    ]);

  const stateAbbrevMap = Object.fromEntries(states.map((s) => [s.slug, s.abbreviation]));
  const cityNameMap = Object.fromEntries(cities.map((c) => [c.slug, c.name]));
  const airportByIcao = new Map(airports.map((a) => [a.icao, a]));
  const locationOf = (citySlug: string, stateSlug: string) =>
    `${cityNameMap[citySlug] ?? slugToTitle(citySlug)}, ${stateAbbrevMap[stateSlug] ?? stateSlug.toUpperCase()}`;

  const schoolData = flightSchools.map((school) => ({
    id: school.id,
    name: school.name,
    href: schoolHref(school),
    stateSlug: school.stateSlug,
    citySlug: school.citySlug,
    airportCode: school.primaryAirportCode,
    programSlugs: school.programSlugs,
    aircraftSlugs: school.aircraftSlugs ?? [],
    faaPart: school.faaPart,
    rating: school.rating,
    reviewCount: school.reviewCount,
    location: locationOf(school.citySlug, school.stateSlug),
    coords: school.coords ?? airportByIcao.get(school.primaryAirportCode)?.coords,
  }));

  const airportOptions = airports.flatMap((a) =>
    a.coords
      ? [{ icao: a.icao, name: a.name, location: locationOf(a.citySlug, a.stateSlug), coords: a.coords }]
      : [],
  );

  const cityOptions = cities.map((c) => ({
    slug: c.slug,
    name: c.name,
    stateSlug: c.stateSlug,
    stateAbbreviation: c.stateAbbreviation,
    coords: centroid(
      airports.flatMap((a) => (a.citySlug === c.slug && a.coords ? [a.coords] : [])),
    ),
  }));
```

Keep `programOptions` / `stateOptions` as they are, and pass `airports={airportOptions}` to `<AdvancedSearchExplorer>` (the component prop is added in Task 4; until then `tsc` will complain about the extra prop — that is expected and resolved in Task 4).

Update the `PageHero` description to: `"Narrow the whole directory by location, state, city, airport, training type, programs offered, fleet and rating — or search near you."`

- [ ] **Step 2: Commit (together with Task 4 — see Task 4 Step 8).**

---

### Task 4: Explorer — Location block, distance filter/sort

**Files:**
- Modify: `src/components/AdvancedSearchExplorer.tsx`

**Interfaces:**
- Consumes: Task 1 helpers; Task 3 props.
- Produces: `origin: NearOrigin | null`, `radius: Radius`, `filtered: ScoredSchool[]` (each with optional `distanceMiles`) — consumed by the map integration in Task 6.

- [ ] **Step 1: Imports, types, props**

Add to the imports:

```ts
import { MapPin, Star, SlidersHorizontal, X, ArrowUp, ArrowDown, LocateFixed } from "lucide-react";
import { Notice } from "@/components/ui/Notice";
import type { LatLng } from "@/lib/types";
import {
  RADIUS_OPTIONS,
  DEFAULT_RADIUS,
  haversineMiles,
  parseRadius,
  parseNearParam,
  formatNearParam,
  formatMiles,
  originLabel,
  type Radius,
  type NearOrigin,
} from "@/lib/geo";
```

Extend the types:

```ts
type SchoolFilterItem = {
  // …existing fields…
  location: string;
  coords?: LatLng;
};
type ScoredSchool = SchoolFilterItem & { distanceMiles?: number };

type AirportOption = { icao: string; name: string; location: string; coords: LatLng };
type CityOption = { slug: string; name: string; stateSlug: string; stateAbbreviation: string; coords?: LatLng };

/** One row of the "near an airport or city" typeahead. */
type OriginOption = { slug: string; label: string; sub: string; origin: NearOrigin };

type SortField = "name" | "rating" | "distance";

type Props = {
  schools: SchoolFilterItem[];
  programs: ProgramOption[];
  aircraft: AircraftOption[];
  states: StateOption[];
  cities: CityOption[];
  airports: AirportOption[];
};
```

- [ ] **Step 2: Origin options, lookup, and new state**

Inside the component, after `const isFirstRender = useRef(true);` and before the existing state:

```ts
  // ── Near-me origin options ───────────────────────────────────────────────
  const originOptions = useMemo<OriginOption[]>(() => {
    const fromAirports = airports.map<OriginOption>((a) => ({
      slug: a.icao.toLowerCase(),
      label: a.name,
      sub: `${a.icao} · ${a.location}`,
      origin: { kind: "airport", icao: a.icao, coords: a.coords, label: a.name },
    }));
    const fromCities = cities.flatMap<OriginOption>((c) =>
      c.coords
        ? [{
            slug: `city:${c.slug}`,
            label: `${c.name}, ${c.stateAbbreviation}`,
            sub: "City",
            origin: { kind: "city", slug: c.slug, coords: c.coords, label: `${c.name}, ${c.stateAbbreviation}` },
          }]
        : [],
    );
    return [...fromAirports, ...fromCities];
  }, [airports, cities]);

  const nearLookup = useMemo(
    () => ({
      airportByIcao: (icao: string) => {
        const a = airports.find((x) => x.icao === icao);
        return a ? { coords: a.coords, label: a.name } : undefined;
      },
      cityBySlug: (slug: string) => {
        const c = cities.find((x) => x.slug === slug);
        return c?.coords ? { coords: c.coords, label: `${c.name}, ${c.stateAbbreviation}` } : undefined;
      },
    }),
    [airports, cities],
  );

  const [origin, setOrigin] = useState<NearOrigin | null>(() =>
    parseNearParam(searchParams.get("near"), nearLookup),
  );
  const [radius, setRadius] = useState<Radius>(() => parseRadius(searchParams.get("radius")));
  const [originQuery, setOriginQuery] = useState("");
  const [originDropdownOpen, setOriginDropdownOpen] = useState(false);
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "denied" | "unavailable">("idle");
```

Replace the `sortBy` initialiser:

```ts
  const [sortBy, setSortBy] = useState<SortField>(() => {
    const param = searchParams.get("sort");
    if (param === "name") return "name";
    if (param === "distance") return "distance";
    return "rating";
  });
```

(`sortBy === "distance"` with no origin is harmless: the sort falls through to rating order because every `distanceMiles` is undefined, and the distance chip is hidden.)

- [ ] **Step 3: URL sync**

In the sync effect add before `const qs = params.toString();`:

```ts
    if (origin) params.set("near", formatNearParam(origin));
    if (origin && radius !== DEFAULT_RADIUS) params.set("radius", String(radius));
```

and add `origin, radius` to the dependency array.

- [ ] **Step 4: Origin handlers**

After the city typeahead helpers:

```ts
  // ── Near-me origin ───────────────────────────────────────────────────────────
  const originSuggestions = useMemo(() => {
    const q = originQuery.trim().toLowerCase();
    if (!q) return originOptions.slice(0, 8);
    return originOptions
      .filter((o) => o.label.toLowerCase().includes(q) || o.sub.toLowerCase().includes(q))
      .slice(0, 8);
  }, [originQuery, originOptions]);

  const chooseOrigin = (next: NearOrigin | null) => {
    setOrigin(next);
    setOriginQuery("");
    setGeoStatus("idle");
    if (next) {
      setSortBy("distance");
      setSortDir("asc");
    } else if (sortBy === "distance") {
      setSortBy("rating");
      setSortDir("desc");
    }
    resetCount();
  };

  const useMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation || !window.isSecureContext) {
      setGeoStatus("unavailable");
      return;
    }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => chooseOrigin({ kind: "geo", coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } }),
      (err) => setGeoStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { timeout: 10_000, maximumAge: 300_000 },
    );
  };

  /** The chip shown in the origin typeahead for the current origin. */
  const selectedOrigin: OriginOption[] = origin
    ? [{ slug: formatNearParam(origin), label: originLabel(origin), sub: "", origin }]
    : [];
```

- [ ] **Step 5: Filter and sort**

Replace the `filtered` memo with:

```ts
  const filtered = useMemo<ScoredSchool[]>(() => {
    const out: ScoredSchool[] = [];
    for (const school of schools) {
      if (query && !school.name.toLowerCase().includes(query.toLowerCase())) continue;
      if (selectedStates.length > 0 && !selectedStates.some((s) => s.slug === school.stateSlug)) continue;
      if (selectedCities.length > 0 && !selectedCities.some((c) => c.slug === school.citySlug)) continue;
      if (airportQuery && !school.airportCode.toUpperCase().includes(airportQuery.toUpperCase())) continue;
      if (faaPart !== "any") {
        if (faaPart === "61" && school.faaPart !== "61" && school.faaPart !== "both") continue;
        if (faaPart === "141" && school.faaPart !== "141" && school.faaPart !== "both") continue;
        if (faaPart === "both" && school.faaPart !== "both") continue;
      }
      if (selectedPrograms.size > 0 && ![...selectedPrograms].some((p) => school.programSlugs.includes(p))) continue;
      if (selectedAircraft.size > 0 && ![...selectedAircraft].some((a) => school.aircraftSlugs.includes(a))) continue;
      if (minRating > 0 && school.rating < minRating) continue;
      if (origin) {
        if (!school.coords) continue;
        const distanceMiles = haversineMiles(origin.coords, school.coords);
        if (distanceMiles > radius) continue;
        out.push({ ...school, distanceMiles });
      } else {
        out.push(school);
      }
    }
    return out;
  }, [query, selectedStates, selectedCities, airportQuery, faaPart, selectedPrograms, selectedAircraft, minRating, origin, radius, schools]);
```

Add `origin ? 1 : 0,` to the `activeFilterCount` array. In `resetFilters` add:

```ts
    setOrigin(null);
    setRadius(DEFAULT_RADIUS);
    setOriginQuery("");
    setGeoStatus("idle");
    if (sortBy === "distance") {
      setSortBy("rating");
      setSortDir("desc");
    }
```

Replace the `sorted` memo comparator:

```ts
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp: number;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "distance") cmp = (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity);
      else cmp = a.rating - b.rating;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortBy, sortDir]);
```

- [ ] **Step 6: Location block in the filter panel**

At the top of `filterPanel`'s `<div className="space-y-6">`, before the School name block:

```tsx
      {/* Location / near me */}
      <div>
        <span className={filterLabel}>Location</span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          full
          onClick={useMyLocation}
          disabled={geoStatus === "locating"}
        >
          <LocateFixed size={14} aria-hidden />
          {geoStatus === "locating" ? "Locating…" : "Use my location"}
        </Button>
        {geoStatus === "denied" && (
          <Notice tone="error" className="mt-2">
            Location access was denied — pick an airport or city instead.
          </Notice>
        )}
        {geoStatus === "unavailable" && (
          <Notice tone="error" className="mt-2">
            Location isn&apos;t available in this browser — pick an airport or city instead.
          </Notice>
        )}
        <div className="mt-3">
          <TypeaheadFilter
            label="Near an airport or city"
            inputValue={originQuery}
            onInputChange={(v) => { setOriginQuery(v); setOriginDropdownOpen(true); }}
            onFocus={() => setOriginDropdownOpen(true)}
            onBlur={() => setTimeout(() => setOriginDropdownOpen(false), 150)}
            dropdownOpen={originDropdownOpen}
            suggestions={originSuggestions}
            onSelect={(o) => chooseOrigin(o.origin)}
            selectedItems={selectedOrigin}
            onRemove={() => chooseOrigin(null)}
            renderChip={(o) => o.label}
            renderSuggestion={(o) => (
              <>
                {o.label}
                {o.sub && <span className="ml-1 font-mono text-xs text-muted">{o.sub}</span>}
              </>
            )}
            placeholder="e.g. KFFZ or Mesa"
          />
        </div>
        {origin && (
          <div className="mt-3">
            <span className="mb-2 block font-mono text-xs uppercase tracking-[0.12em] text-muted">Within</span>
            <div className="flex flex-wrap gap-1.5">
              {RADIUS_OPTIONS.map((r) => (
                <Chip
                  key={r}
                  active={radius === r}
                  className="px-3 py-1 text-xs"
                  onClick={() => { setRadius(r); resetCount(); }}
                >
                  {r} mi
                </Chip>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">Schools without a map location are hidden while a radius is set.</p>
          </div>
        )}
      </div>
```

- [ ] **Step 7: Sort chips and distance on cards**

Replace the sort chip loop's field list with:

```tsx
              {(origin ? (["distance", "name", "rating"] as const) : (["name", "rating"] as const)).map((field) => {
                const active = sortBy === field;
                const label = field === "name" ? "Name" : field === "rating" ? "Rating" : "Distance";
                return (
                  <Chip
                    key={field}
                    active={active}
                    className="px-3 py-1 text-xs"
                    onClick={() => {
                      if (active) {
                        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                      } else {
                        setSortBy(field);
                        setSortDir(field === "rating" ? "desc" : "asc");
                      }
                      resetCount();
                    }}
                  >
                    {label}
                    {active && (sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                  </Chip>
                );
              })}
```

In the card, replace the airport-code line with:

```tsx
                    <p className="mb-1.5 flex items-center justify-between font-mono text-xs uppercase tracking-[0.12em] text-muted">
                      <span className="font-semibold text-sky">{school.airportCode}</span>
                      {school.distanceMiles !== undefined && (
                        <span className="text-accent-ink">{formatMiles(school.distanceMiles)}</span>
                      )}
                    </p>
```

- [ ] **Step 8: Type-check, lint, test, commit**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: clean.

Run: `npm run dev`, open `http://localhost:3000/search?near=kffz&radius=25` — only Phoenix-area schools, sorted by distance, mileage shown on cards, "Falcon Field Airport" chip in the Location block, radius chips visible. Remove the chip → all schools return, sort falls back to Rating. Click "Use my location" → browser prompt; deny → red notice.

```bash
git add src/app/search/page.tsx src/components/AdvancedSearchExplorer.tsx
git commit -m "feat(search): near-me radius filter and distance sort

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: `SchoolsMap` component

**Files:**
- Modify: `package.json`, `package-lock.json` (new deps)
- Create: `src/components/SchoolsMap.tsx`
- Modify: `supabase/README.md` (env vars), `.env.local` (empty keys)

**Interfaces:**
- Consumes: `LatLng`, `formatMiles`.
- Produces: `export type MapSchool = { id: string; name: string; href: string; airportCode: string; location: string; rating: number; reviewCount: number; coords?: LatLng; distanceMiles?: number }` and
  `export function SchoolsMap(props: { schools: MapSchool[]; origin?: { coords: LatLng; label: string }; radiusMiles?: number; className?: string })`.

- [ ] **Step 1: Install dependencies (pinned)**

Run: `npm install --save-exact @googlemaps/js-api-loader@2.1.1 && npm install --save-dev --save-exact @types/google.maps@3.65.5`
Expected: both appear in `package.json` with exact versions; `package-lock.json` updated.

`tsconfig.json` has no `types` array, so `@types/google.maps` globals are picked up automatically. Verify with `npx tsc --noEmit` after Step 2.

- [ ] **Step 2: Write the component**

Create `src/components/SchoolsMap.tsx`:

```tsx
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
      s.reviewCount > 0 ? `★ ${s.rating.toFixed(1)} · ${s.reviewCount} review${s.reviewCount === 1 ? "" : "s"}` : "No reviews yet",
      s.distanceMiles !== undefined ? formatMiles(s.distanceMiles) : null,
    ].filter(Boolean);
    meta.textContent = parts.join(" · ");
    li.appendChild(meta);
    list.appendChild(li);
  }
  root.appendChild(list);
  return root;
}

export function SchoolsMap({ schools, origin, radiusMiles, className }: Props) {
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
      .then((l) => { if (!cancelled) setLibs(l); })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load Google Maps.");
      });
    return () => { cancelled = true; };
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- map instance is created imperatively here
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
      map.setZoom(11);
    } else if (pinCount > 0) {
      map.fitBounds(bounds, 48);
    }

    return () => {
      info.close();
      for (const m of markers) m.map = null;
      if (originMarker) originMarker.map = null;
      circle?.setMap(null);
    };
  }, [libs, map, mappable, origin, radiusMiles]);

  if (!API_KEY) {
    return (
      <Notice tone="info" className={className}>
        The map view needs a Google Maps API key. Set <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in
        <code className="font-mono"> .env.local</code> and restart the dev server. The list view works without it.
      </Notice>
    );
  }

  return (
    <div className={className}>
      <div
        role="region"
        aria-label="Map of matching flight schools"
        className="relative h-[70vh] min-h-[420px] overflow-hidden rounded-2xl border border-line bg-surface-2"
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
        <p className={cn("mt-2 text-xs text-muted")}>
          {missing} matching school{missing === 1 ? " has" : "s have"} no map location and {missing === 1 ? "isn't" : "aren't"} shown on the map.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: clean. If `google` is not found, `@types/google.maps` did not install — re-run Step 1.

- [ ] **Step 4: Env + docs**

Append to `.env.local` only if the keys are absent:

```bash
grep -q NEXT_PUBLIC_GOOGLE_MAPS_API_KEY .env.local || printf '\n# Google Maps (map view on /search). Restrict the key to HTTP referrers + Maps JavaScript API.\nNEXT_PUBLIC_GOOGLE_MAPS_API_KEY=\nNEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=\n' >> .env.local
```

`supabase/README.md` section 1 — after the env `ini` block add:

```md
The map view on `/search` additionally needs a Google Maps key:

```ini
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<browser key, restricted to your HTTP referrers + Maps JavaScript API>
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=                 # optional; a Cloud map style id. Defaults to DEMO_MAP_ID
```

Without the key the rest of the site — including the near-me radius filter — works; only the map itself shows a notice.
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/components/SchoolsMap.tsx supabase/README.md
git commit -m "feat(map): SchoolsMap component on Google Maps with grouped pins

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Explorer — List | Map toggle

**Files:**
- Modify: `src/components/AdvancedSearchExplorer.tsx`

**Interfaces:**
- Consumes: `SchoolsMap`, `MapSchool` from Task 5; `filtered`, `origin`, `radius` from Task 4.

- [ ] **Step 1: Imports and state**

Add `List, Map as MapIcon` to the lucide import and:

```ts
import { SchoolsMap } from "@/components/SchoolsMap";
```

State (next to `visibleCount`):

```ts
  const [view, setView] = useState<"list" | "map">(() =>
    searchParams.get("view") === "map" ? "map" : "list",
  );
```

URL sync: add `if (view === "map") params.set("view", "map");` and `view` to the dependency array.

Memoise the origin prop so the map's overlay effect does not re-run on every render:

```ts
  const mapOrigin = useMemo(
    () => (origin ? { coords: origin.coords, label: originLabel(origin) } : undefined),
    [origin],
  );
```

- [ ] **Step 2: Toggle in the results header**

Replace the `<div className="flex items-center gap-1.5">` that wraps the sort chips with a wrapper holding both groups:

```tsx
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5" role="group" aria-label="Result view">
                {(["list", "map"] as const).map((v) => (
                  <Chip
                    key={v}
                    active={view === v}
                    className="px-3 py-1 text-xs"
                    onClick={() => setView(v)}
                  >
                    {v === "list" ? <List size={12} aria-hidden /> : <MapIcon size={12} aria-hidden />}
                    {v === "list" ? "List" : "Map"}
                  </Chip>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="mr-1 font-mono text-xs uppercase tracking-[0.12em] text-muted">Sort</span>
                {/* existing sort chip loop unchanged */}
              </div>
            </div>
```

- [ ] **Step 3: Render the map**

Change the results branch so the empty state is shared and the map replaces the grid:

```tsx
          {filtered.length === 0 ? (
            /* existing empty-state block unchanged */
          ) : view === "map" ? (
            <SchoolsMap
              schools={filtered}
              origin={mapOrigin}
              radiusMiles={origin ? radius : undefined}
            />
          ) : (
            <>
              {/* existing grid + Show more, unchanged */}
            </>
          )}
```

`filtered` is `ScoredSchool[]`, which is structurally assignable to `MapSchool[]`.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build`
Expected: all clean; build lists `/search` as dynamic (it already was).

Manual (`npm run dev`), with a real key in `.env.local`:
1. `/search?view=map` — pins for every airport with schools; Phoenix-area pins show count badges; click a pin → InfoWindow lists schools with working links.
2. `/search?near=kffz&radius=50&view=map` — radius circle around Falcon Field, sky-blue origin dot, only pins inside the circle, viewport fitted to the circle.
3. Toggle theme → map re-renders in dark scheme; pins keep the accent color.
4. Remove the key from `.env.local`, restart → `view=map` shows the info notice; the list and near-me filter still work.
5. Mobile width: filter drawer shows the Location block; map is scrollable with one finger only after a tap (cooperative gestures).

- [ ] **Step 5: Commit**

```bash
git add src/components/AdvancedSearchExplorer.tsx
git commit -m "feat(search): List | Map toggle rendering SchoolsMap

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Self-review

**Spec coverage.** Data model → Task 2. Types & helpers → Task 1 (+ Task 2 for `coords`). `/search` page → Task 3. Location block, radius, distance filter/sort, URL params (`near`, `radius`, `sort=distance`) → Task 4. `view` param, toggle, map rendering, "no map location" note → Tasks 5–6. Config/env/docs → Task 5 Step 4. Error table: geolocation denied/unavailable (Task 4 Step 4/6), malformed `near` (Task 1 `parseNearParam`), schools without coords (Task 4 filter + Task 5 note), missing key / load failure (Task 5 component). Theme-aware map → Task 5 effect 2. Accessibility region/label → Task 5. Tests → Task 1; build/lint → Tasks 4–6.

**Type consistency.** `NearOrigin`, `Radius`, `LatLng`, `MapSchool`, `ScoredSchool`, `OriginOption`, `AirportOption`, `CityOption.coords` are used with the same shapes across tasks. `formatNearParam`/`parseNearParam`/`originLabel` names match between Task 1 and Task 4. `SchoolsMap` props in Task 6 match the Task 5 signature.

**Placeholders.** None — every step has concrete code or an exact command.
