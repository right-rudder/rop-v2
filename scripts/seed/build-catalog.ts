/**
 * Turns the two COMPILED spreadsheet tabs into the catalog rows the database
 * stores, plus a set of CSV reports describing everything the import decided.
 *
 * Read data/catalog/reports/ after every build: it is the only record of rows
 * that were merged, airports that could not be resolved, and source tokens
 * that have no catalog slug yet.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { parseCsvRecords, toCsv } from "./csv.ts";
import { programs, trainerAircraft } from "./static-catalog.ts";
import {
  airportIdent,
  cityName,
  contactPeople,
  describeSchool,
  faaPart,
  fleetBucket,
  mapTraining,
  optional,
  schoolTypes,
  trainingTag,
  visaTypes,
  yesNoNull,
} from "./normalize.ts";
import { DATA_DIR, REPORTS_DIR, SCHOOLS_CSV, AIRPORTS_CSV, STATES_CSV } from "./paths.ts";
import { slugify } from "../../src/lib/utils.ts";
import { haversineMiles } from "../../src/lib/geo.ts";
import type { LatLng, FleetRange, ContactPerson } from "../../src/lib/types.ts";

/** Cities this far apart (miles) are offered to each other as "nearby". */
const NEARBY_RADIUS_MI = 30;
/** At most this many nearby cities per city, closest first. */
const NEARBY_LIMIT = 8;

export type StateRow = { id: string; name: string; slug: string; abbreviation: string };

export type CityRow = {
  id: string;
  name: string;
  slug: string;
  stateSlug: string;
  stateAbbreviation: string;
  nearbyCitySlugs: string[];
};

export type AirportRow = {
  id: string;
  name: string;
  icao: string;
  iata: string | null;
  faaLid: string | null;
  citySlug: string;
  stateSlug: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type SchoolRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  primaryAirportCode: string;
  citySlug: string;
  stateSlug: string;
  organizationId: string | null;
  website: string;
  phone: string;
  faaPart: "61" | "141" | "both" | null;
  contacts: ContactPerson[];
  estimatedPlanes: FleetRange | null;
  estimatedInstructors: FleetRange | null;
  schoolTypes: string[];
  vaApproved: boolean | null;
  visaTypes: string[];
  dormitory: boolean | null;
  dpeOnSite: boolean | null;
  inHouseMaintenance: boolean | null;
  hours: string | null;
  address: string | null;
  trainingTags: string[];
  programSlugs: string[];
  aircraftSlugs: string[];
};

export type Catalog = {
  states: StateRow[];
  cities: CityRow[];
  airports: AirportRow[];
  schools: SchoolRow[];
};

export type Reports = {
  mergedDuplicates: Record<string, string>[];
  unresolvedAirports: Record<string, string>[];
  closedAirports: Record<string, string>[];
  unmappedTokens: Record<string, string>[];
  citiesWithoutCoords: Record<string, string>[];
};

