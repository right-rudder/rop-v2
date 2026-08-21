import type { Metadata } from "next";
import { SchoolCard } from "@/components/SchoolCard";
import { PageHero } from "@/components/PageHero";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { EmptyState } from "@/components/EmptyState";
import { getFeaturedSchools, getLocationMaps } from "@/lib/data";
import { schoolHref } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Featured Flight Schools",
  description:
    "Explore our hand-picked featured flight schools across the USA. Top-rated programs for Private Pilot, Instrument, Commercial, CFI, and ATP certifications.",
  alternates: { canonical: "/featured" },
  openGraph: {
    title: "Featured Flight Schools",
    description:
      "Explore our hand-picked featured flight schools across the USA. Top-rated programs for Private Pilot, Instrument, Commercial, CFI, and ATP certifications.",
    url: "/featured",
    type: "website",
  },
  twitter: {
    title: "Featured Flight Schools",
    description:
      "Explore our hand-picked featured flight schools across the USA. Top-rated programs for Private Pilot, Instrument, Commercial, CFI, and ATP certifications.",
  },
};

export default async function FeaturedSchoolsPage() {
  const [featuredSchools, { cityNameBySlug, stateBySlug }] = await Promise.all([
    getFeaturedSchools(),
    getLocationMaps(),
  ]);

  return (
    <div className="pb-20">
      <PageHero
        eyebrow={`${featuredSchools.length} featured school${featuredSchools.length !== 1 ? "s" : ""}`}
        title="Featured flight schools"
        description="Schools with a strong reputation for flight training, offering programs from Private Pilot through Instrument, Commercial, CFI and ATP."
      />

      <Container className="py-12 md:py-16">
        {featuredSchools.length === 0 ? (
          <EmptyState title="No featured schools yet" hint="Know a school that belongs here?" />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredSchools.map((school, i) => {
              const cityName = cityNameBySlug[school.citySlug];
              const state = stateBySlug[school.stateSlug];
              const location =
                cityName && state ? `${cityName}, ${state.abbreviation}` : school.citySlug;
              return (
                <Reveal key={school.id} index={i % 6} className="h-full">
                  <SchoolCard
                    name={school.name}
                    location={location}
                    airportCode={school.primaryAirportCode}
                    rating={school.rating}
                    reviewCount={school.reviewCount}
                    href={schoolHref(school)}
                  />
                </Reveal>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
