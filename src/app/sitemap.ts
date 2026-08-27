import type { MetadataRoute } from "next";
import {
  getStates,
  getCitiesWithCounts,
  getAirportsWithSchoolCounts,
  getFlightSchools,
  getPrograms,
  getTrainerAircraft,
} from "@/lib/data";
import { schoolHref } from "@/lib/utils";
import { absoluteUrl } from "@/lib/site";

// Rendered per request rather than prerendered at build: that keeps `next
// build` from needing Supabase credentials. The catalog getters are served
// from the cross-request cache, so a warm hit costs no database queries.
export const dynamic = "force-dynamic";

/**
 * Only locations that list at least one school. With a small catalog most
 * states, cities and airports would otherwise be near-empty template pages —
 * thin content that dilutes the crawl budget. Their pages send `noindex`
 * until they have a listing (see thinPageRobots), so the sitemap must not
 * advertise them either.
 */
const listed = <T extends { schoolCount: number }>(rows: T[]): T[] =>
  rows.filter((row) => row.schoolCount > 0);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [allStates, allCities, allAirports, flightSchools, programs, aircraft] =
    await Promise.all([
      getStates(),
      getCitiesWithCounts(),
      getAirportsWithSchoolCounts(),
      getFlightSchools(),
      getPrograms(),
      getTrainerAircraft(),
    ]);
  const states = listed(allStates);
  const cities = listed(allCities);
  const airports = listed(allAirports);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/search"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/near-me"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/states"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/cities"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/airports"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/programs"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/aircraft"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/top-rated"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/featured"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/how-it-works"), changeFrequency: "monthly", priority: 0.7 },
  ];

  const stateRoutes: MetadataRoute.Sitemap = states.map((s) => ({
    url: absoluteUrl(`/states/${s.slug}`),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const cityRoutes: MetadataRoute.Sitemap = cities.map((c) => ({
    url: absoluteUrl(`/cities/${c.slug}`),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const airportRoutes: MetadataRoute.Sitemap = airports.map((a) => ({
    url: absoluteUrl(`/airports/${a.icao.toLowerCase()}`),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const programRoutes: MetadataRoute.Sitemap = programs.map((p) => ({
    url: absoluteUrl(`/programs/${p.slug}`),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const aircraftRoutes: MetadataRoute.Sitemap = aircraft.map((a) => ({
    url: absoluteUrl(`/aircraft/${a.slug}`),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const schoolRoutes: MetadataRoute.Sitemap = flightSchools.map((s) => ({
    url: absoluteUrl(schoolHref(s)),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    ...staticRoutes,
    ...stateRoutes,
    ...cityRoutes,
    ...airportRoutes,
    ...programRoutes,
    ...aircraftRoutes,
    ...schoolRoutes,
  ];
}
