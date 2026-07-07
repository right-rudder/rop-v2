import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Plane, ChevronLeft } from "lucide-react";
import {
  airports,
  getAirportByCode,
  getCityBySlug,
  getStateBySlug,
  getSchoolsByAirport,
} from "@/lib/mock-data";
import { SchoolCard } from "@/components/SchoolCard";

type Props = { params: Promise<{ airportCode: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { airportCode } = await params;
  const airport = getAirportByCode(airportCode);
  if (!airport) return { title: "Airport Not Found" };
  const city = getCityBySlug(airport.citySlug);
  const state = getStateBySlug(airport.stateSlug);
  const schools = getSchoolsByAirport(airport.icao);
  const fallbackDesc = `Find ${schools.length} flight school${schools.length !== 1 ? "s" : ""} at ${airport.name} (${airport.icao}) in ${city?.name ?? ""}, ${state?.name ?? ""}.`;
  const description = airport.description
    ? airport.description.slice(0, 160)
    : fallbackDesc;
  const title = `Flight Schools at ${airport.icao} – ${airport.name}`;
  return {
    title,
    description,
    alternates: { canonical: `/airports/${airport.icao.toLowerCase()}` },
    openGraph: { title, description, url: `/airports/${airport.icao.toLowerCase()}`, type: "website" },
    twitter: { title, description },
  };
}

export function generateStaticParams() {
  return airports.map((a) => ({ airportCode: a.icao.toLowerCase() }));
}

export default async function AirportDetailPage({ params }: Props) {
  const { airportCode } = await params;
  const airport = getAirportByCode(airportCode);
  if (!airport) notFound();

  const city = getCityBySlug(airport.citySlug);
  const state = getStateBySlug(airport.stateSlug);
  const schools = getSchoolsByAirport(airport.icao);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Flight Schools at ${airport.icao} – ${airport.name}`,
    numberOfItems: schools.length,
    itemListElement: schools.map((school, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: school.name,
      url: `/${school.stateSlug}/${school.citySlug}/${school.primaryAirportCode.toLowerCase()}/${school.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
    <div className="pb-20">
      {/* Hero */}
      <section className="bg-linear-to-br from-slate-950 via-blue-950 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <Link
            href={city ? `/cities/${city.slug}` : "/states"}
            className="inline-flex items-center gap-1 text-slate-300 hover:text-white text-sm transition mb-4"
          >
            <ChevronLeft size={16} />
            {city ? `${city.name} Flight Schools` : "Back"}
          </Link>

          <div className="flex items-baseline gap-4 mb-2">
            <span className="font-mono text-5xl font-black text-blue-300 opacity-70 select-none">
              {airport.icao}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {airport.name}
            </h1>
          </div>

          {/* Identifiers */}
          <div className="flex flex-wrap gap-2 mt-3 mb-4">
            <span className="bg-blue-800/60 text-blue-200 text-xs font-mono font-semibold px-2.5 py-1 rounded-full">
              ICAO: {airport.icao}
            </span>
            {airport.iata && (
              <span className="bg-slate-700/60 text-slate-200 text-xs font-mono font-semibold px-2.5 py-1 rounded-full">
                IATA: {airport.iata}
              </span>
            )}
            {airport.faaLid && (
              <span className="bg-slate-700/60 text-slate-200 text-xs font-mono font-semibold px-2.5 py-1 rounded-full">
                FAA: {airport.faaLid}
              </span>
            )}
          </div>

          <p className="text-slate-300 text-sm">
            {city?.name && state?.name
              ? `${city.name}, ${state.name}`
              : state?.name ?? ""}
          </p>

          <div className="flex items-center gap-2 mt-4 text-base opacity-90">
            <Plane size={18} />
            <span>
              {schools.length} flight {schools.length === 1 ? "school" : "schools"} at this airport
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">
        {/* Airport description */}
        {airport.description && (
          <section>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
              About {airport.name}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {airport.description}
            </p>
          </section>
        )}

        {/* Schools */}
        <section>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-5">
            Flight Schools at {airport.icao}
          </h2>

          {schools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {schools.map((school) => {
                const schoolCity = getCityBySlug(school.citySlug);
                const schoolState = getStateBySlug(school.stateSlug);
                return (
                  <SchoolCard
                    key={school.id}
                    name={school.name}
                    location={
                      schoolCity && schoolState
                        ? `${schoolCity.name}, ${schoolState.abbreviation}`
                        : school.citySlug
                    }
                    rating={school.rating}
                    reviewCount={school.reviewCount}
                    href={`/${school.stateSlug}/${school.citySlug}/${school.primaryAirportCode.toLowerCase()}/${school.slug}`}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-10 text-center text-slate-500 dark:text-slate-400">
              <p className="text-lg font-medium mb-1">
                No listings yet for {airport.icao}
              </p>
              <p className="text-sm">
                Know a flight school at this airport?{" "}
                <Link href="#" className="text-blue-600 hover:underline">
                  Submit a listing
                </Link>
              </p>
            </div>
          )}
        </section>

        {/* City context */}
        {city && state && (
          <section>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
              More in {city.name}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              Browse all flight schools serving the {city.name} area, including
              schools at nearby airports.
            </p>
            <Link
              href={`/cities/${city.slug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-600 text-white font-medium rounded-lg transition text-sm"
            >
              <Plane size={16} />
              View all {city.name} flight schools
            </Link>
          </section>
        )}
      </div>
    </div>
    </>
  );
}
