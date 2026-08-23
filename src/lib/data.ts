/**
 * Data-access layer backed by Supabase.
 *
 * Server Components, Server Actions, and Route Handlers import from here and
 * pass plain data down to Client Components as props. Three tiers:
 *
 * 1. Catalog — states, cities, airports, programs, trainer aircraft, flight
 *    schools and their join tables. Public-read, rarely changes. Read with
 *    the cookie-less anon client (lib/supabase/public) so the request carries
 *    no session, and served through Next's cross-request data cache
 *    (`unstable_cache`, tag CATALOG_TAG, CATALOG_TTL_SECONDS) wrapped in
 *    React's per-request `cache()`. Every server action that writes a
 *    catalog row — or a review, which re-computes a school's rating — must
 *    call `invalidateCatalog()`.
 *
 *    The `load*` exports are the same readers without the cross-request
 *    layer, for actions that need a fresh answer (slug uniqueness,
 *    idempotent approval, ownership checks).
 *
 * 2. User-generated public content — reviews, comments, profiles. Public-
 *    read but expected to appear immediately, so: anon client, per-request
 *    memo only.
 *
 * 3. RLS-scoped — favorites, submissions, leads, admin counts. Read with the
 *    session (cookie) client; never cached across requests.
 *
 * Callers must not mutate returned arrays/objects — they're shared.
 */
import { cache } from "react";
import { unstable_cache, updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  State,
  City,
  Airport,
  Program,
  TrainerAircraft,
  FlightSchool,
  Review,
  Comment,
  User,
  ContactPerson,
  AircraftCategory,
  FleetRange,
  UserRole,
  SchoolSubmission,
  SubmissionStatus,
  LatLng,
  Lead,
  LeadStatus,
} from "@/lib/types";
import type { Tables } from "@/lib/supabase/database.types";
import type {
  SchoolSearchItem,
  AirportSearchItem,
} from "@/components/HeroSearch";
import { schoolHref, isAirportCode, pickAirportMatch } from "@/lib/utils";

type FaaPart = "61" | "141" | "both";

// ── Cross-request cache ────────────────────────────────────────────────────────

/** Tag on every cached catalog read; `invalidateCatalog()` expires them all. */
export const CATALOG_TAG = "catalog";
/** Safety net for writes that bypass the app (SQL editor, seed script). */
const CATALOG_TTL_SECONDS = 60 * 60;

/**
 * Expire every cached catalog read. Server Actions only (`updateTag`): the
 * caller sees its own write on the very next render instead of stale data.
 */
export function invalidateCatalog(): void {
  updateTag(CATALOG_TAG);
}

/** What `unstable_cache` can put in a cache key: the JSON of the arguments. */
type CacheArg = string | number | boolean | null | CacheArg[];

/**
 * Cross-request cache (keyed by `name` + the JSON of the arguments) plus a
 * per-request memo so the same call from generateMetadata and the page body
 * resolves once. Return values are stored as JSON, so loaders that may find
 * nothing return `null` (an `undefined` result would not round-trip).
 */
function cached<A extends CacheArg[], R>(
  name: string,
  loader: (...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
  return cache(
    unstable_cache(loader, [CATALOG_TAG, name], {
      tags: [CATALOG_TAG],
      revalidate: CATALOG_TTL_SECONDS,
    }),
  );
}

// ── Row → app-type mappers ─────────────────────────────────────────────────────

type StateRowWithCounts = Tables<"states"> & {
  flight_schools: { count: number }[];
  airports: { count: number }[];
};

function toState(row: StateRowWithCounts): State {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    abbreviation: row.abbreviation,
    schoolCount: row.flight_schools[0]?.count ?? 0,
    airportCount: row.airports[0]?.count ?? 0,
  };
}

function toCity(row: Tables<"cities">): City {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    stateSlug: row.state_slug,
    stateAbbreviation: row.state_abbreviation,
    nearbyCitySlugs: (row.nearby_city_slugs as string[]) ?? [],
  };
}

