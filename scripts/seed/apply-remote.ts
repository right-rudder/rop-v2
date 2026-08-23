/**
 * Applies the built catalog straight to a Supabase project over the Storage-
 * free PostgREST endpoint.
 *
 * Run:  npm run seed:apply           (add --dry-run to only print the plan)
 *
 * Why this exists alongside `supabase db push --include-seed`: that command
 * provisions a temporary `cli_login_postgres` role through the Management API,
 * which fails on accounts without the CREATEROLE privilege:
 *
 *   unexpected login role status 400: Failed to create login role:
 *   ERROR: 42501: permission denied to alter role
 *
 * This path needs no database role — only SUPABASE_SERVICE_ROLE_KEY, which the
 * app already keeps in .env.local. It writes the same rows seed.sql contains,
 * built from the same data/catalog CSVs.
 *
 * Safe to re-run: every insert uses resolution=ignore-duplicates, so a partial
 * run can simply be repeated. It does NOT delete anything — run
 * supabase/reset-catalog.sql first when replacing an existing catalog.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildFromDisk } from "./build-catalog.ts";
import { programs, trainerAircraft } from "./static-catalog.ts";
import { REPO_ROOT } from "./paths.ts";

const DRY_RUN = process.argv.includes("--dry-run");

/** Rows per request. Kept modest so one oversized batch cannot blow the body limit. */
const BATCH: Record<string, number> = { flight_schools: 250 };
const DEFAULT_BATCH = 500;

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  try {
    for (const line of readFileSync(join(REPO_ROOT, ".env.local"), "utf8").split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (m && !line.trimStart().startsWith("#")) {
        env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // No .env.local — fall back to the real environment (CI, one-off shells).
  }
  return env;
}

const env = loadEnv();
const BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!DRY_RUN && (!BASE || !KEY)) {
  throw new Error(
    "Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (from .env.local or the environment).",
  );
}

async function insert(table: string, rows: Record<string, unknown>[]): Promise<void> {
  const size = BATCH[table] ?? DEFAULT_BATCH;
  if (rows.length === 0) {
    process.stdout.write(`  ${table.padEnd(17)} 0\n`);
    return;
  }
  if (DRY_RUN) {
    process.stdout.write(`  ${table.padEnd(17)} ${rows.length} rows in ${Math.ceil(rows.length / size)} batches\n`);
    return;
  }
  let done = 0;
  for (let i = 0; i < rows.length; i += size) {
    const batch = rows.slice(i, i + size);
    const res = await fetch(`${BASE}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        // Mirrors seed.sql's `on conflict do nothing`, so re-running is a no-op.
        Prefer: "return=minimal,resolution=ignore-duplicates",
      },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      throw new Error(`${table}: HTTP ${res.status} on rows ${i}-${i + batch.length}\n${await res.text()}`);
    }
    done += batch.length;
    process.stdout.write(`\r  ${table.padEnd(17)} ${done}/${rows.length}`);
  }
  process.stdout.write(`\r  ${table.padEnd(17)} ${done}/${rows.length}\n`);
}

const catalog = buildFromDisk();

process.stdout.write(`\n${DRY_RUN ? "Would apply" : `Applying to ${BASE}`}:\n`);

// Insertion order follows the foreign keys: states <- cities <- airports <- schools.
await insert("states", catalog.states.map((s) => ({
  id: s.id, name: s.name, slug: s.slug, abbreviation: s.abbreviation,
})));

await insert("cities", catalog.cities.map((c) => ({
  id: c.id, name: c.name, slug: c.slug, state_slug: c.stateSlug,
  state_abbreviation: c.stateAbbreviation, nearby_city_slugs: c.nearbyCitySlugs,
})));

await insert("airports", catalog.airports.map((a) => ({
  id: a.id, name: a.name, icao: a.icao, iata: a.iata, faa_lid: a.faaLid,
  city_slug: a.citySlug, state_slug: a.stateSlug, description: a.description,
  latitude: a.latitude, longitude: a.longitude,
})));

await insert("programs", programs.map((p) => ({
  id: p.id, slug: p.slug, name: p.name, short_name: p.shortName,
  description: p.description, faa_part: p.faaPart ?? null,
  minimum_hours: p.minimumHours ?? null, certificate: p.certificate ?? null,
  prerequisites: p.prerequisites ?? [], typical_duration: p.typicalDuration ?? null,
  sort_order: p.sortOrder,
})));

await insert("trainer_aircraft", trainerAircraft.map((a) => ({
  id: a.id, slug: a.slug, make: a.make, model: a.model, display_name: a.displayName,
  category: a.category, description: a.description, common_use: a.commonUse,
  engine_count: a.engineCount, typical_cruise: a.typicalCruise ?? null,
  sort_order: a.sortOrder,
})));

// rating / review_count stay 0 and featured stays false: the refresh_school_rating
// trigger owns the first two, and featuring a listing is an editorial choice.
await insert("flight_schools", catalog.schools.map((s) => ({
  id: s.id, name: s.name, slug: s.slug, description: s.description,
  primary_airport_code: s.primaryAirportCode, city_slug: s.citySlug,
  state_slug: s.stateSlug, organization_id: s.organizationId,
  rating: 0, review_count: 0, website: s.website, phone: s.phone, featured: false,
  faa_part: s.faaPart, contacts: s.contacts, estimated_planes: s.estimatedPlanes,
  estimated_instructors: s.estimatedInstructors, school_types: s.schoolTypes,
  va_approved: s.vaApproved, visa_types: s.visaTypes, dormitory: s.dormitory,
  dpe_on_site: s.dpeOnSite, in_house_maintenance: s.inHouseMaintenance,
  hours: s.hours, address: s.address, training_tags: s.trainingTags,
})));

await insert("school_programs", catalog.schools.flatMap((s) =>
  s.programSlugs.map((p) => ({ school_id: s.id, program_slug: p }))));

await insert("school_aircraft", catalog.schools.flatMap((s) =>
  s.aircraftSlugs.map((a) => ({ school_id: s.id, aircraft_slug: a }))));

if (DRY_RUN) {
  process.stdout.write("\nDry run — nothing was sent.\n");
} else {
  // Read the counts back rather than trusting the writes.
  const counts: string[] = [];
  for (const table of ["states", "cities", "airports", "flight_schools", "school_programs"]) {
    const res = await fetch(`${BASE}/rest/v1/${table}?select=*&limit=1`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: "count=exact" },
    });
    counts.push(`${table}=${res.headers.get("content-range")?.split("/")[1] ?? "?"}`);
  }
  process.stdout.write(`\nVerified on the server: ${counts.join(", ")}\n`);
}
