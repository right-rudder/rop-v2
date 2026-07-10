import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, MapPin, Phone, Globe, Star, Plane, Users, Mail } from "lucide-react";
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
  const { schoolSlug, stateSlug, citySlug, airportCode } = await params;
  const school = await getSchoolBySlug(schoolSlug);
  if (!school) return { title: "School Not Found" };
  const [city, state] = await Promise.all([
    getCityBySlug(school.citySlug),
    getStateBySlug(school.stateSlug),
  ]);
  const title = `${school.name} – Flight School in ${city?.name ?? ""}, ${state?.abbreviation ?? ""}`;
  const description = school.description.slice(0, 160);
  const canonical = `/${stateSlug}/${citySlug}/${airportCode}/${schoolSlug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
    twitter: { title, description },
  };
}

export default async function SchoolDetailPage({ params }: Props) {
  const { schoolSlug } = await params;
  const school = await getSchoolBySlug(schoolSlug);
  if (!school) notFound();

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
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      {
        "@type": "ListItem",
        position: 2,
        name: `${state?.name ?? school.stateSlug} Flight Schools`,
        item: `/states/${school.stateSlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${city?.name ?? school.citySlug} Flight Schools`,
        item: `/cities/${school.citySlug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: `${primaryAirport?.icao ?? school.primaryAirportCode} Flight Schools`,
        item: `/airports/${school.primaryAirportCode.toLowerCase()}`,
      },
      { "@type": "ListItem", position: 5, name: school.name },
    ],
  };

  // JSON-LD LocalBusiness structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: school.name,
    description: school.description,
    telephone: school.phone,
    url: school.website,
    address: {
      "@type": "PostalAddress",
      addressLocality: city?.name ?? school.citySlug,
      addressRegion: state?.abbreviation ?? school.stateSlug,
      addressCountry: "US",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: school.rating.toFixed(1),
      reviewCount: school.reviewCount,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="pb-20">
        {/* Hero */}
        <section className="bg-linear-to-br from-slate-950 via-blue-950 to-indigo-900 text-white py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <Link
              href={city ? `/cities/${city.slug}` : "/states"}
              className="inline-flex items-center gap-1 text-slate-300 hover:text-white text-sm transition mb-4"
            >
              <ChevronLeft size={16} />
              {city
                ? `Flight Schools in ${city.name}`
                : "Back"}
            </Link>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
              {school.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm opacity-90">
              <span className="flex items-center gap-1.5">
                <MapPin size={16} />
                {city?.name ?? school.citySlug},{" "}
                {state?.abbreviation ?? school.stateSlug}
              </span>
              {primaryAirport && (
                <Link
                  href={`/airports/${primaryAirport.icao.toLowerCase()}`}
                  className="flex items-center gap-1.5 font-mono font-semibold text-blue-300 hover:text-white transition"
                >
                  <Plane size={16} />
                  {primaryAirport.icao}
                </Link>
              )}
              {school.faaPart && (
                <span className="bg-white/10 border border-white/20 rounded-full px-2.5 py-0.5 text-xs font-medium">
                  FAR Part {school.faaPart === "both" ? "61 / 141" : school.faaPart}
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-5">
              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={20}
                    fill={i <= Math.round(school.rating) ? "currentColor" : "none"}
                    strokeWidth={i <= Math.round(school.rating) ? 0 : 1.5}
                  />
                ))}
              </div>
              <span className="font-bold text-lg">{school.rating.toFixed(1)}</span>
              <span className="text-slate-300 text-sm">
                ({school.reviewCount} reviews)
              </span>
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
          {/* Programs */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              Programs Offered
            </h2>
            <div className="flex flex-wrap gap-2">
              {schoolPrograms.map((program) => (
                <Link
                  key={program.slug}
                  href={`/programs/${program.slug}`}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-full text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-400 transition"
                >
                  {program.shortName}
                </Link>
              ))}
            </div>
          </section>

          {/* About */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">
              About {school.name}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {school.description}
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              Contact &amp; Location
            </h2>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4">
              {/* Primary airport */}
              {primaryAirport && (
                <div className="flex items-start gap-3">
                  <Plane size={18} className="text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Primary Airport
                    </p>
                    <Link
                      href={`/airports/${primaryAirport.icao.toLowerCase()}`}
                      className="font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                    >
                      {primaryAirport.icao} – {primaryAirport.name}
                    </Link>
                  </div>
                </div>
              )}

              {/* Address */}
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    City
                  </p>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {city?.name ?? school.citySlug},{" "}
                    {state?.name ?? school.stateSlug}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Phone
                  </p>
                  <a
                    href={`tel:${school.phone.replace(/\D/g, "")}`}
                    className="font-semibold text-slate-800 dark:text-slate-100 hover:text-blue-700 dark:hover:text-blue-400 transition"
                  >
                    {school.phone}
                  </a>
                </div>
              </div>

              {/* Website */}
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Website
                  </p>
                  <a
                    href={school.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                  >
                    {school.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Fleet & Staff */}
          {(schoolAircraft.length > 0 || school.estimatedPlanes || school.estimatedInstructors) && (
            <section>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                Fleet &amp; Staff
              </h2>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                {/* Stats row */}
                {(school.estimatedPlanes || school.estimatedInstructors) && (
                  <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800">
                    {school.estimatedPlanes && (
                      <div className="p-5 flex items-center gap-3">
                        <Plane size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
                        <div>
                          <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                            {school.estimatedPlanes}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Estimated aircraft</p>
                        </div>
                      </div>
                    )}
                    {school.estimatedInstructors && (
                      <div className="p-5 flex items-center gap-3">
                        <Users size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
                        <div>
                          <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                            {school.estimatedInstructors}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Estimated instructors</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Aircraft list */}
                {schoolAircraft.length > 0 && (
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                      Aircraft
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {schoolAircraft.map((a) => (
                        <Link
                          key={a.slug}
                          href={`/aircraft/${a.slug}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 transition"
                        >
                          <Plane size={13} className="text-slate-400" />
                          {a.displayName}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Key Contacts */}
          {school.contacts && school.contacts.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                Key Contacts
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {school.contacts.map((contact) => (
                  <div
                    key={contact.email}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-2"
                  >
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{contact.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{contact.title}</p>
                    <div className="pt-1 space-y-1.5">
                      <a
                        href={`tel:${contact.phone.replace(/\D/g, "")}`}
                        className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 transition"
                      >
                        <Phone size={14} className="text-slate-400 shrink-0" />
                        {contact.phone}
                      </a>
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 transition"
                      >
                        <Mail size={14} className="text-slate-400 shrink-0" />
                        {contact.email}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Student Reviews */}
          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              Student Reviews
            </h2>
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
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              Write a Review
            </h2>
            {ownReview ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-sm text-slate-600 dark:text-slate-300">
                You&apos;ve already reviewed this school. Delete your review to
                write a new one.
              </div>
            ) : (
              <ReviewForm schoolId={school.id} />
            )}
          </section>

          {/* Other locations — sibling listings for the same brand */}
          {relatedSchools.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                Other Locations
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedSchools.map((sibling) => (
                  <Link
                    key={sibling.id}
                    href={`/${sibling.stateSlug}/${sibling.citySlug}/${sibling.primaryAirportCode.toLowerCase()}/${sibling.slug}`}
                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition"
                  >
                    <p className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition mb-1">
                      {sibling.name}
                    </p>
                    {sibling.airport && (
                      <p className="font-mono text-sm text-blue-700 dark:text-blue-400">
                        {sibling.primaryAirportCode} – {sibling.airport.name}
                      </p>
                    )}
                    {sibling.city && sibling.state && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin size={12} />
                        {sibling.city.name}, {sibling.state.abbreviation}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
