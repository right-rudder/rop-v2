/**
 * Pre-flight checks on the built catalog.
 *
 * These assert the exact constraints the database enforces, so a bad refresh
 * fails here — in CI, in a second — rather than halfway through applying
 * seed.sql to a live project.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCatalog } from "../seed/build-catalog.ts";
import { parseCsvRecords } from "../seed/csv.ts";
import { programs, trainerAircraft } from "../seed/static-catalog.ts";
import { FLEET_RANGES } from "../../src/lib/types.ts";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DATA_DIR, SCHOOLS_CSV, AIRPORTS_CSV, STATES_CSV } from "../seed/paths.ts";

const read = (f: string) => parseCsvRecords(readFileSync(join(DATA_DIR, f), "utf8"));
const { catalog, reports } = buildCatalog({
  schoolRows: read(SCHOOLS_CSV),
  airportRows: read(AIRPORTS_CSV),
  stateRows: read(STATES_CSV),
});

test("every source row is either imported or reported, never silently dropped", () => {
  const sourceRows = read(SCHOOLS_CSV).length;
  const accounted =
    catalog.schools.length +
    reports.mergedDuplicates.filter((r) => r.kind === "school").length +
    reports.unresolvedAirports.filter((r) => r.name !== "").length;
  assert.equal(accounted, sourceRows, `${sourceRows} source rows vs ${accounted} accounted for`);
});

test("no school is skipped for an unresolvable airport", () => {
  assert.deepEqual(reports.unresolvedAirports, []);
});

test("referential integrity: every FK target exists", () => {
  const stateSlugs = new Set(catalog.states.map((s) => s.slug));
  const citySlugs = new Set(catalog.cities.map((c) => c.slug));
  const icaos = new Set(catalog.airports.map((a) => a.icao));
  const programSlugs = new Set(programs.map((p) => p.slug));
  const aircraftSlugs = new Set(trainerAircraft.map((a) => a.slug));

  for (const c of catalog.cities) {
    assert.ok(stateSlugs.has(c.stateSlug), `city ${c.slug} -> missing state ${c.stateSlug}`);
    for (const n of c.nearbyCitySlugs) {
      assert.ok(citySlugs.has(n), `city ${c.slug} -> missing nearby ${n}`);
    }
  }
  for (const a of catalog.airports) {
    assert.ok(citySlugs.has(a.citySlug), `airport ${a.icao} -> missing city ${a.citySlug}`);
    assert.ok(stateSlugs.has(a.stateSlug), `airport ${a.icao} -> missing state ${a.stateSlug}`);
  }
  for (const s of catalog.schools) {
    assert.ok(icaos.has(s.primaryAirportCode), `school ${s.slug} -> missing airport ${s.primaryAirportCode}`);
    assert.ok(citySlugs.has(s.citySlug), `school ${s.slug} -> missing city ${s.citySlug}`);
    assert.ok(stateSlugs.has(s.stateSlug), `school ${s.slug} -> missing state ${s.stateSlug}`);
    for (const p of s.programSlugs) assert.ok(programSlugs.has(p), `school ${s.slug} -> program ${p}`);
    for (const a of s.aircraftSlugs) assert.ok(aircraftSlugs.has(a), `school ${s.slug} -> aircraft ${a}`);
  }
});

test("primary keys and unique columns are unique", () => {
  const unique = (label: string, values: string[]) => {
    assert.equal(new Set(values).size, values.length, `duplicate ${label}`);
  };
  unique("state id", catalog.states.map((s) => s.id));
  unique("state slug", catalog.states.map((s) => s.slug));
  unique("city id", catalog.cities.map((c) => c.id));
  unique("city slug", catalog.cities.map((c) => c.slug));
  unique("airport id", catalog.airports.map((a) => a.id));
  unique("airport icao", catalog.airports.map((a) => a.icao));
  unique("school id", catalog.schools.map((s) => s.id));
  unique("school slug", catalog.schools.map((s) => s.slug));
  unique(
    "school_programs pair",
    catalog.schools.flatMap((s) => s.programSlugs.map((p) => `${s.id}|${p}`)),
  );
});

test("airports satisfy their CHECK constraints", () => {
  for (const a of catalog.airports) {
    assert.match(a.icao, /^[A-Z0-9-]{3,8}$/, `airport icao ${a.icao}`);
    assert.equal(a.id, a.icao.toLowerCase(), `airport id/icao mismatch ${a.icao}`);
    if (a.iata !== null) assert.match(a.iata, /^[A-Z0-9]{3}$/, `airport iata ${a.iata}`);
    // airports_coords_pair: both set or both null
    assert.equal(a.latitude === null, a.longitude === null, `airport ${a.icao} half-coords`);
    if (a.latitude !== null && a.longitude !== null) {
      assert.ok(a.latitude >= -90 && a.latitude <= 90, `airport ${a.icao} lat`);
      assert.ok(a.longitude >= -180 && a.longitude <= 180, `airport ${a.icao} lng`);
    }
  }
});

test("every imported airport has coordinates, so near-me can use it", () => {
  const missing = catalog.airports.filter((a) => a.latitude === null);
  assert.deepEqual(missing.map((a) => a.icao), []);
});

test("schools satisfy their CHECK constraints", () => {
  for (const s of catalog.schools) {
    assert.ok(s.name.length >= 1 && s.name.length <= 120, `name length: ${s.name}`);
    assert.ok(s.description.length <= 5000, `description length: ${s.slug}`);
    assert.ok(s.phone.length <= 40, `phone length: ${s.slug}`);
    assert.ok(
      s.website === "" || (/^https?:\/\//i.test(s.website) && s.website.length <= 300),
      `website format: ${s.slug}`,
    );
    if (s.hours !== null) assert.ok(s.hours.length <= 300, `hours length: ${s.slug}`);
    if (s.address !== null) assert.ok(s.address.length <= 300, `address length: ${s.slug}`);
    if (s.faaPart !== null) {
      assert.ok(["61", "141", "both"].includes(s.faaPart), `faa_part: ${s.slug}`);
    }
    for (const bucket of [s.estimatedPlanes, s.estimatedInstructors]) {
      if (bucket !== null) {
        assert.ok((FLEET_RANGES as readonly string[]).includes(bucket), `fleet range: ${s.slug}`);
      }
    }
  }
});

test("slugs are URL-safe, so every generated route resolves", () => {
  for (const s of catalog.schools) assert.match(s.slug, /^[a-z0-9-]+$/, `school slug ${s.slug}`);
  for (const c of catalog.cities) assert.match(c.slug, /^[a-z0-9-]+$/, `city slug ${c.slug}`);
  for (const a of catalog.airports) assert.match(a.id, /^[a-z0-9-]+$/, `airport id ${a.id}`);
});

test("every school description mentions the school and its airport", () => {
  for (const s of catalog.schools) {
    assert.ok(s.description.startsWith(s.name), `description should open with the name: ${s.slug}`);
    assert.ok(
      s.description.includes(`(${s.primaryAirportCode})`),
      `description should name the airport: ${s.slug}`,
    );
  }
});

test("multi-location brands share an organization id; single locations have none", () => {
  const byOrg = new Map<string, number>();
  for (const s of catalog.schools) {
    if (s.organizationId !== null) byOrg.set(s.organizationId, (byOrg.get(s.organizationId) ?? 0) + 1);
  }
  for (const [org, count] of byOrg) {
    assert.ok(count > 1, `organization ${org} has only ${count} listing`);
  }
  // The largest brand in the source is ATP Flight School.
  assert.ok((byOrg.get("atp-flight-school") ?? 0) > 50, "ATP should be one organization");
});

test("nearby cities are mutual-capable, bounded, and never self-referential", () => {
  for (const c of catalog.cities) {
    assert.ok(c.nearbyCitySlugs.length <= 8, `too many nearby: ${c.slug}`);
    assert.ok(!c.nearbyCitySlugs.includes(c.slug), `self-referential nearby: ${c.slug}`);
    assert.equal(
      new Set(c.nearbyCitySlugs).size,
      c.nearbyCitySlugs.length,
      `duplicate nearby: ${c.slug}`,
    );
  }
});

test("only airports that host a school are imported", () => {
  const used = new Set(catalog.schools.map((s) => s.primaryAirportCode));
  const orphans = catalog.airports.filter((a) => !used.has(a.icao));
  assert.deepEqual(orphans.map((a) => a.icao), []);
});

test("only cities that host an airport or a school are imported", () => {
  const used = new Set([
    ...catalog.airports.map((a) => a.citySlug),
    ...catalog.schools.map((s) => s.citySlug),
  ]);
  const orphans = catalog.cities.filter((c) => !used.has(c.slug));
  assert.deepEqual(orphans.map((c) => c.slug), []);
});

test("all 50 states are present", () => {
  assert.equal(catalog.states.length, 50);
});

test("integer columns hold integers — the JSON API will not round for us", () => {
  // programs.sort_order / minimum_hours and trainer_aircraft.sort_order /
  // engine_count are `int`. seed.sql used to hide a fractional value here
  // (mei had sortOrder 6.5, which Postgres rounded into a tie with
  // multi-engine); inserting the same row as JSON fails outright with
  // "invalid input syntax for type integer".
  for (const p of programs) {
    assert.ok(Number.isInteger(p.sortOrder), `programs.sort_order not an integer: ${p.slug} = ${p.sortOrder}`);
    if (p.minimumHours !== undefined) {
      assert.ok(Number.isInteger(p.minimumHours), `programs.minimum_hours not an integer: ${p.slug}`);
    }
  }
  for (const a of trainerAircraft) {
    assert.ok(Number.isInteger(a.sortOrder), `trainer_aircraft.sort_order not an integer: ${a.slug}`);
    assert.ok(Number.isInteger(a.engineCount), `trainer_aircraft.engine_count not an integer: ${a.slug}`);
  }
});

test("sort_order is unique within each catalog, so display order is stable", () => {
  const programOrders = programs.map((p) => p.sortOrder);
  assert.equal(new Set(programOrders).size, programOrders.length, "duplicate programs.sort_order");
  const aircraftOrders = trainerAircraft.map((a) => a.sortOrder);
  assert.equal(new Set(aircraftOrders).size, aircraftOrders.length, "duplicate trainer_aircraft.sort_order");
});
