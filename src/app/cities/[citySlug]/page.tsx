import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCityBySlug,
  getCitiesBySlugs,
  getAirportsByCity,
  getSchoolsByCity,
  getStateBySlug,
} from "@/lib/data";
import { SchoolCard } from "@/components/SchoolCard";
import { AirportCard } from "@/components/AirportCard";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { EmptyState } from "@/components/EmptyState";
import { Chip } from "@/components/ui/Chip";
import { Container } from "@/components/ui/Container";
import { schoolHref } from "@/lib/utils";
import { breadcrumbJsonLd, schoolListJsonLd } from "@/lib/structured-data";

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

const h2 = "mb-5 font-display text-2xl font-bold tracking-tight text-ink";

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

  const itemListJsonLd = schoolListJsonLd(
    `Flight Schools in ${city.name}, ${city.stateAbbreviation}`,
    citySchools,
  );
  const breadcrumbs = breadcrumbJsonLd([
    ...(state ? [{ name: `${state.name} Flight Schools`, path: `/states/${state.slug}` }] : []),
    { name: `${city.name} Flight Schools`, path: `/cities/${city.slug}` },
  ]);

  const meta = [
    `${citySchools.length} ${citySchools.length === 1 ? "school" : "schools"}`,
    `${cityAirports.length} ${cityAirports.length === 1 ? "airport" : "airports"}`,
    nearbyCities.length > 0
      ? `${nearbyCities.length} nearby ${nearbyCities.length === 1 ? "city" : "cities"}`
      : null,
  ].filter(Boolean) as string[];

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <JsonLd data={itemListJsonLd} />
      <div className="pb-20">
        <PageHero
          back={{
            href: state ? `/states/${state.slug}` : "/states",
            label: state ? `${state.name} flight schools` : "All states",
          }}
          eyebrow={
            <>
              <span className="font-semibold text-ink">{city.stateAbbreviation}</span>
              {meta.map((m) => (
                <span key={m} className="inline-flex items-center gap-2">
                  <span className="text-line">/</span>
                  {m}
                </span>
              ))}
            </>
          }
          title={
            <>
              Flight schools in {city.name},{" "}
              <span className="text-muted">{city.stateAbbreviation}</span>
            </>
          }
        />

        <Container size="default" className="space-y-14 py-12">
          {/* Nearby / metro cities */}
          {nearbyCities.length > 0 && (
            <section>
              <h2 className="mb-1 font-display text-2xl font-bold tracking-tight text-ink">
                Also serving nearby cities
              </h2>
              <p className="mb-5 text-sm text-muted">
                Schools in {city.name} may also serve pilots in the surrounding metro area.
              </p>
              <div className="flex flex-wrap gap-2">
                {nearbyCities.map((nearby) => (
                  <Chip key={nearby.id} href={`/cities/${nearby.slug}`}>
                    {nearby.name}
                    <span className="font-mono text-xs text-muted">{nearby.stateAbbreviation}</span>
                  </Chip>
                ))}
              </div>
            </section>
          )}

          {/* Airports */}
          {cityAirports.length > 0 && (
            <section>
              <h2 className={h2}>Airports in {city.name}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cityAirports.map((airport) => (
                  <AirportCard
                    key={airport.id}
                    icao={airport.icao}
                    iata={airport.iata}
                    faaLid={airport.faaLid}
                    name={airport.name}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Schools */}
          <section>
            <h2 className={h2}>Flight schools in {city.name}</h2>
            {citySchools.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {citySchools.map((school) => {
                  const locationLabel = state
                    ? `${city.name}, ${state.abbreviation}`
                    : city.name;
                  return (
                    <SchoolCard
                      schoolId={school.id}
                      key={school.id}
                      name={school.name}
                      location={locationLabel}
                      airportCode={school.primaryAirportCode}
                      logoPath={school.logoPath}
                      rating={school.rating}
                      reviewCount={school.reviewCount}
                      href={schoolHref(school)}
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
        </Container>
      </div>
    </>
  );
}
