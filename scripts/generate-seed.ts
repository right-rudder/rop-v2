/**
 * Generates supabase/seed.sql from the catalog data in src/lib/mock-data.ts.
 *
 * Run:  node scripts/generate-seed.ts
 *
 * Only catalog tables are seeded (states, cities, airports, programs,
 * trainer_aircraft, flight_schools + join tables). Users, reviews, and
 * comments are NOT seeded — those reference auth.users rows that only
 * exist once real people sign up. managed_by is likewise left null, and
 * rating / review_count start at 0: the refresh_school_rating trigger owns
 * them and only real reviews move them.
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  states,
  cities,
  airports,
  programs,
  trainerAircraft,
  flightSchools,
} from "../src/lib/mock-data.ts";

function lit(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return `'${v.replace(/'/g, "''")}'`;
}

function jsonb(v: unknown): string {
  return `${lit(JSON.stringify(v))}::jsonb`;
}

function insert(table: string, columns: string[], rows: string[][]): string {
  const values = rows.map((r) => `  (${r.join(", ")})`).join(",\n");
  return `insert into public.${table} (${columns.join(", ")}) values\n${values}\non conflict do nothing;\n`;
}

const chunks: string[] = [
  `-- ============================================================
-- Flight School Finder — seed data (generated, do not edit)
-- Regenerate with: node scripts/generate-seed.ts
-- Run after schema.sql in: Supabase Dashboard > SQL Editor
-- ============================================================
`,
];

chunks.push(
  insert(
    "states",
    ["id", "name", "slug", "abbreviation"],
    states.map((s) => [lit(s.id), lit(s.name), lit(s.slug), lit(s.abbreviation)]),
  ),
);

chunks.push(
  insert(
    "cities",
    ["id", "name", "slug", "state_slug", "state_abbreviation", "nearby_city_slugs"],
    cities.map((c) => [
      lit(c.id),
      lit(c.name),
      lit(c.slug),
      lit(c.stateSlug),
      lit(c.stateAbbreviation),
      jsonb(c.nearbyCitySlugs),
    ]),
  ),
);

chunks.push(
  insert(
    "airports",
    ["id", "name", "icao", "iata", "faa_lid", "city_slug", "state_slug", "description"],
    airports.map((a) => [
      lit(a.id),
      lit(a.name),
      lit(a.icao),
      lit(a.iata),
      lit(a.faaLid),
      lit(a.citySlug),
      lit(a.stateSlug),
      lit(a.description ?? null),
    ]),
  ),
);

chunks.push(
  insert(
    "programs",
    ["id", "slug", "name", "short_name", "description", "faa_part", "minimum_hours", "certificate", "prerequisites", "typical_duration", "sort_order"],
    programs.map((p) => [
      lit(p.id),
      lit(p.slug),
      lit(p.name),
      lit(p.shortName),
      lit(p.description),
      lit(p.faaPart ?? null),
      lit(p.minimumHours ?? null),
      lit(p.certificate ?? null),
      jsonb(p.prerequisites ?? []),
      lit(p.typicalDuration ?? null),
      lit(p.sortOrder),
    ]),
  ),
);

chunks.push(
  insert(
    "trainer_aircraft",
    ["id", "slug", "make", "model", "display_name", "category", "description", "common_use", "engine_count", "typical_cruise", "sort_order"],
    trainerAircraft.map((a) => [
      lit(a.id),
      lit(a.slug),
      lit(a.make),
      lit(a.model),
      lit(a.displayName),
      lit(a.category),
      lit(a.description),
      jsonb(a.commonUse),
      lit(a.engineCount),
      lit(a.typicalCruise ?? null),
      lit(a.sortOrder),
    ]),
  ),
);

chunks.push(
  insert(
    "flight_schools",
    ["id", "name", "slug", "description", "primary_airport_code", "city_slug", "state_slug", "organization_id", "rating", "review_count", "website", "phone", "featured", "faa_part", "contacts", "estimated_planes", "estimated_instructors"],
    flightSchools.map((s) => [
      lit(s.id),
      lit(s.name),
      lit(s.slug),
      lit(s.description),
      lit(s.primaryAirportCode),
      lit(s.citySlug),
      lit(s.stateSlug),
      lit(s.organizationId ?? null),
      0, // rating — maintained by the refresh_school_rating trigger
      0, // review_count — no reviews are seeded
      lit(s.website),
      lit(s.phone),
      lit(s.featured ?? false),
      lit(s.faaPart ?? null),
      jsonb(s.contacts ?? []),
      lit(s.estimatedPlanes ?? null),
      lit(s.estimatedInstructors ?? null),
    ]),
  ),
);

chunks.push(
  insert(
    "school_programs",
    ["school_id", "program_slug"],
    flightSchools.flatMap((s) =>
      s.programSlugs.map((p) => [lit(s.id), lit(p)]),
    ),
  ),
);

chunks.push(
  insert(
    "school_aircraft",
    ["school_id", "aircraft_slug"],
    flightSchools.flatMap((s) =>
      (s.aircraftSlugs ?? []).map((a) => [lit(s.id), lit(a)]),
    ),
  ),
);

const outPath = join(dirname(fileURLToPath(import.meta.url)), "../supabase/seed.sql");
writeFileSync(outPath, chunks.join("\n"));
console.log(`Wrote ${outPath}`);
