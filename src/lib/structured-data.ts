/**
 * schema.org builders. Every page renders these through <JsonLd>, which
 * escapes the output — never inline a raw `<script type="application/ld+json">`.
 *
 * Relative imports with extensions on purpose: the node:test suite loads
 * this file straight into Node, which resolves neither `@/` nor
 * extensionless paths (tsconfig sets allowImportingTsExtensions for this).
 */
import type { FlightSchool, LatLng, Program } from "./types.ts";
import { absoluteUrl, SITE_NAME } from "./site.ts";
import { schoolHref } from "./utils.ts";
import { BUCKETS, publicImageUrl } from "./supabase/storage-url.ts";

const SCHEMA = "https://schema.org";

/** Stable node ids so pages can reference the site and its publisher. */
export const ORGANIZATION_ID = absoluteUrl("/#organization");
export const WEBSITE_ID = absoluteUrl("/#website");

export function organizationJsonLd() {
  return {
    "@context": SCHEMA,
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/apple-icon"),
  };
}

/** WebSite with the sitelinks search box action — /search honors `q`. */
export function websiteJsonLd() {
  return {
    "@context": SCHEMA,
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    url: absoluteUrl("/"),
    publisher: { "@id": ORGANIZATION_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/search?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export type Crumb = { name: string; path: string };

/** BreadcrumbList; "Home" is always the first item, so pass the trail below it. */
export function breadcrumbJsonLd(trail: Crumb[]) {
  const crumbs: Crumb[] = [{ name: "Home", path: "/" }, ...trail];
  return {
    "@context": SCHEMA,
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export type Faq = { q: string; a: string };

/** FAQPage for a visible question/answer list — the answers must be on the page too. */
export function faqJsonLd(items: Faq[]) {
  return {
    "@context": SCHEMA,
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

type SchoolRef = Pick<FlightSchool, "name" | "stateSlug" | "citySlug" | "primaryAirportCode" | "slug">;

/** ItemList of schools on a browse page, by canonical URL. */
export function schoolListJsonLd(name: string, schools: SchoolRef[]) {
  return {
    "@context": SCHEMA,
    "@type": "ItemList",
    name,
    numberOfItems: schools.length,
    itemListElement: schools.map((school, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: school.name,
      url: absoluteUrl(schoolHref(school)),
    })),
  };
}

type SchoolJsonLdInput = {
  school: FlightSchool;
  cityName: string;
  stateAbbreviation: string;
  /** The school's own position, else its primary airport's (same rule as the map) */
  coords: LatLng | undefined;
  programs: Pick<Program, "slug" | "name" | "description">[];
};

/**
 * A school listing as a LocalBusiness (typed additionally as an
 * EducationalOrganization). `url` is the school's own website when it has
 * one; the listing page is `mainEntityOfPage`. Anything we can't vouch for
 * — a rating with no reviews, coordinates we don't have — is omitted rather
 * than sent empty: Google rejects the whole block over a bad field.
 */
export function schoolJsonLd({ school, cityName, stateAbbreviation, coords, programs }: SchoolJsonLdInput) {
  const page = absoluteUrl(schoolHref(school));
  const provider = {
    "@type": "Organization",
    name: school.name,
    ...(school.website ? { url: school.website } : {}),
  };
  const logo = school.logoPath ? publicImageUrl(BUCKETS.schoolLogos, school.logoPath) : undefined;

  return {
    "@context": SCHEMA,
    "@type": "LocalBusiness",
    "@id": `${page}#school`,
    additionalType: "https://schema.org/EducationalOrganization",
    name: school.name,
    description: school.description,
    mainEntityOfPage: page,
    url: school.website || undefined,
    telephone: school.phone || undefined,
    ...(logo ? { image: logo, logo } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: cityName,
      addressRegion: stateAbbreviation,
      addressCountry: "US",
    },
    areaServed: { "@type": "City", name: cityName },
    ...(coords
      ? { geo: { "@type": "GeoCoordinates", latitude: coords.lat, longitude: coords.lng } }
      : {}),
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
    ...(programs.length > 0
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Flight training programs",
            itemListElement: programs.map((program) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Course",
                name: program.name,
                description: program.description,
                url: absoluteUrl(`/programs/${program.slug}`),
                provider,
              },
            })),
          },
        }
      : {}),
  };
}
