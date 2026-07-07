import type { Metadata } from "next";
import { SchoolCard } from "@/components/SchoolCard";
import { getFeaturedSchools, getCityBySlug, getStateBySlug } from "@/lib/mock-data";
import { schoolHref } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Featured Flight Schools – Flight School Finder",
  description:
    "Explore our hand-picked featured flight schools across the USA. Top-rated programs for Private Pilot, Instrument, Commercial, CFI, and ATP certifications.",
  alternates: { canonical: "/featured" },
  openGraph: {
    title: "Featured Flight Schools – Flight School Finder",
    description:
      "Explore our hand-picked featured flight schools across the USA. Top-rated programs for Private Pilot, Instrument, Commercial, CFI, and ATP certifications.",
    url: "/featured",
    type: "website",
  },
  twitter: {
    title: "Featured Flight Schools – Flight School Finder",
    description:
      "Explore our hand-picked featured flight schools across the USA. Top-rated programs for Private Pilot, Instrument, Commercial, CFI, and ATP certifications.",
  },
};

export default function FeaturedSchoolsPage() {
  const featuredSchools = getFeaturedSchools();

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="bg-linear-to-br from-slate-950 via-blue-950 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Featured Flight Schools
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Featured schools that have a great reputation for flight training with programs for Private Pilot, Instrument, Commercial, CFI, and ATP.
          </p>
        </div>
      </section>

      {/* School grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          {featuredSchools.length} featured school{featuredSchools.length !== 1 ? "s" : ""}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredSchools.map((school) => {
            const city = getCityBySlug(school.citySlug);
            const state = getStateBySlug(school.stateSlug);
            const location = city && state
              ? `${city.name}, ${state.abbreviation}`
              : school.citySlug;
            return (
              <SchoolCard
                key={school.id}
                name={school.name}
                location={location}
                rating={school.rating}
                reviewCount={school.reviewCount}
                href={schoolHref(school)}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