/**
 * Both values must be real numbers. Also guards the window before
 * the coordinates migration has been applied, when the columns are
 * simply absent from the row (undefined).
 */
function toCoords(lat: number | null | undefined, lng: number | null | undefined): LatLng | undefined {
  return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)
    ? { lat, lng }
    : undefined;
}

function toAirport(row: Tables<"airports">): Airport {
  return {
    id: row.id,
    name: row.name,
    citySlug: row.city_slug,
    stateSlug: row.state_slug,
    icao: row.icao,
    iata: row.iata,
    faaLid: row.faa_lid,
    description: row.description ?? undefined,
    coords: toCoords(row.latitude, row.longitude),
  };
}

function toProgram(row: Tables<"programs">): Program {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortName: row.short_name,
    description: row.description,
    faaPart: (row.faa_part as FaaPart | null) ?? undefined,
    minimumHours: row.minimum_hours ?? undefined,
    certificate: row.certificate ?? undefined,
    prerequisites: (row.prerequisites as string[]) ?? [],
    typicalDuration: row.typical_duration ?? undefined,
    sortOrder: row.sort_order,
  };
}

function toAircraft(row: Tables<"trainer_aircraft">): TrainerAircraft {
  return {
    id: row.id,
    slug: row.slug,
    make: row.make,
    model: row.model,
    displayName: row.display_name,
    category: row.category as AircraftCategory,
    description: row.description,
    commonUse: (row.common_use as string[]) ?? [],
    engineCount: row.engine_count,
    typicalCruise: row.typical_cruise ?? undefined,
    sortOrder: row.sort_order,
  };
}

type SchoolRowWithJoins = Tables<"flight_schools"> & {
  school_programs: { program_slug: string }[];
  school_aircraft: { aircraft_slug: string }[];
};

const SCHOOL_SELECT =
  "*, school_programs(program_slug), school_aircraft(aircraft_slug)";

function toSchool(row: SchoolRowWithJoins): FlightSchool {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    primaryAirportCode: row.primary_airport_code,
    citySlug: row.city_slug,
    stateSlug: row.state_slug,
    organizationId: row.organization_id ?? undefined,
    programSlugs: row.school_programs.map((p) => p.program_slug),
    rating: Number(row.rating),
    reviewCount: row.review_count,
    website: row.website,
    phone: row.phone,
    featured: row.featured,
    faaPart: (row.faa_part as FaaPart | null) ?? undefined,
    contacts: (row.contacts as ContactPerson[]) ?? [],
    aircraftSlugs: row.school_aircraft.map((a) => a.aircraft_slug),
    estimatedPlanes: (row.estimated_planes as FleetRange | null) ?? undefined,
    estimatedInstructors:
      (row.estimated_instructors as FleetRange | null) ?? undefined,
    managedBy: row.managed_by ?? undefined,
    coords: toCoords(row.latitude, row.longitude),
    logoPath: row.logo_path ?? undefined,
    schoolTypes: row.school_types ?? [],
    vaApproved: row.va_approved ?? undefined,
    visaTypes: row.visa_types ?? [],
    dormitory: row.dormitory ?? undefined,
    dpeOnSite: row.dpe_on_site ?? undefined,
    inHouseMaintenance: row.in_house_maintenance ?? undefined,
    hours: row.hours ?? undefined,
    address: row.address ?? undefined,
    trainingTags: row.training_tags ?? [],
  };
}

function toReview(row: Tables<"reviews">): Review {
  return {
    id: row.id,
    schoolId: row.school_id,
    userId: row.user_id,
    overall: row.overall,
    customerService: row.customer_service,
    instructors: row.instructors,
    aircraft: row.aircraft,
    availability: row.availability,
    facilities: row.facilities,
    body: row.body,
    createdAt: row.created_at,
  };
}

