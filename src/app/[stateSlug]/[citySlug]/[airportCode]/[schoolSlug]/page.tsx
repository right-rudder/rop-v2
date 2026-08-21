import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Mail, MapPin, Phone, Plane, Users } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Notice } from "@/components/ui/Notice";
import { Stars } from "@/components/ui/Stars";
import {
  getSchoolBySlug,
  getCityBySlug,
  getStateBySlug,
  getAirportByCode,
  getRelatedSchools,
  getReviewsBySchool,
  getCommentsForReviews,
  getProgramsBySlugs,
  getAircraftBySlugs,
  getPrograms,
  getUsersByIds,
  getLocationMaps,
  getAirports,
} from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { schoolHref } from "@/lib/utils";
import { absoluteUrl } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import ReviewsSection from "@/components/ReviewsSection";
import ReviewForm from "@/components/ReviewForm";

type Props = {
  params: Promise<{
    stateSlug: string;
    citySlug: string;
    airportCode: string;
    schoolSlug: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { schoolSlug } = await params;
  const school = await getSchoolBySlug(schoolSlug);
  if (!school) return { title: "School Not Found" };
  const [city, state] = await Promise.all([
    getCityBySlug(school.citySlug),
    getStateBySlug(school.stateSlug),
  ]);
  const title = `${school.name} – Flight School in ${city?.name ?? ""}, ${state?.abbreviation ?? ""}`;
  const description = school.description.slice(0, 160);
  const canonical = schoolHref(school);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
    twitter: { title, description },
  };
}

