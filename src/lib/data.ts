/**
 * Data-access layer backed by Supabase.
 *
 * Mirrors the helper API that src/lib/mock-data.ts exposed, but async and
 * reading from the database. Server Components, Server Actions, and Route
 * Handlers should import from here; pass plain data down to Client
 * Components as props.
 */
import { createClient } from "@/lib/supabase/server";
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
} from "@/lib/types";
import type { Tables } from "@/lib/supabase/database.types";
import type {
  SchoolSearchItem,
  AirportSearchItem,
} from "@/components/HeroSearch";
import { schoolHref } from "@/lib/utils";

type FaaPart = "61" | "141" | "both";

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

export async function getStates(): Promise<State[]> {
  const supabase = await createClient();
  const res = await supabase.from("states").select(STATE_SELECT).order("name");
  return (orThrow(res) as unknown as StateRowWithCounts[]).map(toState);
}

export async function getStateBySlug(slug: string): Promise<State | undefined> {
  const supabase = await createClient();
  const res = await supabase
    .from("states")
    .select(STATE_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  const row = orThrow(res) as unknown as StateRowWithCounts | null;
  return row ? toState(row) : undefined;
}

// ── Cities ─────────────────────────────────────────────────────────────────────

export async function getCities(): Promise<City[]> {
  const supabase = await createClient();
  const res = await supabase.from("cities").select("*").order("name");
  return orThrow(res).map(toCity);
}

export async function getCityBySlug(slug: string): Promise<City | undefined> {
  const supabase = await createClient();
  const res = await supabase.from("cities").select("*").eq("slug", slug).maybeSingle();
  const row = orThrow(res);
  return row ? toCity(row) : undefined;
}

export async function getCitiesBySlugs(slugs: string[]): Promise<City[]> {
  if (slugs.length === 0) return [];
  const supabase = await createClient();
  const res = await supabase.from("cities").select("*").in("slug", slugs);
  return orThrow(res).map(toCity);
}

type CityRowWithCounts = Tables<"cities"> & {
  flight_schools: { count: number }[];
  airports: { count: number }[];
};

/** Cities with per-city school and airport counts (for the cities explorer) */
export async function getCitiesWithCounts(): Promise<
  (City & { schoolCount: number; airportCount: number })[]
> {
  const supabase = await createClient();
  const res = await supabase
    .from("cities")
    .select("*, flight_schools(count), airports(count)")
    .order("name");
  return (orThrow(res) as unknown as CityRowWithCounts[]).map((row) => ({
    ...toCity(row),
    schoolCount: row.flight_schools[0]?.count ?? 0,
    airportCount: row.airports[0]?.count ?? 0,
  }));
}

export async function getCitiesByState(stateSlug: string): Promise<City[]> {
  const supabase = await createClient();
  const res = await supabase
    .from("cities")
    .select("*")
    .eq("state_slug", stateSlug)
    .order("name");
  return orThrow(res).map(toCity);
}

// ── Airports ───────────────────────────────────────────────────────────────────

export async function getAirports(): Promise<Airport[]> {
  const supabase = await createClient();
  const res = await supabase.from("airports").select("*").order("icao");
  return orThrow(res).map(toAirport);
}

type AirportRowWithCount = Tables<"airports"> & {
  flight_schools: { count: number }[];
};

/** Airports with per-airport school counts (for the airports explorer) */
export async function getAirportsWithSchoolCounts(): Promise<
  (Airport & { schoolCount: number })[]
> {
  const supabase = await createClient();
  const res = await supabase
    .from("airports")
    .select("*, flight_schools(count)")
    .order("icao");
  return (orThrow(res) as unknown as AirportRowWithCount[]).map((row) => ({
    ...toAirport(row),
    schoolCount: row.flight_schools[0]?.count ?? 0,
  }));
}

/** Look up airport by any of its three identifiers (case-insensitive) */
export async function getAirportByCode(code: string): Promise<Airport | undefined> {
  const upper = code.toUpperCase();
  const supabase = await createClient();
  const res = await supabase
    .from("airports")
    .select("*")
    .or(`icao.eq.${upper},iata.eq.${upper},faa_lid.eq.${upper}`)
    .maybeSingle();
  const row = orThrow(res);
  return row ? toAirport(row) : undefined;
}

export async function getAirportsByCity(citySlug: string): Promise<Airport[]> {
  const supabase = await createClient();
  const res = await supabase
    .from("airports")
    .select("*")
    .eq("city_slug", citySlug)
    .order("icao");
  return orThrow(res).map(toAirport);
}

export async function getAirportsByState(stateSlug: string): Promise<Airport[]> {
  const supabase = await createClient();
  const res = await supabase
    .from("airports")
    .select("*")
    .eq("state_slug", stateSlug)
    .order("icao");
  return orThrow(res).map(toAirport);
}

// ── Programs ───────────────────────────────────────────────────────────────────

export async function getPrograms(): Promise<Program[]> {
  const supabase = await createClient();
  const res = await supabase.from("programs").select("*").order("sort_order");
  return orThrow(res).map(toProgram);
}

export async function getProgramBySlug(slug: string): Promise<Program | undefined> {
  const supabase = await createClient();
  const res = await supabase.from("programs").select("*").eq("slug", slug).maybeSingle();
  const row = orThrow(res);
  return row ? toProgram(row) : undefined;
}

export async function getProgramsBySlugs(slugs: string[]): Promise<Program[]> {
  if (slugs.length === 0) return [];
  const supabase = await createClient();
  const res = await supabase
    .from("programs")
    .select("*")
    .in("slug", slugs)
    .order("sort_order");
  return orThrow(res).map(toProgram);
}

// ── Trainer Aircraft ───────────────────────────────────────────────────────────

export async function getTrainerAircraft(): Promise<TrainerAircraft[]> {
  const supabase = await createClient();
  const res = await supabase.from("trainer_aircraft").select("*").order("sort_order");
  return orThrow(res).map(toAircraft);
}

export async function getAircraftBySlug(
  slug: string,
): Promise<TrainerAircraft | undefined> {
  const supabase = await createClient();
  const res = await supabase
    .from("trainer_aircraft")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  const row = orThrow(res);
  return row ? toAircraft(row) : undefined;
}

export async function getAircraftBySlugs(slugs: string[]): Promise<TrainerAircraft[]> {
  if (slugs.length === 0) return [];
  const supabase = await createClient();
  const res = await supabase
    .from("trainer_aircraft")
    .select("*")
    .in("slug", slugs)
    .order("sort_order");
  return orThrow(res).map(toAircraft);
}

// ── Flight Schools ─────────────────────────────────────────────────────────────

async function selectSchools(
  filters?: Record<string, string | boolean>,
  ids?: string[],
): Promise<FlightSchool[]> {
  const supabase = await createClient();
  let query = supabase.from("flight_schools").select(SCHOOL_SELECT);
  if (filters) query = query.match(filters);
  if (ids) query = query.in("id", ids);
  const res = await query.order("name");
  return (orThrow(res) as unknown as SchoolRowWithJoins[]).map(toSchool);
}

export async function getFlightSchools(): Promise<FlightSchool[]> {
  return selectSchools();
}

export async function getSchoolBySlug(slug: string): Promise<FlightSchool | undefined> {
  const supabase = await createClient();
  const res = await supabase
    .from("flight_schools")
    .select(SCHOOL_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  const row = orThrow(res) as unknown as SchoolRowWithJoins | null;
  return row ? toSchool(row) : undefined;
}

export async function getSchoolById(id: string): Promise<FlightSchool | undefined> {
  const supabase = await createClient();
  const res = await supabase
    .from("flight_schools")
    .select(SCHOOL_SELECT)
    .eq("id", id)
    .maybeSingle();
  const row = orThrow(res) as unknown as SchoolRowWithJoins | null;
  return row ? toSchool(row) : undefined;
}

export async function getSchoolsByState(stateSlug: string): Promise<FlightSchool[]> {
  return selectSchools({ state_slug: stateSlug });
}

export async function getSchoolsByCity(citySlug: string): Promise<FlightSchool[]> {
  return selectSchools({ city_slug: citySlug });
}

export async function getSchoolsByAirport(icao: string): Promise<FlightSchool[]> {
  return selectSchools({ primary_airport_code: icao.toUpperCase() });
}

export async function getFeaturedSchools(): Promise<FlightSchool[]> {
  return selectSchools({ featured: true });
}

/**
 * All schools sorted by a weighted score that factors in both rating and
 * review count: score = rating × log(reviewCount + 1)
 */
export async function getTopRatedSchools(): Promise<FlightSchool[]> {
  const schools = await getFlightSchools();
  const score = (s: FlightSchool) => s.rating * Math.log(s.reviewCount + 1);
  return schools.sort((a, b) => score(b) - score(a));
}

/** All sibling listings for the same brand (excludes the given school itself) */
export async function getRelatedSchools(school: FlightSchool): Promise<FlightSchool[]> {
  if (!school.organizationId) return [];
  const siblings = await selectSchools({ organization_id: school.organizationId });
  return siblings.filter((s) => s.id !== school.id);
}

export async function getSchoolsByProgram(programSlug: string): Promise<FlightSchool[]> {
  const supabase = await createClient();
  const links = orThrow(
    await supabase
      .from("school_programs")
      .select("school_id")
      .eq("program_slug", programSlug),
  );
  const ids = links.map((l) => l.school_id);
  if (ids.length === 0) return [];
  return selectSchools(undefined, ids);
}

export async function getSchoolsByAircraftSlug(
  aircraftSlug: string,
): Promise<FlightSchool[]> {
  const supabase = await createClient();
  const links = orThrow(
    await supabase
      .from("school_aircraft")
      .select("school_id")
      .eq("aircraft_slug", aircraftSlug),
  );
  const ids = links.map((l) => l.school_id);
  if (ids.length === 0) return [];
  return selectSchools(undefined, ids);
}

export async function getSchoolsManagedByUser(userId: string): Promise<FlightSchool[]> {
  return selectSchools({ managed_by: userId });
}

/** Schools for a set of ids, keyed by id */
export async function getSchoolsByIds(
  ids: string[],
): Promise<Record<string, FlightSchool>> {
  const byId: Record<string, FlightSchool> = {};
  if (ids.length === 0) return byId;
  const schools = await selectSchools(undefined, [...new Set(ids)]);
  for (const school of schools) byId[school.id] = school;
  return byId;
}

/**
 * City-name and state lookup maps for building "City, ST" labels without
 * per-row queries.
 */
export async function getLocationMaps(): Promise<{
  cityNameBySlug: Record<string, string>;
  stateBySlug: Record<string, State>;
}> {
  const [cities, states] = await Promise.all([getCities(), getStates()]);
  return {
    cityNameBySlug: Object.fromEntries(cities.map((c) => [c.slug, c.name])),
    stateBySlug: Object.fromEntries(states.map((s) => [s.slug, s])),
  };
}

// ── Reviews & Comments ─────────────────────────────────────────────────────────

export async function getReviewsBySchool(schoolId: string): Promise<Review[]> {
  const supabase = await createClient();
  const res = await supabase
    .from("reviews")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });
  return orThrow(res).map(toReview);
}

