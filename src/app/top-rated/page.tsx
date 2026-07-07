import type { Metadata } from "next";
import { Star } from "lucide-react";
import { getTopRatedSchools, getCityBySlug, getStateBySlug } from "@/lib/mock-data";
import { schoolHref } from "@/lib/utils";
import { TopRatedExplorer } from "@/components/TopRatedExplorer";

export const metadata: Metadata = {
  title: "Top Rated Flight Schools – Flight School Finder",
  description:
    "Discover the highest-rated flight schools in the USA. Ranked by student reviews and ratings for Private Pilot, Instrument, Commercial, CFI, and ATP training.",
  alternates: { canonical: "/top-rated" },
  openGraph: {
    title: "Top Rated Flight Schools – Flight School Finder",
    description:
      "Discover the highest-rated flight schools in the USA. Ranked by student reviews and ratings for Private Pilot, Instrument, Commercial, CFI, and ATP training.",
    url: "/top-rated",
    type: "website",
  },
  twitter: {
    title: "Top Rated Flight Schools – Flight School Finder",
    description:
      "Discover the highest-rated flight schools in the USA. Ranked by student reviews and ratings for Private Pilot, Instrument, Commercial, CFI, and ATP training.",
  },
};

export default function TopRatedPage() {
  const schools = getTopRatedSchools().map((school) => {
    const city = getCityBySlug(school.citySlug);
    const state = getStateBySlug(school.stateSlug);
    return {
      ...school,
      location: city && state ? `${city.name}, ${state.abbreviation}` : school.citySlug,
      href: schoolHref(school),
    };
  });

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="bg-linear-to-br from-slate-950 via-blue-950 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Star className="w-10 h-10 fill-yellow-500 text-yellow-500 opacity-90" />
            <Star className="w-10 h-10 fill-yellow-500 text-yellow-500 opacity-90" />
            <Star className="w-10 h-10 fill-yellow-500 text-yellow-500 opacity-90" />
            <Star className="w-10 h-10 fill-yellow-500 text-yellow-500 opacity-90" />
            <Star className="w-10 h-10 fill-yellow-500 text-yellow-500 opacity-90" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Top Rated Flight Schools
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            The highest-rated flight training programs across the USA — ranked by real student reviews.
          </p>
        </div>
      </section>

      <TopRatedExplorer schools={schools} />
    </div>
  );
}