export default async function SchoolDetailPage({ params }: Props) {
  const { stateSlug, citySlug, airportCode, schoolSlug } = await params;
  const school = await getSchoolBySlug(schoolSlug);
  if (!school) notFound();

  // Only the slug identifies the school; the other segments exist for SEO.
  // Send mis-typed or stale URLs to the single canonical address instead of
  // serving the same page (and a wrong canonical tag) under any path.
  const canonicalPath = schoolHref(school);
  if (`/${stateSlug}/${citySlug}/${airportCode}/${schoolSlug}` !== canonicalPath) {
    permanentRedirect(canonicalPath);
  }

  const [
    city,
    state,
    primaryAirport,
    schoolReviews,
    schoolPrograms,
    schoolAircraft,
    rawRelated,
    allPrograms,
    viewer,
  ] = await Promise.all([
    getCityBySlug(school.citySlug),
    getStateBySlug(school.stateSlug),
    getAirportByCode(school.primaryAirportCode),
    getReviewsBySchool(school.id),
    getProgramsBySlugs(school.programSlugs),
    getAircraftBySlugs(school.aircraftSlugs ?? []),
    getRelatedSchools(school),
    getPrograms(),
    getCurrentUser(),
  ]);

  const ownReview = viewer
    ? schoolReviews.find((r) => r.userId === viewer.id)
    : undefined;

  const commentsByReview = await getCommentsForReviews(
    schoolReviews.map((r) => r.id),
  );

  // Profiles for review + comment authors, and program labels for their certificates
  const authorIds = [
    ...schoolReviews.map((r) => r.userId),
    ...Object.values(commentsByReview).flatMap((cs) => cs.map((c) => c.userId)),
  ];
  const usersById = await getUsersByIds(authorIds);
  const programShortNames = Object.fromEntries(
    allPrograms.map((p) => [p.slug, p.shortName]),
  );

  // Resolve sibling listings for the same brand
  let relatedSchools: ((typeof rawRelated)[number] & {
    airport?: { name: string };
    city?: { name: string };
    state?: { abbreviation: string };
  })[] = [];
  if (rawRelated.length > 0) {
    const [{ cityNameBySlug, stateBySlug }, airports] = await Promise.all([
      getLocationMaps(),
      getAirports(),
    ]);
    const airportByIcao = Object.fromEntries(airports.map((a) => [a.icao, a]));
    relatedSchools = rawRelated.map((s) => ({
      ...s,
      airport: airportByIcao[s.primaryAirportCode],
      city: cityNameBySlug[s.citySlug]
        ? { name: cityNameBySlug[s.citySlug] }
        : undefined,
      state: stateBySlug[s.stateSlug],
    }));
  }

  // JSON-LD BreadcrumbList structured data
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: `${state?.name ?? school.stateSlug} Flight Schools`,
        item: absoluteUrl(`/states/${school.stateSlug}`),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${city?.name ?? school.citySlug} Flight Schools`,
        item: absoluteUrl(`/cities/${school.citySlug}`),
      },
      {
        "@type": "ListItem",
        position: 4,
        name: `${primaryAirport?.icao ?? school.primaryAirportCode} Flight Schools`,
        item: absoluteUrl(`/airports/${school.primaryAirportCode.toLowerCase()}`),
      },
      { "@type": "ListItem", position: 5, name: school.name, item: absoluteUrl(canonicalPath) },
    ],
  };

  // JSON-LD LocalBusiness structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: school.name,
    description: school.description,
    telephone: school.phone || undefined,
    url: school.website || undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: city?.name ?? school.citySlug,
      addressRegion: state?.abbreviation ?? school.stateSlug,
      addressCountry: "US",
    },
    // Google rejects AggregateRating with zero reviews — omit it until there are some
    ...(school.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: school.rating.toFixed(1),
            reviewCount: school.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  const locationLabel = `${city?.name ?? school.citySlug}, ${state?.abbreviation ?? school.stateSlug}`;
  const faaLabel = school.faaPart
    ? `FAR Part ${school.faaPart === "both" ? "61 / 141" : school.faaPart}`
    : null;
  const hasFleet =
    schoolAircraft.length > 0 || school.estimatedPlanes || school.estimatedInstructors;

  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <PageHero
        back={{
          href: city ? `/cities/${city.slug}` : "/states",
          label: city ? `Flight schools in ${city.name}` : "Back",
        }}
        eyebrow={
          <>
            {primaryAirport && (
              <Link
                href={`/airports/${primaryAirport.icao.toLowerCase()}`}
                className="font-semibold text-sky hover:underline"
              >
                {primaryAirport.icao}
              </Link>
            )}
            {primaryAirport && <span className="text-line">/</span>}
            <span>{locationLabel}</span>
            {faaLabel && <Badge tone="accent">{faaLabel}</Badge>}
          </>
        }
        title={school.name}
        meta={
          school.reviewCount > 0 ? (
            <Stars value={school.rating} count={school.reviewCount} size={18} />
          ) : (
            <span>No reviews yet — be the first to share your experience.</span>
          )
        }
        aside={
          (school.website || school.phone) && (
            <div className="flex flex-wrap gap-3">
              {school.website && (
                <Button href={school.website} target="_blank" rel="noopener noreferrer">
                  Visit website
                  <ExternalLink size={15} />
                </Button>
              )}
              {school.phone && (
                <Button href={`tel:${school.phone.replace(/\D/g, "")}`} variant="secondary">
                  <Phone size={15} />
                  {school.phone}
                </Button>
              )}
            </div>
          )
        }
      />

      <Container className="py-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          {/* Main column */}
          <div className="min-w-0 space-y-14">
            {/* About */}
            <section>
              <SectionTitle>About {school.name}</SectionTitle>
              <p className="max-w-prose text-[1.05rem] leading-relaxed text-muted">
                {school.description}
              </p>
            </section>

            {/* Programs */}
            {schoolPrograms.length > 0 && (
              <section>
                <SectionTitle>Programs offered</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {schoolPrograms.map((program) => (
                    <Chip key={program.slug} href={`/programs/${program.slug}`}>
                      {program.shortName}
                    </Chip>
                  ))}
                </div>
              </section>
            )}

            {/* Fleet & Staff */}
            {hasFleet && (
              <section>
                <SectionTitle>Fleet &amp; staff</SectionTitle>
                <Card className="divide-y divide-line">
                  {(school.estimatedPlanes || school.estimatedInstructors) && (
                    <div className="grid grid-cols-2 divide-x divide-line">
                      {school.estimatedPlanes && (
                        <Stat icon={<Plane size={16} />} value={school.estimatedPlanes} label="Aircraft (est.)" />
                      )}
                      {school.estimatedInstructors && (
                        <Stat icon={<Users size={16} />} value={school.estimatedInstructors} label="Instructors (est.)" />
                      )}
                    </div>
                  )}
                  {schoolAircraft.length > 0 && (
                    <div className="p-5">
                      <Eyebrow className="mb-3">Aircraft</Eyebrow>
                      <div className="flex flex-wrap gap-2">
                        {schoolAircraft.map((a) => (
                          <Chip key={a.slug} href={`/aircraft/${a.slug}`}>
                            <Plane size={13} className="text-muted" />
                            {a.displayName}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </section>
            )}

            {/* Key Contacts */}
            {school.contacts && school.contacts.length > 0 && (
              <section>
                <SectionTitle>Key contacts</SectionTitle>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {school.contacts.map((contact, i) => (
                    <Card key={`${i}-${contact.email}`} className="p-5">
                      <p className="font-semibold text-ink">{contact.name}</p>
                      <p className="text-sm text-muted">{contact.title}</p>
                      <div className="mt-3 space-y-1.5">
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone.replace(/\D/g, "")}`}
                            className="flex items-center gap-2 text-sm text-ink transition-colors hover:text-accent-ink"
                          >
                            <Phone size={14} className="shrink-0 text-muted" />
                            {contact.phone}
                          </a>
                        )}
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="flex items-center gap-2 text-sm text-ink transition-colors hover:text-accent-ink"
                          >
                            <Mail size={14} className="shrink-0 text-muted" />
                            {contact.email}
                          </a>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Student Reviews */}
            <section id="reviews">
              <SectionTitle>Student reviews</SectionTitle>
              <ReviewsSection
                reviews={schoolReviews}
                commentsByReview={commentsByReview}
                usersById={usersById}
                programShortNames={programShortNames}
                currentUserId={viewer?.id ?? null}
              />
            </section>

            {/* Write a Review */}
            <section>
              <SectionTitle>Write a review</SectionTitle>
              {ownReview ? (
                <Notice tone="info">
                  You&apos;ve already reviewed this school. Delete your review to write a new one.
                </Notice>
              ) : (
                <ReviewForm schoolId={school.id} />
              )}
            </section>

            {/* Other locations — sibling listings for the same brand */}
            {relatedSchools.length > 0 && (
              <section>
                <SectionTitle>Other locations</SectionTitle>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {relatedSchools.map((sibling) => (
                    <Card key={sibling.id} href={schoolHref(sibling)} className="p-5">
                      <p className="mb-1 font-mono text-xs uppercase tracking-[0.12em] text-muted">
                        <span className="font-semibold text-sky">{sibling.primaryAirportCode}</span>
                        {sibling.airport && ` · ${sibling.airport.name}`}
                      </p>
                      <p className="font-display text-lg font-bold tracking-tight text-ink transition-colors group-hover:text-accent-ink">
                        {sibling.name}
                      </p>
                      {sibling.city && sibling.state && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                          <MapPin size={12} />
                          {sibling.city.name}, {sibling.state.abbreviation}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sticky contact aside */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="p-6">
              <Eyebrow accent className="mb-5">
                Contact &amp; location
              </Eyebrow>
              <dl className="space-y-5">
                {primaryAirport && (
                  <div>
                    <dt className="text-xs text-muted">Primary airport</dt>
                    <dd className="mt-0.5">
                      <Link
                        href={`/airports/${primaryAirport.icao.toLowerCase()}`}
                        className="font-semibold text-ink transition-colors hover:text-accent-ink"
                      >
                        <span className="font-mono text-sky">{primaryAirport.icao}</span>{" "}
                        <span className="text-muted">–</span> {primaryAirport.name}
                      </Link>
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-muted">City</dt>
                  <dd className="mt-0.5 font-semibold text-ink">
                    {city?.name ?? school.citySlug}, {state?.name ?? school.stateSlug}
                  </dd>
                </div>
                {school.phone && (
                  <div>
                    <dt className="text-xs text-muted">Phone</dt>
                    <dd className="mt-0.5">
                      <a
                        href={`tel:${school.phone.replace(/\D/g, "")}`}
                        className="font-semibold text-ink transition-colors hover:text-accent-ink"
                      >
                        {school.phone}
                      </a>
                    </dd>
                  </div>
                )}
                {school.website && (
                  <div>
                    <dt className="text-xs text-muted">Website</dt>
                    <dd className="mt-0.5">
                      <a
                        href={school.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all font-semibold text-accent-ink hover:underline"
                      >
                        {school.website.replace(/^https?:\/\//, "")}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
              {school.website && (
                <Button
                  href={school.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  full
                  className="mt-7"
                >
                  Visit website
                  <ExternalLink size={15} />
                </Button>
              )}
            </Card>
          </aside>
        </div>
      </Container>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 font-display text-2xl font-bold tracking-tight text-ink">{children}</h2>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 p-5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
        {icon}
      </span>
      <div>
        <p className="font-mono text-xl font-semibold text-ink">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}