export async function getReviewsByUser(userId: string): Promise<Review[]> {
  const supabase = await createClient();
  const res = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return orThrow(res).map(toReview);
}

/** Reviews for a set of ids, keyed by id */
export async function getReviewsByIds(ids: string[]): Promise<Record<string, Review>> {
  const byId: Record<string, Review> = {};
  if (ids.length === 0) return byId;
  const supabase = await createClient();
  const res = await supabase
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
  const supabase = await createClient();
  const res = await supabase
    .from("comments")
    .select("*")
    .in("review_id", reviewIds)
    .order("created_at");
  for (const row of orThrow(res)) {
    (grouped[row.review_id] ??= []).push(toComment(row));
  }
  return grouped;
}

export async function getCommentsByUser(userId: string): Promise<Comment[]> {
  const supabase = await createClient();
  const res = await supabase
    .from("comments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return orThrow(res).map(toComment);
}

// ── Users (profiles) ───────────────────────────────────────────────────────────

export async function getUserById(id: string): Promise<User | undefined> {
  const supabase = await createClient();
  const res = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  const row = orThrow(res);
  return row ? toUser(row) : undefined;
}

// ── Search ─────────────────────────────────────────────────────────────────────

/** Compact index of schools + airports for the client-side hero search */
export async function getSearchIndex(): Promise<{
  schools: SchoolSearchItem[];
  airports: AirportSearchItem[];
}> {
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
}

/** Profiles for a set of user ids, keyed by id (for review/comment author display) */
export async function getUsersByIds(ids: string[]): Promise<Record<string, User>> {
  const byId: Record<string, User> = {};
  if (ids.length === 0) return byId;
  const supabase = await createClient();
  const res = await supabase.from("profiles").select("*").in("id", [...new Set(ids)]);
  for (const row of orThrow(res)) {
    byId[row.id] = toUser(row);
  }
  return byId;
}
