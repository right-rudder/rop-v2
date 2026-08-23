import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getStateBySlug,
  getCitiesByState,
  getAirportsByState,
  getSchoolsByState,
} from "@/lib/data";
import { SchoolCard } from "@/components/SchoolCard";
import { AirportCard } from "@/components/AirportCard";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { EmptyState } from "@/components/EmptyState";
import { Chip } from "@/components/ui/Chip";
import { Container } from "@/components/ui/Container";
import { schoolHref } from "@/lib/utils";
import { absoluteUrl } from "@/lib/site";
import { countNoun, thinPageRobots } from "@/lib/seo";

type Props = { params: Promise<{ stateSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateSlug } = await params;
  const state = await getStateBySlug(stateSlug);
  if (!state) return { title: "State Not Found" };
  const title = `Flight Schools in ${state.name}`;
  const description = `Find flight schools in ${state.name}. Browse ${countNoun(state.schoolCount, "school")} across ${countNoun(state.airportCount, "airport")}.`;
  return {
    title,
    description,
    alternates: { canonical: `/states/${stateSlug}` },
    openGraph: { title, description, url: `/states/${stateSlug}`, type: "website" },
    twitter: { title, description },
    robots: thinPageRobots(state.schoolCount),
  };
}

const h2 = "mb-5 font-display text-2xl font-bold tracking-tight text-ink";

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
      url: absoluteUrl(schoolHref(school)),
    })),
  };

  const meta = [
    `${state.schoolCount} schools`,
    `${state.airportCount} airports`,
    stateCities.length > 0 ? `${stateCities.length} cities` : null,
  ].filter(Boolean) as string[];

  return (
    <>
      <JsonLd data={itemListJsonLd} />
      <div className="pb-20">
        <PageHero
          back={{ href: "/states", label: "All states" }}
          eyebrow={
            <>
              <span className="font-semibold text-ink">{state.abbreviation}</span>
              {meta.map((m) => (
                <span key={m} className="inline-flex items-center gap-2">
                  <span className="text-line">/</span>
                  {m}
                </span>
              ))}
            </>
          }
          title={`Flight schools in ${state.name}`}
        />

        <Container size="default" className="space-y-14 py-12">
          {/* Cities */}
          {stateCities.length > 0 && (
            <section>
              <h2 className={h2}>Cities with flight schools</h2>
              <div className="flex flex-wrap gap-2">
                {stateCities.map((city) => (
                  <Chip key={city.id} href={`/cities/${city.slug}`}>
                    {city.name}
                  </Chip>
                ))}
              </div>
            </section>
          )}

          {/* Airports */}
          {stateAirports.length > 0 && (
            <section>
              <h2 className={h2}>Airports</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stateAirports.map((airport) => (
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
            <h2 className={h2}>Flight schools in {state.name}</h2>
            {stateSchools.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {stateSchools.map((school) => {
                  const cityName = cityNameBySlug[school.citySlug] ?? school.citySlug;
                  return (
                    <SchoolCard
                      schoolId={school.id}
                      key={school.id}
                      name={school.name}
                      location={`${cityName}, ${state.abbreviation}`}
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
                title={`No listings yet for ${state.name}`}
                hint="Know a flight school here?"
              />
            )}
          </section>
        </Container>
      </div>
    </>
  );
}