function toComment(row: Tables<"comments">): Comment {
  return {
    id: row.id,
    reviewId: row.review_id,
    userId: row.user_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

function toUser(row: Tables<"profiles">): User {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role as UserRole,
    joinedAt: row.joined_at,
    bio: row.bio ?? undefined,
    pilotCertificates: (row.pilot_certificates as string[]) ?? [],
  };
}

function orThrow<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(`Supabase query failed: ${result.error.message}`);
  return result.data as T;
}

// ── States ─────────────────────────────────────────────────────────────────────

const STATE_SELECT = "*, flight_schools(count), airports(count)";

export const getStates = cached("states", async (): Promise<State[]> => {
  const res = await createPublicClient().from("states").select(STATE_SELECT).order("name");
  return (orThrow(res) as unknown as StateRowWithCounts[]).map(toState);
});

const loadStateBySlug = async (slug: string): Promise<State | null> => {
  const res = await createPublicClient()
    .from("states")
    .select(STATE_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  const row = orThrow(res) as unknown as StateRowWithCounts | null;
  return row ? toState(row) : null;
};
const cachedStateBySlug = cached("state-by-slug", loadStateBySlug);

export const getStateBySlug = cache(
  async (slug: string): Promise<State | undefined> =>
    (await cachedStateBySlug(slug)) ?? undefined,
);

// ── Cities ─────────────────────────────────────────────────────────────────────

export const getCities = cached("cities", async (): Promise<City[]> => {
  const res = await createPublicClient().from("cities").select("*").order("name");
  return orThrow(res).map(toCity);
});

/** Fresh read (no cross-request cache) for slug-collision checks in actions. */
export async function loadCityBySlug(slug: string): Promise<City | null> {
  const res = await createPublicClient().from("cities").select("*").eq("slug", slug).maybeSingle();
  const row = orThrow(res);
  return row ? toCity(row) : null;
}
const cachedCityBySlug = cached("city-by-slug", loadCityBySlug);

export const getCityBySlug = cache(
  async (slug: string): Promise<City | undefined> =>
    (await cachedCityBySlug(slug)) ?? undefined,
);

export const getCitiesBySlugs = cached(
  "cities-by-slugs",
  async (slugs: string[]): Promise<City[]> => {
    if (slugs.length === 0) return [];
    const res = await createPublicClient().from("cities").select("*").in("slug", slugs);
    return orThrow(res).map(toCity);
  },
);

type CityRowWithCounts = Tables<"cities"> & {
  flight_schools: { count: number }[];
  airports: { count: number }[];
};

/** Cities with per-city school and airport counts (for the cities explorer) */
export const getCitiesWithCounts = cached(
  "cities-with-counts",
  async (): Promise<(City & { schoolCount: number; airportCount: number })[]> => {
    const res = await createPublicClient()
      .from("cities")
      .select("*, flight_schools(count), airports(count)")
      .order("name");
    return (orThrow(res) as unknown as CityRowWithCounts[]).map((row) => ({
      ...toCity(row),
      schoolCount: row.flight_schools[0]?.count ?? 0,
      airportCount: row.airports[0]?.count ?? 0,
    }));
  },
);

export const getCitiesByState = cached(
  "cities-by-state",
  async (stateSlug: string): Promise<City[]> => {
    const res = await createPublicClient()
      .from("cities")
      .select("*")
      .eq("state_slug", stateSlug)
      .order("name");
    return orThrow(res).map(toCity);
  },
);

// ── Airports ───────────────────────────────────────────────────────────────────

export const getAirports = cached("airports", async (): Promise<Airport[]> => {
  const res = await createPublicClient().from("airports").select("*").order("icao");
  return orThrow(res).map(toAirport);
});

type AirportRowWithCount = Tables<"airports"> & {
  flight_schools: { count: number }[];
};

/** Airports with per-airport school counts (for the airports explorer) */
export const getAirportsWithSchoolCounts = cached(
  "airports-with-counts",
  async (): Promise<(Airport & { schoolCount: number })[]> => {
    const res = await createPublicClient()
      .from("airports")
      .select("*, flight_schools(count)")
      .order("icao");
    return (orThrow(res) as unknown as AirportRowWithCount[]).map((row) => ({
      ...toAirport(row),
      schoolCount: row.flight_schools[0]?.count ?? 0,
    }));
  },
);

/**
 * Look up an airport by any of its three identifiers (case-insensitive) in
 * one query. `code` usually comes straight from the URL, so it is validated
 * before it goes anywhere near a filter (that also keeps the `or` filter
 * free of PostgREST syntax characters). ICAO — the canonical slug — wins
 * over IATA / FAA LID; see pickAirportMatch.
 *
 * Fresh read (no cross-request cache) for the catalog-or-create step in
 * submission approval.
 */
export async function loadAirportByCode(code: string): Promise<Airport | null> {
  const upper = code.trim().toUpperCase();
  if (!isAirportCode(upper)) return null;
  const rows = orThrow(
    await createPublicClient()
      .from("airports")
      .select("*")
      .or(`icao.eq.${upper},iata.eq.${upper},faa_lid.eq.${upper}`)
      .order("icao"),
  );
  const row = pickAirportMatch(rows, upper);
  return row ? toAirport(row) : null;
}
const cachedAirportByCode = cached("airport-by-code", loadAirportByCode);

export const getAirportByCode = cache(
  async (code: string): Promise<Airport | undefined> =>
    (await cachedAirportByCode(code)) ?? undefined,
);

export const getAirportsByCity = cached(
  "airports-by-city",
  async (citySlug: string): Promise<Airport[]> => {
    const res = await createPublicClient()
      .from("airports")
      .select("*")
      .eq("city_slug", citySlug)
      .order("icao");
    return orThrow(res).map(toAirport);
  },
);

export const getAirportsByState = cached(
  "airports-by-state",
  async (stateSlug: string): Promise<Airport[]> => {
    const res = await createPublicClient()
      .from("airports")
      .select("*")
      .eq("state_slug", stateSlug)
      .order("icao");
    return orThrow(res).map(toAirport);
  },
);

// ── Programs ───────────────────────────────────────────────────────────────────

export const getPrograms = cached("programs", async (): Promise<Program[]> => {
  const res = await createPublicClient().from("programs").select("*").order("sort_order");
  return orThrow(res).map(toProgram);
});

const cachedProgramBySlug = cached(
  "program-by-slug",
  async (slug: string): Promise<Program | null> => {
    const res = await createPublicClient().from("programs").select("*").eq("slug", slug).maybeSingle();
    const row = orThrow(res);
    return row ? toProgram(row) : null;
  },
);

export const getProgramBySlug = cache(
  async (slug: string): Promise<Program | undefined> =>
    (await cachedProgramBySlug(slug)) ?? undefined,
);

export const getProgramsBySlugs = cached(
  "programs-by-slugs",
  async (slugs: string[]): Promise<Program[]> => {
    if (slugs.length === 0) return [];
    const res = await createPublicClient()
      .from("programs")
      .select("*")
      .in("slug", slugs)
      .order("sort_order");
    return orThrow(res).map(toProgram);
  },
);

// ── Trainer Aircraft ───────────────────────────────────────────────────────────

export const getTrainerAircraft = cached(
  "trainer-aircraft",
  async (): Promise<TrainerAircraft[]> => {
    const res = await createPublicClient().from("trainer_aircraft").select("*").order("sort_order");
    return orThrow(res).map(toAircraft);
  },
);

const cachedAircraftBySlug = cached(
  "aircraft-by-slug",
  async (slug: string): Promise<TrainerAircraft | null> => {
    const res = await createPublicClient()
      .from("trainer_aircraft")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    const row = orThrow(res);
    return row ? toAircraft(row) : null;
  },
);

export const getAircraftBySlug = cache(
  async (slug: string): Promise<TrainerAircraft | undefined> =>
    (await cachedAircraftBySlug(slug)) ?? undefined,
);

export const getAircraftBySlugs = cached(
  "aircraft-by-slugs",
  async (slugs: string[]): Promise<TrainerAircraft[]> => {
    if (slugs.length === 0) return [];
    const res = await createPublicClient()
      .from("trainer_aircraft")
      .select("*")
      .in("slug", slugs)
      .order("sort_order");
    return orThrow(res).map(toAircraft);
  },
);

// ── Flight Schools ─────────────────────────────────────────────────────────────

async function selectSchools(
  filters?: Record<string, string | boolean>,
  ids?: string[],
): Promise<FlightSchool[]> {
  let query = createPublicClient().from("flight_schools").select(SCHOOL_SELECT);
  if (filters) query = query.match(filters);
  if (ids) query = query.in("id", ids);
  const res = await query.order("name");
  return (orThrow(res) as unknown as SchoolRowWithJoins[]).map(toSchool);
}

/**
 * Schools linked to one row of a join table, in a single query. The join
 * table is embedded twice: once in full (so `programSlugs` / `aircraftSlugs`
 * stay complete) and once under the `matched` alias with `!inner`, which
 * turns the filter on it into a filter on the schools themselves.
 */
async function selectSchoolsByLink(
  table: "school_programs" | "school_aircraft",
  column: "program_slug" | "aircraft_slug",
  slug: string,
): Promise<FlightSchool[]> {
  const res = await createPublicClient()
    .from("flight_schools")
    .select(`${SCHOOL_SELECT}, matched:${table}!inner(${column})`)
    .eq(`matched.${column}`, slug)
    .order("name");
  return (orThrow(res) as unknown as SchoolRowWithJoins[]).map(toSchool);
}

export const getFlightSchools = cached("schools", async (): Promise<FlightSchool[]> => {
  return selectSchools();
});

/** Fresh read (no cross-request cache) — slug uniqueness in submission approval. */
export async function loadSchoolBySlug(slug: string): Promise<FlightSchool | null> {
  const res = await createPublicClient()
    .from("flight_schools")
    .select(SCHOOL_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  const row = orThrow(res) as unknown as SchoolRowWithJoins | null;
  return row ? toSchool(row) : null;
}
const cachedSchoolBySlug = cached("school-by-slug", loadSchoolBySlug);

export const getSchoolBySlug = cache(
  async (slug: string): Promise<FlightSchool | undefined> =>
    (await cachedSchoolBySlug(slug)) ?? undefined,
);

/**
 * Fresh read for actions that check ownership or clean up a replaced logo —
 * they must see the row as it is now, not as it was cached.
 */
export async function loadSchoolById(id: string): Promise<FlightSchool | undefined> {
  const res = await createPublicClient()
    .from("flight_schools")
    .select(SCHOOL_SELECT)
    .eq("id", id)
    .maybeSingle();
  const row = orThrow(res) as unknown as SchoolRowWithJoins | null;
  return row ? toSchool(row) : undefined;
}

export const getSchoolsByState = cached(
  "schools-by-state",
  (stateSlug: string): Promise<FlightSchool[]> => selectSchools({ state_slug: stateSlug }),
);

export const getSchoolsByCity = cached(
  "schools-by-city",
  (citySlug: string): Promise<FlightSchool[]> => selectSchools({ city_slug: citySlug }),
);

export const getSchoolsByAirport = cached(
  "schools-by-airport",
  (icao: string): Promise<FlightSchool[]> =>
    selectSchools({ primary_airport_code: icao.toUpperCase() }),
);

export const getFeaturedSchools = cached(
  "schools-featured",
  (): Promise<FlightSchool[]> => selectSchools({ featured: true }),
);

/**
 * All schools sorted by a weighted score that factors in both rating and
 * review count: score = rating × log(reviewCount + 1)
 */
export const getTopRatedSchools = cache(async (): Promise<FlightSchool[]> => {
  const schools = await getFlightSchools();
  const score = (s: FlightSchool) => s.rating * Math.log(s.reviewCount + 1);
  // Copy before sorting — getFlightSchools() is memoized and its array is
  // shared with every other caller in this request
  return [...schools].sort((a, b) => score(b) - score(a));
});

const getSchoolsByOrganization = cached(
  "schools-by-organization",
  (organizationId: string): Promise<FlightSchool[]> =>
    selectSchools({ organization_id: organizationId }),
);

/** All sibling listings for the same brand (excludes the given school itself) */
export async function getRelatedSchools(school: FlightSchool): Promise<FlightSchool[]> {
  if (!school.organizationId) return [];
  const siblings = await getSchoolsByOrganization(school.organizationId);
  return siblings.filter((s) => s.id !== school.id);
}

export const getSchoolsByProgram = cached(
  "schools-by-program",
  (programSlug: string): Promise<FlightSchool[]> =>
    selectSchoolsByLink("school_programs", "program_slug", programSlug),
);

export const getSchoolsByAircraftSlug = cached(
  "schools-by-aircraft",
  (aircraftSlug: string): Promise<FlightSchool[]> =>
    selectSchoolsByLink("school_aircraft", "aircraft_slug", aircraftSlug),
);

/** Fresh read — the idempotency check in submission approval. */
export function loadSchoolsManagedByUser(userId: string): Promise<FlightSchool[]> {
  return selectSchools({ managed_by: userId });
}
export const getSchoolsManagedByUser = cached("schools-managed-by", loadSchoolsManagedByUser);

const cachedSchoolsByIds = cached(
  "schools-by-ids",
  (ids: string[]): Promise<FlightSchool[]> => selectSchools(undefined, ids),
);

/** Schools for a set of ids, keyed by id */
export async function getSchoolsByIds(
  ids: string[],
): Promise<Record<string, FlightSchool>> {
  const byId: Record<string, FlightSchool> = {};
  if (ids.length === 0) return byId;
  // Sorted + deduped so the cache key doesn't depend on the caller's order
  const schools = await cachedSchoolsByIds([...new Set(ids)].sort());
  for (const school of schools) byId[school.id] = school;
  return byId;
}

/**
 * City-name and state lookup maps for building "City, ST" labels without
 * per-row queries.
 */
export const getLocationMaps = cache(
  async (): Promise<{
    cityNameBySlug: Record<string, string>;
    stateBySlug: Record<string, State>;
  }> => {
    const [cities, states] = await Promise.all([getCities(), getStates()]);
    return {
      cityNameBySlug: Object.fromEntries(cities.map((c) => [c.slug, c.name])),
      stateBySlug: Object.fromEntries(states.map((s) => [s.slug, s])),
    };
  },
);

// ── Reviews & Comments ─────────────────────────────────────────────────────────
// Public-read but user-generated: anon client, per-request memo only.

export const getReviewsBySchool = cache(async (schoolId: string): Promise<Review[]> => {
  const res = await createPublicClient()
    .from("reviews")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });
  return orThrow(res).map(toReview);
});

