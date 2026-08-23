import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getFlightSchools,
  getPrograms,
  getTrainerAircraft,
  getStates,
  getCities,
  getAirports,
} from "@/lib/data";
import { centroid } from "@/lib/geo";
import { schoolHref, slugToTitle } from "@/lib/utils";
import { AdvancedSearchExplorer } from "@/components/AdvancedSearchExplorer";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Search Flight Schools",
  description:
    "Filter USA flight schools by location, state, airport code, aircraft fleet, programs offered, and FAA Part 61 or Part 141 certification — or search within a radius of where you are.",
  // Filters live in the query string; every combination is the same page
  alternates: { canonical: "/search" },
  openGraph: {
    title: "Search Flight Schools",
    description:
      "Filter by state, airport, aircraft, programs, and training type to find your ideal flight school.",
    url: "/search",
    type: "website",
  },
};

export default async function SearchPage() {
  const [flightSchools, programs, trainerAircraft, states, cities, airports] =
    await Promise.all([
      getFlightSchools(),
      getPrograms(),
      getTrainerAircraft(),
      getStates(),
      getCities(),
      getAirports(),
    ]);

  const stateAbbrevMap = Object.fromEntries(
    states.map((s) => [s.slug, s.abbreviation])
  );
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

  const programOptions = programs.map((p) => ({
    slug: p.slug,
    shortName: p.shortName,
  }));

  const aircraftOptions = trainerAircraft.map((a) => ({
    slug: a.slug,
    displayName: a.displayName,
  }));

  const stateOptions = states.map((s) => ({
    slug: s.slug,
    name: s.name,
    abbreviation: s.abbreviation,
  }));

  const cityOptions = cities.map((c) => ({
    slug: c.slug,
    name: c.name,
    stateSlug: c.stateSlug,
    stateAbbreviation: c.stateAbbreviation,
    coords: centroid(
      airports.flatMap((a) => (a.citySlug === c.slug && a.coords ? [a.coords] : [])),
    ),
  }));

  return (
    <div className="pb-20">
      <PageHero
        eyebrow={`${schoolData.length} schools / ${programs.length} programs / ${trainerAircraft.length} aircraft`}
        title="Search flight schools"
        description="Narrow the whole directory by location, state, city, airport, training type, programs offered, fleet and rating — or search near you."
      />
    <Suspense>
      <AdvancedSearchExplorer
        schools={schoolData}
        programs={programOptions}
        aircraft={aircraftOptions}
        states={stateOptions}
        cities={cityOptions}
        airports={airportOptions}
      />
    </Suspense>
    </div>
  );
}
