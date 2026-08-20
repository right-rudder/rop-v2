import type { MetadataRoute } from "next";
import {
  getStates,
  getCities,
  getAirports,
  getFlightSchools,
  getPrograms,
  getTrainerAircraft,
} from "@/lib/data";
import { schoolHref } from "@/lib/utils";
import { absoluteUrl } from "@/lib/site";

// Rendered per request — the sitemap reads live rows from Supabase
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [states, cities, airports, flightSchools, programs, aircraft] =
    await Promise.all([
      getStates(),
      getCities(),
      getAirports(),
      getFlightSchools(),
      getPrograms(),
      getTrainerAircraft(),
    ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/search"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/states"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/cities"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/airports"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/programs"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/aircraft"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/top-rated"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/featured"), changeFrequency: "weekly", priority: 0.9 },
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
