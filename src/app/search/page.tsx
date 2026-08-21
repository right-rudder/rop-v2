import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getFlightSchools,
  getPrograms,
  getTrainerAircraft,
  getStates,
  getCities,
} from "@/lib/data";
import { schoolHref, slugToTitle } from "@/lib/utils";
import { AdvancedSearchExplorer } from "@/components/AdvancedSearchExplorer";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Search Flight Schools",
  description:
    "Filter USA flight schools by state, airport code, aircraft fleet, programs offered, and FAA Part 61 or Part 141 certification to find the perfect fit for your training goals.",
  openGraph: {
    title: "Search Flight Schools",
    description:
      "Filter by state, airport, aircraft, programs, and training type to find your ideal flight school.",
  },
};

export default async function SearchPage() {
  const [flightSchools, programs, trainerAircraft, states, cities] =
    await Promise.all([
      getFlightSchools(),
      getPrograms(),
      getTrainerAircraft(),
      getStates(),
      getCities(),
    ]);

  const stateAbbrevMap = Object.fromEntries(
    states.map((s) => [s.slug, s.abbreviation])
  );
  const cityNameMap = Object.fromEntries(cities.map((c) => [c.slug, c.name]));

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
    location: `${cityNameMap[school.citySlug] ?? slugToTitle(school.citySlug)}, ${stateAbbrevMap[school.stateSlug] ?? school.stateSlug.toUpperCase()}`,
  }));

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
  }));

  return (
    <div className="pb-20">
      <PageHero
        eyebrow={`${schoolData.length} schools / ${programs.length} programs / ${trainerAircraft.length} aircraft`}
        title="Search flight schools"
        description="Narrow the whole directory by state, city, airport, training type, programs offered, fleet and rating."
      />
    <Suspense>
      <AdvancedSearchExplorer
        schools={schoolData}
        programs={programOptions}
        aircraft={aircraftOptions}
        states={stateOptions}
        cities={cityOptions}
      />
    </Suspense>
    </div>
  );
}
