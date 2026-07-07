import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Plane, MapPin, Building2, ChevronLeft } from "lucide-react";
import {
  getCityBySlug,
  getCitiesBySlugs,
  getAirportsByCity,
  getSchoolsByCity,
  getStateBySlug,
} from "@/lib/data";
import { SchoolCard } from "@/components/SchoolCard";
import { EmptyState } from "@/components/EmptyState";

type Props = { params: Promise<{ citySlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) return { title: "City Not Found" };
  const [state, schools, airports] = await Promise.all([
    getStateBySlug(city.stateSlug),
    getSchoolsByCity(citySlug),
    getAirportsByCity(citySlug),
  ]);
  const title = `Flight Schools in ${city.name}, ${city.stateAbbreviation}`;
  const description = `Find flight schools in ${city.name}, ${state?.name ?? city.stateAbbreviation}. Browse ${schools.length} schools across ${airports.length} airports.`;
  return {
    title,
    description,
    alternates: { canonical: `/cities/${citySlug}` },
    openGraph: { title, description, url: `/cities/${citySlug}`, type: "website" },
    twitter: { title, description },
  };
}

export default async function CityDetailPage({ params }: Props) {
  const { citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) notFound();

  // Resolve nearby city objects (metro area, can cross state lines)
  const [state, cityAirports, citySchools, nearbyCities] = await Promise.all([
    getStateBySlug(city.stateSlug),
    getAirportsByCity(citySlug),
    getSchoolsByCity(citySlug),
    getCitiesBySlugs(city.nearbyCitySlugs),
  ]);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Flight Schools in ${city.name}, ${city.stateAbbreviation}`,
    numberOfItems: citySchools.length,
    itemListElement: citySchools.map((school, i) => ({
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
            href={state ? `/states/${state.slug}` : "/states"}
            className="inline-flex items-center gap-1 text-slate-300 hover:text-white text-sm transition mb-4"
          >
            <ChevronLeft size={16} />
            {state ? `${state.name} Flight Schools` : "All States"}
          </Link>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
            Flight Schools in {city.name},{" "}
            <span className="text-blue-300">{city.stateAbbreviation}</span>
          </h1>

          <div className="flex flex-wrap gap-6 text-base opacity-90 mt-4">
            <span className="flex items-center gap-2">
              <Plane size={18} />
              {citySchools.length} {citySchools.length === 1 ? "school" : "schools"}
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={18} />
              {cityAirports.length} {cityAirports.length === 1 ? "airport" : "airports"}
            </span>
            {nearbyCities.length > 0 && (
              <span className="flex items-center gap-2">
                <Building2 size={18} />
                {nearbyCities.length} nearby{" "}
                {nearbyCities.length === 1 ? "city" : "cities"}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">
        {/* Nearby / metro cities */}
        {nearbyCities.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
              Also Serving Nearby Cities
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Schools in {city.name} may also serve pilots in the surrounding metro area.
            </p>
            <div className="flex flex-wrap gap-3">
              {nearbyCities.map((nearby) => (
                <Link
                  key={nearby.id}
                  href={`/cities/${nearby.slug}`}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-400 transition"
                >
                  {nearby.name},{" "}
                  <span className="text-slate-400">{nearby.stateAbbreviation}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Airports */}
        {cityAirports.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-5">
              Airports in {city.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cityAirports.map((airport) => (
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
            Flight Schools in {city.name}
          </h2>

          {citySchools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {citySchools.map((school) => {
                const locationLabel = state
                  ? `${city.name}, ${state.abbreviation}`
                  : city.name;
                return (
                  <SchoolCard
                    key={school.id}
                    name={school.name}
                    location={locationLabel}
                    rating={school.rating}
                    reviewCount={school.reviewCount}
                    href={`/${school.stateSlug}/${school.citySlug}/${school.primaryAirportCode.toLowerCase()}/${school.slug}`}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState
              title={`No listings yet for ${city.name}`}
              hint="Know a flight school here?"
            />
          )}
        </section>
      </div>
    </div>
    </>
  );
}
