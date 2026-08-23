import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, Pencil } from "lucide-react";
import {
  getAirportByCode,
  getCityBySlug,
  getStateBySlug,
  getSchoolsByAirport,
  getLocationMaps,
} from "@/lib/data";
import { SchoolCard } from "@/components/SchoolCard";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { schoolHref } from "@/lib/utils";
import { breadcrumbJsonLd, schoolListJsonLd } from "@/lib/structured-data";
import { metaDescription, thinPageRobots } from "@/lib/seo";

type Props = { params: Promise<{ airportCode: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { airportCode } = await params;
  const airport = await getAirportByCode(airportCode);
  if (!airport) return { title: "Airport Not Found" };
  const [city, state, schools] = await Promise.all([
    getCityBySlug(airport.citySlug),
    getStateBySlug(airport.stateSlug),
    getSchoolsByAirport(airport.icao),
  ]);
  const fallbackDesc = `Find ${schools.length} flight school${schools.length !== 1 ? "s" : ""} at ${airport.name} (${airport.icao}) in ${city?.name ?? ""}, ${state?.name ?? ""}.`;
  const description = airport.description
    ? metaDescription(airport.description)
    : fallbackDesc;
  const title = `Flight Schools at ${airport.icao} – ${airport.name}`;
  return {
    title,
    description,
    alternates: { canonical: `/airports/${airport.icao.toLowerCase()}` },
    openGraph: { title, description, url: `/airports/${airport.icao.toLowerCase()}`, type: "website" },
    twitter: { title, description },
    robots: thinPageRobots(schools.length),
  };
}

const h2 = "mb-5 font-display text-2xl font-bold tracking-tight text-ink";

export default async function AirportDetailPage({ params }: Props) {
  const { airportCode } = await params;
  const airport = await getAirportByCode(airportCode);
  if (!airport) notFound();

  const [city, state, schools, { cityNameBySlug, stateBySlug }, viewer] =
    await Promise.all([
      getCityBySlug(airport.citySlug),
      getStateBySlug(airport.stateSlug),
      getSchoolsByAirport(airport.icao),
      getLocationMaps(),
      getCurrentUser(),
    ]);
  // Airports have no per-listing owner — only admins may edit (the edit
  // page 404s everyone else, so this just decides whether to show the link).
  const canEdit = isAdmin(viewer);

  const itemListJsonLd = schoolListJsonLd(
    `Flight Schools at ${airport.icao} – ${airport.name}`,
    schools,
  );
  const breadcrumbs = breadcrumbJsonLd([
    ...(state ? [{ name: `${state.name} Flight Schools`, path: `/states/${state.slug}` }] : []),
    ...(city ? [{ name: `${city.name} Flight Schools`, path: `/cities/${city.slug}` }] : []),
    { name: `${airport.icao} Flight Schools`, path: `/airports/${airport.icao.toLowerCase()}` },
  ]);

  const place =
    city?.name && state?.name ? `${city.name}, ${state.name}` : (state?.name ?? "");

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <JsonLd data={itemListJsonLd} />
      <div className="pb-20">
        <PageHero
          back={{
            href: city ? `/cities/${city.slug}` : "/states",
            label: city ? `${city.name} flight schools` : "Back",
          }}
          eyebrow={
            <>
              <span className="text-2xl font-semibold tracking-normal text-sky">{airport.icao}</span>
              {place && (
                <>
                  <span className="text-line">/</span>
                  <span>{place}</span>
                </>
              )}
            </>
          }
          title={airport.name}
          aside={
            canEdit ? (
              <Button
                href={`/airports/${airport.icao.toLowerCase()}/edit`}
                variant="secondary"
                size="sm"
              >
                <Pencil size={14} />
                Edit airport
              </Button>
            ) : undefined
          }
          meta={
            <>
              <Badge tone="sky">ICAO {airport.icao}</Badge>
              {airport.iata && <Badge>IATA {airport.iata}</Badge>}
              {airport.faaLid && <Badge>FAA {airport.faaLid}</Badge>}
              <span>
                {schools.length} flight {schools.length === 1 ? "school" : "schools"} at this
                airport
              </span>
            </>
          }
        />

        <Container size="default" className="space-y-14 py-12">
          {/* Airport description */}
          {airport.description && (
            <section>
              <h2 className="mb-3 font-display text-2xl font-bold tracking-tight text-ink">
                About {airport.name}
              </h2>
              <p className="max-w-prose leading-relaxed text-muted">{airport.description}</p>
            </section>
          )}

          {/* Schools */}
          <section>
            <h2 className={h2}>Flight schools at {airport.icao}</h2>
            {schools.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {schools.map((school) => {
                  const cityName = cityNameBySlug[school.citySlug];
                  const schoolState = stateBySlug[school.stateSlug];
                  return (
                    <SchoolCard
                      schoolId={school.id}
                      key={school.id}
                      name={school.name}
                      location={
                        cityName && schoolState
                          ? `${cityName}, ${schoolState.abbreviation}`
                          : school.citySlug
                      }
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
                title={`No listings yet for ${airport.icao}`}
                hint="Know a flight school at this airport?"
              />
            )}
          </section>

          {/* City context */}
          {city && state && (
            <section className="rounded-2xl border border-line bg-surface p-6 md:p-8">
              <h2 className="mb-2 font-display text-2xl font-bold tracking-tight text-ink">
                More in {city.name}
              </h2>
              <p className="mb-5 max-w-prose text-sm text-muted">
                Browse all flight schools serving the {city.name} area, including schools at
                nearby airports.
              </p>
              <Button href={`/cities/${city.slug}`} variant="secondary">
                All {city.name} flight schools
                <ArrowRight size={15} />
              </Button>
            </section>
          )}
        </Container>
      </div>
    </>
  );
}
