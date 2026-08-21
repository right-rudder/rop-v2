import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { getTopRatedSchools, getLocationMaps } from "@/lib/data";
import { schoolHref } from "@/lib/utils";
import { TopRatedExplorer, type TopRatedItem } from "@/components/TopRatedExplorer";

export const metadata: Metadata = {
  title: "Top Rated Flight Schools",
  description:
    "Discover the highest-rated flight schools in the USA. Ranked by student reviews and ratings for Private Pilot, Instrument, Commercial, CFI, and ATP training.",
  alternates: { canonical: "/top-rated" },
  openGraph: {
    title: "Top Rated Flight Schools",
    description:
      "Discover the highest-rated flight schools in the USA. Ranked by student reviews and ratings for Private Pilot, Instrument, Commercial, CFI, and ATP training.",
    url: "/top-rated",
    type: "website",
  },
  twitter: {
    title: "Top Rated Flight Schools",
    description:
      "Discover the highest-rated flight schools in the USA. Ranked by student reviews and ratings for Private Pilot, Instrument, Commercial, CFI, and ATP training.",
  },
};

export default async function TopRatedPage() {
  const [topRated, { cityNameBySlug, stateBySlug }] = await Promise.all([
    getTopRatedSchools(),
    getLocationMaps(),
  ]);
  // Only what the cards render — keeps contacts / managedBy out of the client payload
  const schools: TopRatedItem[] = topRated.map((school) => {
    const cityName = cityNameBySlug[school.citySlug];
    const state = stateBySlug[school.stateSlug];
    return {
      id: school.id,
      name: school.name,
      rating: school.rating,
      reviewCount: school.reviewCount,
      airportCode: school.primaryAirportCode,
      location: cityName && state ? `${cityName}, ${state.abbreviation}` : school.citySlug,
      href: schoolHref(school),
    };
  });

  return (
    <div className="pb-20">
      <PageHero
        eyebrow="Ranked by student reviews"
        title="Top rated flight schools"
        description="The highest-rated flight training programs across the USA — ordered by rating, then by how many students weighed in."
      />
      <TopRatedExplorer schools={schools} />
    </div>
  );
}