function num(value: string): number | null {
  const v = value.trim();
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** How much real information a source row carries — used to pick a duplicate winner. */
function richness(row: Record<string, string>): number {
  return Object.values(row).filter((v) => v !== "" && v !== "N/A" && v !== "--").length;
}

export function buildCatalog(input: {
  schoolRows: Record<string, string>[];
  airportRows: Record<string, string>[];
  stateRows: Record<string, string>[];
}): { catalog: Catalog; reports: Reports } {
  const reports: Reports = {
    mergedDuplicates: [],
    unresolvedAirports: [],
    closedAirports: [],
    unmappedTokens: [],
    citiesWithoutCoords: [],
  };

  // ── States ────────────────────────────────────────────────────────────────
  const states: StateRow[] = input.stateRows.map((r) => {
    const abbreviation = r["Abbreviation"].toUpperCase();
    const name = r["State Name"];
    return { id: abbreviation.toLowerCase(), name, slug: slugify(name), abbreviation };
  });
  const stateByAbbr = new Map(states.map((s) => [s.abbreviation, s]));

  // ── Airports ──────────────────────────────────────────────────────────────
  // Keyed by the sheet's `Identifier`, which is what school rows reference.
  const airportSource = new Map<string, Record<string, string>>();
  for (const r of input.airportRows) {
    const key = r["Identifier"].trim().toUpperCase();
    if (key !== "" && !airportSource.has(key)) airportSource.set(key, r);
  }

  // ── Cities ────────────────────────────────────────────────────────────────
  // The union of every city named by a school row and by an airport row; a
  // city slug is unique per state, so same-named cities get a state suffix.
  const cityBySlug = new Map<string, CityRow>();
  const citySlugByKey = new Map<string, string>();

  function ensureCity(rawName: string, abbr: string): string | null {
    const state = stateByAbbr.get(abbr.trim().toUpperCase());
    const name = cityName(rawName);
    if (state === undefined || name === "") return null;

    const key = `${name.toLowerCase()}|${state.abbreviation}`;
    const existing = citySlugByKey.get(key);
    if (existing !== undefined) return existing;

    const base = slugify(name);
    if (base === "") return null;
    // Same city name in another state: qualify with the state id, matching
    // resolveCitySlug() in src/app/actions/admin.ts.
    const slug = cityBySlug.has(base) ? `${base}-${state.id}` : base;
    if (cityBySlug.has(slug)) return slug;

    cityBySlug.set(slug, {
      id: `${state.id}-${slug}`,
      name,
      slug,
      stateSlug: state.slug,
      stateAbbreviation: state.abbreviation,
      nearbyCitySlugs: [],
    });
    citySlugByKey.set(key, slug);
    return slug;
  }

  // Airports first so their (city, state) wins the unsuffixed slug where both
  // sources name the same place.
  const airportsById = new Map<string, AirportRow>();
  const airportCoords = new Map<string, LatLng>();

  for (const [identifier, r] of airportSource) {
    const ident = airportIdent({
      ident: identifier,
      icao_code: r["icao_code"] ?? "",
      gps_code: r["gps_code"] ?? "",
      local_code: r["local_code"] ?? "",
    });
    const abbr = (r["State Abbreviation"] ?? "").trim().toUpperCase();
    const state = stateByAbbr.get(abbr);
    if (state === undefined) {
      reports.unresolvedAirports.push({
        identifier,
        name: r["name"] ?? "",
        reason: `state "${abbr}" is not one of the 50 states`,
      });
      continue;
    }
    const citySlug = ensureCity(r["City"] ?? "", abbr);
    if (citySlug === null) {
      reports.unresolvedAirports.push({
        identifier,
        name: r["name"] ?? "",
        reason: `city "${r["City"] ?? ""}" could not be resolved`,
      });
      continue;
    }

    const lat = num(r["latitude_deg"] ?? "");
    const lng = num(r["longitude_deg"] ?? "");
    const iata = optional(r["iata_code"] ?? "");
    const localCode = optional(r["local_code"] ?? "");

    if ((r["type"] ?? "") === "closed") {
      reports.closedAirports.push({
        identifier,
        ident,
        name: r["name"] ?? "",
        city: r["City"] ?? "",
        state: abbr,
      });
    }

    const airport: AirportRow = {
      id: ident.toLowerCase(),
      name: r["name"] ?? ident,
      icao: ident,
      iata: iata !== null && /^[A-Z0-9]{3}$/.test(iata.toUpperCase()) ? iata.toUpperCase() : null,
      faaLid: localCode !== null ? localCode.toUpperCase() : null,
      citySlug,
      stateSlug: state.slug,
      description: null,
      latitude: lat,
      longitude: lat !== null && lng !== null ? lng : null,
    };
    // The DB requires lat and lng to be both set or both null.
    if (airport.latitude === null || airport.longitude === null) {
      airport.latitude = null;
      airport.longitude = null;
    }

    // Two sheet identifiers can normalise to the same public ident.
    const clash = airportsById.get(airport.id);
    if (clash !== undefined) {
      reports.mergedDuplicates.push({
        kind: "airport",
        kept: `${clash.icao} — ${clash.name}`,
        dropped: `${identifier} — ${airport.name}`,
        reason: "both resolve to the same public identifier",
      });
    } else {
      airportsById.set(airport.id, airport);
    }
    if (airport.latitude !== null && airport.longitude !== null) {
      airportCoords.set(identifier, { lat: airport.latitude, lng: airport.longitude });
    }
  }

  /** Sheet identifier -> the airport row it resolved to. */
  const airportByIdentifier = new Map<string, AirportRow>();
  for (const [identifier, r] of airportSource) {
    const ident = airportIdent({
      ident: identifier,
      icao_code: r["icao_code"] ?? "",
      gps_code: r["gps_code"] ?? "",
      local_code: r["local_code"] ?? "",
    });
    const airport = airportsById.get(ident.toLowerCase());
    if (airport !== undefined) airportByIdentifier.set(identifier, airport);
  }

  // ── Schools ───────────────────────────────────────────────────────────────
  const knownSlugs = {
    programSlugs: new Set(programs.map((p) => p.slug)),
    aircraftSlugs: new Set(trainerAircraft.map((a) => a.slug)),
  };
  const programNameBySlug = new Map(programs.map((p) => [p.slug, p.shortName]));

  // Collapse rows describing the same listing at the same airport, keeping the
  // one that carries the most information.
  const bySignature = new Map<string, Record<string, string>>();
  for (const r of input.schoolRows) {
    const identifier = (r["Identifier"] ?? "").trim().toUpperCase();
    const signature = [
      (r["name"] ?? "").trim().toLowerCase(),
      (r["city"] ?? "").trim().toLowerCase(),
      (r["state"] ?? "").trim().toUpperCase(),
      identifier,
    ].join("|");
    const existing = bySignature.get(signature);
    if (existing === undefined) {
      bySignature.set(signature, r);
      continue;
    }
    const [kept, dropped] = richness(r) > richness(existing) ? [r, existing] : [existing, r];
    bySignature.set(signature, kept);
    reports.mergedDuplicates.push({
      kind: "school",
      kept: `${kept["name"]} — ${kept["city"]}, ${kept["state"]} (${identifier})`,
      dropped: `${dropped["name"]} — row kept ${richness(kept)} fields vs ${richness(dropped)}`,
      reason: "same name, city, state and airport",
    });
  }
  const deduped = [...bySignature.values()];

  // Names that appear more than once are multi-location brands: they share an
  // organization_id and need a city-qualified slug.
  const nameCounts = new Map<string, number>();
  for (const r of deduped) {
    const key = (r["name"] ?? "").trim().toLowerCase();
    nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
  }

  const usedSlugs = new Set<string>();
  const schools: SchoolRow[] = [];
  const unmappedCounts = new Map<string, number>();

  for (const r of deduped) {
    const name = (r["name"] ?? "").trim();
    const abbr = (r["state"] ?? "").trim().toUpperCase();
    const state = stateByAbbr.get(abbr);
    const identifier = (r["Identifier"] ?? "").trim().toUpperCase();
    const airport = airportByIdentifier.get(identifier);

    if (name === "" || state === undefined || airport === undefined) {
      reports.unresolvedAirports.push({
        identifier,
        name,
        reason:
          state === undefined
            ? `state "${abbr}" is not one of the 50 states`
            : `airport identifier "${identifier}" is not in COMPILED AIRPORTS`,
      });
      continue;
    }

    const citySlug = ensureCity(r["city"] ?? "", abbr) ?? airport.citySlug;
    const city = cityBySlug.get(citySlug);

    const training = mapTraining(
      {
        certifications: r["training opportunities.certifications"] ?? "",
        ratings: r["training opportunities.ratings"] ?? "",
        advanced: r["training opportunities.other advanced training"] ?? "",
        services: r["flight training.services"] ?? "",
        planes: r["aircraft and equipment rentals.planes"] ?? "",
        simulator: r["aircraft and equipment rentals.simulator"] ?? "",
        rotorcraft: r["aircraft and equipment rentals.rotorcraft"] ?? "",
      },
      knownSlugs,
    );
    for (const t of training.unmapped) {
      unmappedCounts.set(t, (unmappedCounts.get(t) ?? 0) + 1);
    }

    // Slug: bare name, city-qualified for multi-location brands, then the
    // airport ident, then a numeric suffix. Matches uniqueSchoolSlug()'s
    // contract in src/app/actions/admin.ts: the slug is also the id.
    const base = slugify(name);
    const repeated = (nameCounts.get(name.toLowerCase()) ?? 0) > 1;
    const candidates = repeated
      ? [`${base}-${citySlug}`, `${base}-${airport.icao.toLowerCase()}`, base]
      : [base, `${base}-${citySlug}`, `${base}-${airport.icao.toLowerCase()}`];
    let slug = candidates.find((c) => c !== "" && !usedSlugs.has(c)) ?? base;
    for (let i = 2; usedSlugs.has(slug); i++) slug = `${candidates[0]}-${i}`;
    usedSlugs.add(slug);

    const types = schoolTypes(r["school_type"] ?? "");
    const va = yesNoNull(r["flight training.approved for va training"] ?? "");
    const visas = visaTypes(r["flight training.visa for foreign students"] ?? "");
    const part = faaPart(r["flight training.faa classification"] ?? "");
    const contacts = contactPeople({
      name: r["contact information.name"] ?? "",
      phone: r["contact information.phone"] ?? "",
      email: r["contact information.email"] ?? "",
    });

    schools.push({
      id: slug,
      name,
      slug,
      description: describeSchool({
        name,
        cityName: city?.name ?? cityName(r["city"] ?? ""),
        stateName: state.name,
        airportName: airport.name,
        airportIdent: airport.icao,
        faaPart: part,
        programNames: training.programSlugs
          .map((s) => programNameBySlug.get(s))
          .filter((n): n is string => n !== undefined),
        vaApproved: va,
        visaTypes: visas,
        schoolTypes: types,
      }),
      primaryAirportCode: airport.icao,
      citySlug,
      stateSlug: state.slug,
      organizationId: repeated ? base : null,
      website: "",
      phone: contacts[0]?.phone ?? "",
      faaPart: part,
      contacts,
      estimatedPlanes: fleetBucket(r["flight training.number of aircrafts"] ?? ""),
      estimatedInstructors: null,
      schoolTypes: types,
      vaApproved: va,
      visaTypes: visas,
      dormitory: yesNoNull(r["flight training.dormitory"] ?? ""),
      dpeOnSite: yesNoNull(r["flight training.DPE inside"] ?? ""),
      inHouseMaintenance: yesNoNull(r["flight training.in-house maintenance"] ?? ""),
      hours: optional(r["hours of operation"] ?? ""),
      address: optional(r["address"] ?? ""),
      trainingTags: training.trainingTags,
      programSlugs: training.programSlugs,
      aircraftSlugs: training.aircraftSlugs,
    });
  }

  // ── Nearby cities ─────────────────────────────────────────────────────────
  // A city's position is the mean of the airports located in it; cities that
  // only ever appear as a school's mailing city borrow their schools' airports.
  const pointsByCity = new Map<string, LatLng[]>();
  const addPoint = (slug: string, coords: LatLng | undefined) => {
    if (coords === undefined) return;
    const list = pointsByCity.get(slug) ?? [];
    list.push(coords);
    pointsByCity.set(slug, list);
  };
  for (const a of airportsById.values()) {
    if (a.latitude !== null && a.longitude !== null) {
      addPoint(a.citySlug, { lat: a.latitude, lng: a.longitude });
    }
  }
  const airportByIcao = new Map([...airportsById.values()].map((a) => [a.icao, a]));
  for (const s of schools) {
    const a = airportByIcao.get(s.primaryAirportCode);
    if (a !== undefined && a.latitude !== null && a.longitude !== null && !pointsByCity.has(s.citySlug)) {
      addPoint(s.citySlug, { lat: a.latitude, lng: a.longitude });
    }
  }

  const centroids: { slug: string; coords: LatLng }[] = [];
  for (const city of cityBySlug.values()) {
    const points = pointsByCity.get(city.slug);
    if (points === undefined || points.length === 0) {
      reports.citiesWithoutCoords.push({
        slug: city.slug,
        name: city.name,
        state: city.stateAbbreviation,
      });
      continue;
    }
    centroids.push({
      slug: city.slug,
      coords: {
        lat: points.reduce((t, p) => t + p.lat, 0) / points.length,
        lng: points.reduce((t, p) => t + p.lng, 0) / points.length,
      },
    });
  }

  // O(n²) over ~1.6k cities is ~1.3M haversines — under a second, and this runs
  // offline, so a spatial index would be premature.
  for (const a of centroids) {
    const near: { slug: string; miles: number }[] = [];
    for (const b of centroids) {
      if (a.slug === b.slug) continue;
      const miles = haversineMiles(a.coords, b.coords);
      if (miles <= NEARBY_RADIUS_MI) near.push({ slug: b.slug, miles });
    }
    near.sort((x, y) => x.miles - y.miles);
    const city = cityBySlug.get(a.slug);
    if (city !== undefined) {
      city.nearbyCitySlugs = near.slice(0, NEARBY_LIMIT).map((n) => n.slug);
    }
  }

  reports.unmappedTokens = [...unmappedCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([token, count]) => ({ token, slug: trainingTag(token), rows: String(count) }));

  // Only airports that actually host a school are part of the catalog: an
  // airport page with nothing on it is a thin page, and near-me origins are
  // only useful where there is something to find.
  const usedAirportIds = new Set(
    schools.map((s) => airportByIcao.get(s.primaryAirportCode)?.id).filter((id): id is string => id !== undefined),
  );
  const airports = [...airportsById.values()]
    .filter((a) => usedAirportIds.has(a.id))
    .sort((a, b) => a.icao.localeCompare(b.icao));

  // Likewise drop cities that ended up with neither an airport nor a school.
  const usedCitySlugs = new Set<string>([
    ...airports.map((a) => a.citySlug),
    ...schools.map((s) => s.citySlug),
  ]);
  const cities = [...cityBySlug.values()]
    .filter((c) => usedCitySlugs.has(c.slug))
    .map((c) => ({ ...c, nearbyCitySlugs: c.nearbyCitySlugs.filter((s) => usedCitySlugs.has(s)) }))
    .sort((a, b) => a.slug.localeCompare(b.slug));

  schools.sort((a, b) => a.slug.localeCompare(b.slug));

  return { catalog: { states, cities, airports, schools }, reports };
}

/** Read the committed CSVs, build the catalog, and write the reports. */
export function buildFromDisk(): Catalog {
  const read = (file: string) => parseCsvRecords(readFileSync(join(DATA_DIR, file), "utf8"));
  const { catalog, reports } = buildCatalog({
    schoolRows: read(SCHOOLS_CSV),
    airportRows: read(AIRPORTS_CSV),
    stateRows: read(STATES_CSV),
  });

  mkdirSync(REPORTS_DIR, { recursive: true });
  const write = (file: string, columns: string[], rows: Record<string, string>[]) => {
    writeFileSync(join(REPORTS_DIR, file), toCsv(columns, rows));
    process.stdout.write(`  report ${file}: ${rows.length} rows\n`);
  };
  write("merged-duplicates.csv", ["kind", "kept", "dropped", "reason"], reports.mergedDuplicates);
  write("unresolved-airports.csv", ["identifier", "name", "reason"], reports.unresolvedAirports);
  write("closed-airports.csv", ["identifier", "ident", "name", "city", "state"], reports.closedAirports);
  write("unmapped-tokens.csv", ["token", "slug", "rows"], reports.unmappedTokens);
  write("cities-without-coords.csv", ["slug", "name", "state"], reports.citiesWithoutCoords);

  return catalog;
}