export const getReviewsByUser = cache(async (userId: string): Promise<Review[]> => {
  const res = await createPublicClient()
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return orThrow(res).map(toReview);
});

/** Reviews for a set of ids, keyed by id */
export async function getReviewsByIds(ids: string[]): Promise<Record<string, Review>> {
  const byId: Record<string, Review> = {};
  if (ids.length === 0) return byId;
  const res = await createPublicClient()
    .from("reviews")
    .select("*")
    .in("id", [...new Set(ids)]);
  for (const row of orThrow(res)) byId[row.id] = toReview(row);
  return byId;
}

/** Comments for a set of reviews, grouped by review id */
export async function getCommentsForReviews(
  reviewIds: string[],
): Promise<Record<string, Comment[]>> {
  const grouped: Record<string, Comment[]> = {};
  if (reviewIds.length === 0) return grouped;
  const res = await createPublicClient()
    .from("comments")
    .select("*")
    .in("review_id", reviewIds)
    .order("created_at");
  for (const row of orThrow(res)) {
    (grouped[row.review_id] ??= []).push(toComment(row));
  }
  return grouped;
}

export const getCommentsByUser = cache(async (userId: string): Promise<Comment[]> => {
  const res = await createPublicClient()
    .from("comments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return orThrow(res).map(toComment);
});

/** Coerce a caller-supplied row limit to an integer in [1, 200] */
function clampLimit(limit: number): number {
  const n = Math.trunc(limit);
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), 200) : 50;
}

