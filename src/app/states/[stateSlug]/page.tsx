import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Plane, MapPin, Building2, ChevronLeft } from "lucide-react";
import {
  getStateBySlug,
  getCitiesByState,
  getAirportsByState,
  getSchoolsByState,
} from "@/lib/data";
import { SchoolCard } from "@/components/SchoolCard";
import { EmptyState } from "@/components/EmptyState";

type Props = { params: Promise<{ stateSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateSlug } = await params;
  const state = await getStateBySlug(stateSlug);
  if (!state) return { title: "State Not Found" };
  const title = `Flight Schools in ${state.name}`;
  const description = `Find flight schools in ${state.name}. Browse ${state.schoolCount} schools across ${state.airportCount} airports.`;
  return {
    title,
    description,
    alternates: { canonical: `/states/${stateSlug}` },
    openGraph: { title, description, url: `/states/${stateSlug}`, type: "website" },
    twitter: { title, description },
  };
}

export default async function StateDetailPage({ params }: Props) {
  const { stateSlug } = await params;
  const state = await getStateBySlug(stateSlug);
  if (!state) notFound();

  const [stateCities, stateAirports, stateSchools] = await Promise.all([
    getCitiesByState(stateSlug),
    getAirportsByState(stateSlug),
    getSchoolsByState(stateSlug),
  ]);
  const cityNameBySlug = Object.fromEntries(
    stateCities.map((c) => [c.slug, c.name]),
  );

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Flight Schools in ${state.name}`,
    numberOfItems: stateSchools.length,
    itemListElement: stateSchools.map((school, i) => ({
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
            href="/states"
            className="inline-flex items-center gap-1 text-slate-300 hover:text-white text-sm transition mb-4"
          >
            <ChevronLeft size={16} />
            All States
          </Link>

          <div className="flex items-baseline gap-4 mb-2">
            <span className="text-6xl font-black text-blue-300 opacity-60 select-none">
              {state.abbreviation}
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Flight Schools in {state.name}
            </h1>
          </div>

          <div className="flex flex-wrap gap-6 text-base opacity-90 mt-4">
            <span className="flex items-center gap-2">
              <Plane size={18} />
              {state.schoolCount} schools
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={18} />
              {state.airportCount} airports
            </span>
            {stateCities.length > 0 && (
              <span className="flex items-center gap-2">
                <Building2 size={18} />
                {stateCities.length} cities
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">
        {/* Cities */}
        {stateCities.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-5">
              Cities with Flight Schools
            </h2>
            <div className="flex flex-wrap gap-3">
              {stateCities.map((city) => (
                <Link
                  key={city.id}
                  href={`/cities/${city.slug}`}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-400 transition"
                >
                  {city.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Airports */}
        {stateAirports.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-5">
              Airports
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stateAirports.map((airport) => (
                <Link
                  key={airport.id}
                  href={`/airports/${airport.icao.toLowerCase()}`}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-mono font-bold text-blue-700 dark:text-blue-400 group-hover:text-blue-600 text-lg">
                      {airport.icao}
                    </span>
                    <div className="flex gap-1 text-xs text-slate-400">
                      {airport.iata && (
                        <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                          {airport.iata}
                        </span>
                      )}
                      {airport.faaLid && airport.faaLid !== airport.iata && (
                        <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                          {airport.faaLid}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {airport.name}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Schools */}
        <section>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-5">
            Flight Schools in {state.name}
          </h2>

          {stateSchools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stateSchools.map((school) => {
                const cityName = cityNameBySlug[school.citySlug] ?? school.citySlug;
                return (
                  <SchoolCard
                    key={school.id}
                    name={school.name}
                    location={`${cityName}, ${state.abbreviation}`}
                    rating={school.rating}
                    reviewCount={school.reviewCount}
                    href={`/${school.stateSlug}/${school.citySlug}/${school.primaryAirportCode.toLowerCase()}/${school.slug}`}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState
              title={`No listings yet for ${state.name}`}
              hint="Know a flight school here?"
            />
          )}
        </section>
      </div>
    </div>
    </>
  );
}
