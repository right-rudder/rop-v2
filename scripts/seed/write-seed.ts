/**
 * Builds the catalog from data/catalog/*.csv and writes supabase/seed.sql.
 *
 * Run:  npm run seed:build
 *
 * Users, reviews and comments are never seeded — they reference auth.users
 * rows that only exist once real people sign up. managed_by is left null and
 * rating / review_count start at 0: the refresh_school_rating trigger owns
 * them and only real reviews move them.
 */
import { writeFileSync } from "node:fs";
import { buildFromDisk, type Catalog } from "./build-catalog.ts";
import { programs, trainerAircraft } from "./static-catalog.ts";
import { SEED_SQL } from "./paths.ts";

/** Rows per INSERT. Keeps statements inside Postgres' parser limits and the
 *  file diffable when a single row changes. */
const CHUNK = 500;

type Literal = string | number | boolean | null | undefined;

function lit(v: Literal): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return `'${v.replace(/'/g, "''")}'`;
}

function jsonb(v: unknown): string {
  return `${lit(JSON.stringify(v))}::jsonb`;
}

/** Postgres text[] literal. */
function textArray(values: string[]): string {
  if (values.length === 0) return "'{}'";
  return `array[${values.map((v) => lit(v)).join(", ")}]::text[]`;
}

function insert(table: string, columns: string[], rows: string[][]): string {
  if (rows.length === 0) return "";
  const out: string[] = [];
  for (let i = 0; i < rows.length; i += CHUNK) {
    const values = rows
      .slice(i, i + CHUNK)
      .map((r) => `  (${r.join(", ")})`)
      .join(",\n");
    out.push(
      `insert into public.${table} (${columns.join(", ")}) values\n${values}\non conflict do nothing;\n`,
    );
  }
  return out.join("\n");
}

export function renderSeed(catalog: Catalog): string {
  const chunks: string[] = [
    `-- ============================================================
-- Flight School Finder — seed data (generated, do not edit)
--
-- Source:      data/catalog/*.csv (exported from the "FSF - Seed Data" sheet)
-- Regenerate:  npm run seed:build
-- Apply:       npx supabase db push --include-seed --linked
--
-- ${catalog.states.length} states · ${catalog.cities.length} cities · ${catalog.airports.length} airports · ${catalog.schools.length} flight schools
-- ============================================================
`,
  ];

  chunks.push(
    insert(
      "states",
      ["id", "name", "slug", "abbreviation"],
      catalog.states.map((s) => [lit(s.id), lit(s.name), lit(s.slug), lit(s.abbreviation)]),
    ),
  );

  chunks.push(
    insert(
      "cities",
      ["id", "name", "slug", "state_slug", "state_abbreviation", "nearby_city_slugs"],
      catalog.cities.map((c) => [
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
      ["id", "name", "icao", "iata", "faa_lid", "city_slug", "state_slug", "description", "latitude", "longitude"],
      catalog.airports.map((a) => [
        lit(a.id),
        lit(a.name),
        lit(a.icao),
        lit(a.iata),
        lit(a.faaLid),
        lit(a.citySlug),
        lit(a.stateSlug),
        lit(a.description),
        lit(a.latitude),
        lit(a.longitude),
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
      [
        "id", "name", "slug", "description", "primary_airport_code", "city_slug", "state_slug",
        "organization_id", "rating", "review_count", "website", "phone", "featured", "faa_part",
        "contacts", "estimated_planes", "estimated_instructors", "school_types", "va_approved",
        "visa_types", "dormitory", "dpe_on_site", "in_house_maintenance", "hours", "address",
        "training_tags",
      ],
      catalog.schools.map((s) => [
        lit(s.id),
        lit(s.name),
        lit(s.slug),
        lit(s.description),
        lit(s.primaryAirportCode),
        lit(s.citySlug),
        lit(s.stateSlug),
        lit(s.organizationId),
        0, // rating — maintained by the refresh_school_rating trigger
        0, // review_count — no reviews are seeded
        lit(s.website),
        lit(s.phone),
        false, // featured — an editorial choice, never an import decision
        lit(s.faaPart),
        jsonb(s.contacts),
        lit(s.estimatedPlanes),
        lit(s.estimatedInstructors),
        textArray(s.schoolTypes),
        lit(s.vaApproved),
        textArray(s.visaTypes),
        lit(s.dormitory),
        lit(s.dpeOnSite),
        lit(s.inHouseMaintenance),
        lit(s.hours),
        lit(s.address),
        textArray(s.trainingTags),
      ]),
    ),
  );

  chunks.push(
    insert(
      "school_programs",
      ["school_id", "program_slug"],
      catalog.schools.flatMap((s) => s.programSlugs.map((p) => [lit(s.id), lit(p)])),
    ),
  );

  chunks.push(
    insert(
      "school_aircraft",
      ["school_id", "aircraft_slug"],
      catalog.schools.flatMap((s) => s.aircraftSlugs.map((a) => [lit(s.id), lit(a)])),
    ),
  );

  return chunks.filter((c) => c !== "").join("\n");
}

const catalog = buildFromDisk();
writeFileSync(SEED_SQL, renderSeed(catalog));
process.stdout.write(
  `Wrote ${SEED_SQL}\n  ${catalog.states.length} states, ${catalog.cities.length} cities, ` +
    `${catalog.airports.length} airports, ${catalog.schools.length} schools, ` +
    `${catalog.schools.reduce((n, s) => n + s.programSlugs.length, 0)} school_programs, ` +
    `${catalog.schools.reduce((n, s) => n + s.aircraftSlugs.length, 0)} school_aircraft\n`,
);