/** Newest reviews across every school — the moderation queue. */
export async function getRecentReviews(limit = 50): Promise<Review[]> {
  const res = await createPublicClient()
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(clampLimit(limit));
  return orThrow(res).map(toReview);
}

/** Newest comments across every review — the moderation queue. */
export async function getRecentComments(limit = 50): Promise<Comment[]> {
  const res = await createPublicClient()
    .from("comments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(clampLimit(limit));
  return orThrow(res).map(toComment);
}

// ── Admin overview ─────────────────────────────────────────────────────────────

export type AdminCounts = {
  pendingSubmissions: number;
  newLeads: number;
  reviews: number;
  comments: number;
  reviewsLast7Days: number;
};

/**
 * Head-only counts for the /admin overview. Leads and submissions are
 * RLS-scoped, so a non-admin would simply see zeros (the page 404s first).
 */
export async function getAdminCounts(): Promise<AdminCounts> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const count = async (
    query: PromiseLike<{ count: number | null; error: { message: string } | null }>,
  ): Promise<number> => {
    const res = await query;
    if (res.error) throw new Error(`Supabase query failed: ${res.error.message}`);
    return res.count ?? 0;
  };
  const head = { count: "exact", head: true } as const;
  const [pendingSubmissions, newLeads, reviews, comments, reviewsLast7Days] = await Promise.all([
    count(supabase.from("school_submissions").select("id", head).eq("status", "pending")),
    count(supabase.from("leads").select("id", head).eq("status", "new")),
    count(supabase.from("reviews").select("id", head)),
    count(supabase.from("comments").select("id", head)),
    count(supabase.from("reviews").select("id", head).gte("created_at", since)),
  ]);
  return { pendingSubmissions, newLeads, reviews, comments, reviewsLast7Days };
}

// ── School submissions ─────────────────────────────────────────────────────────
// Reads are RLS-gated: submitters see their own rows, admins see all.

function toSubmission(row: Tables<"school_submissions">): SchoolSubmission {
  return {
    id: row.id,
    submittedBy: row.submitted_by,
    status: row.status as SubmissionStatus,
    name: row.name,
    description: row.description,
    website: row.website,
    phone: row.phone,
    airportCode: row.airport_code,
    city: row.city,
    state: row.state,
    faaPart: (row.faa_part as "61" | "141" | "both" | null) ?? undefined,
    programs: (row.programs as string[]) ?? [],
    estimatedPlanes: (row.estimated_planes as FleetRange | null) ?? undefined,
    estimatedInstructors:
      (row.estimated_instructors as FleetRange | null) ?? undefined,
    contacts: (row.contacts as ContactPerson[]) ?? [],
    createdAt: row.created_at,
  };
}

export async function getSchoolSubmissions(
  status?: SubmissionStatus,
): Promise<SchoolSubmission[]> {
  const supabase = await createClient();
  let query = supabase.from("school_submissions").select("*");
  if (status) query = query.eq("status", status);
  const res = await query.order("created_at", { ascending: false });
  return orThrow(res).map(toSubmission);
}

export async function getSchoolSubmissionById(
  id: string,
): Promise<SchoolSubmission | undefined> {
  const supabase = await createClient();
  const res = await supabase
    .from("school_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const row = orThrow(res);
  return row ? toSubmission(row) : undefined;
}

// ── Users (profiles) ───────────────────────────────────────────────────────────
// Public-read; per-request memo only so a profile edit shows up immediately.

export const getUserById = cache(async (id: string): Promise<User | undefined> => {
  const res = await createPublicClient().from("profiles").select("*").eq("id", id).maybeSingle();
  const row = orThrow(res);
  return row ? toUser(row) : undefined;
});

/** Profiles for a set of user ids, keyed by id (for review/comment author display) */
export async function getUsersByIds(ids: string[]): Promise<Record<string, User>> {
  const byId: Record<string, User> = {};
  if (ids.length === 0) return byId;
  const res = await createPublicClient().from("profiles").select("*").in("id", [...new Set(ids)]);
  for (const row of orThrow(res)) {
    byId[row.id] = toUser(row);
  }
  return byId;
}

// ── Search ─────────────────────────────────────────────────────────────────────

/** Compact index of schools + airports for the client-side hero search */
export const getSearchIndex = cache(
  async (): Promise<{
    schools: SchoolSearchItem[];
    airports: AirportSearchItem[];
  }> => {
    const [schools, airports, cities, states] = await Promise.all([
      getFlightSchools(),
      getAirports(),
      getCities(),
      getStates(),
    ]);

    const cityNames = Object.fromEntries(cities.map((c) => [c.slug, c.name]));
    const statesBySlug = Object.fromEntries(states.map((s) => [s.slug, s]));

    const locationOf = (citySlug: string, stateSlug: string) => {
      const cityName = cityNames[citySlug];
      const state = statesBySlug[stateSlug];
      return cityName && state ? `${cityName}, ${state.abbreviation}` : citySlug;
    };

    return {
      schools: schools.map((s) => ({
        id: s.id,
        name: s.name,
        location: locationOf(s.citySlug, s.stateSlug),
        href: schoolHref(s),
        airport: s.primaryAirportCode,
        stateName: statesBySlug[s.stateSlug]?.name ?? s.stateSlug,
        stateAbbreviation: statesBySlug[s.stateSlug]?.abbreviation ?? "",
      })),
      airports: airports.map((a) => ({
        id: a.id,
        code: a.icao,
        iata: a.iata,
        faaLid: a.faaLid,
        name: a.name,
        location: locationOf(a.citySlug, a.stateSlug),
        href: `/airports/${a.icao.toLowerCase()}`,
      })),
    };
  },
);

// ── Favorites ──────────────────────────────────────────────────────────────────

/** Ids of the schools a user has saved, newest first. RLS limits this to the caller's own rows. */
export const getFavoriteSchoolIds = cache(async (userId: string): Promise<string[]> => {
  const supabase = await createClient();
  const res = await supabase
    .from("favorites")
    .select("school_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return orThrow(res).map((r) => r.school_id);
});

/** Saved schools in saved order (newest first). */
export async function getFavoriteSchools(userId: string): Promise<FlightSchool[]> {
  const ids = await getFavoriteSchoolIds(userId);
  const byId = await getSchoolsByIds(ids);
  return ids.flatMap((id) => (byId[id] ? [byId[id]] : []));
}

// ── Leads ──────────────────────────────────────────────────────────────────────

/** Everything an admin needs — never ip_hash. */
const LEAD_SELECT =
  "id, school_id, name, email, phone, program_slug, message, source_path, status, created_at";
type LeadRow = Omit<Tables<"leads">, "ip_hash">;

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    schoolId: row.school_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    programSlug: row.program_slug ?? undefined,
    message: row.message,
    sourcePath: row.source_path,
    status: row.status as LeadStatus,
    createdAt: row.created_at,
  };
}

/** All leads, newest first. RLS restricts this to admins (others get an empty list). */
export async function getLeads(): Promise<Lead[]> {
  const supabase = await createClient();
  const res = await supabase
    .from("leads")
    .select(LEAD_SELECT)
    .order("created_at", { ascending: false });
  return orThrow(res).map(toLead);
}
