import { test } from "node:test";
import assert from "node:assert/strict";

// BASE_URL is resolved at import time, so set the env before loading the module.
process.env.NEXT_PUBLIC_SITE_URL = "https://fsf.example";
const {
  organizationJsonLd,
  websiteJsonLd,
  breadcrumbJsonLd,
  schoolListJsonLd,
  schoolJsonLd,
} = await import("../../src/lib/structured-data.ts");

const school = {
  id: "arizona-pilot-academy-mesa",
  name: "Arizona Pilot Academy",
  slug: "arizona-pilot-academy",
  description: "Comprehensive flight training at Falcon Field.",
  primaryAirportCode: "KFFZ",
  citySlug: "mesa",
  stateSlug: "arizona",
  programSlugs: ["private-pilot"],
  rating: 4.5,
  reviewCount: 3,
  website: "https://azpa.example",
  phone: "(480) 555-0100",
  featured: false,
  contacts: [],
};

test("organization and website share stable @ids and the site search action", () => {
  const org = organizationJsonLd();
  const site = websiteJsonLd();
  assert.equal(org["@id"], "https://fsf.example/#organization");
  assert.equal(site["@id"], "https://fsf.example/#website");
  assert.equal(site.publisher["@id"], org["@id"]);
  assert.equal(
    site.potentialAction.target.urlTemplate,
    "https://fsf.example/search?q={search_term_string}",
  );
  assert.equal(site.potentialAction["query-input"], "required name=search_term_string");
});

test("breadcrumbJsonLd prepends Home and numbers positions from 1", () => {
  const bc = breadcrumbJsonLd([
    { name: "Arizona Flight Schools", path: "/states/arizona" },
    { name: "Mesa Flight Schools", path: "/cities/mesa" },
  ]);
  assert.equal(bc["@type"], "BreadcrumbList");
  assert.deepEqual(
    bc.itemListElement.map((i) => [i.position, i.name, i.item]),
    [
      [1, "Home", "https://fsf.example/"],
      [2, "Arizona Flight Schools", "https://fsf.example/states/arizona"],
      [3, "Mesa Flight Schools", "https://fsf.example/cities/mesa"],
    ],
  );
});

test("schoolListJsonLd lists schools by canonical URL", () => {
  const list = schoolListJsonLd("Flight Schools in Arizona", [school]);
  assert.equal(list.numberOfItems, 1);
  assert.equal(list.itemListElement[0].position, 1);
  assert.equal(
    list.itemListElement[0].url,
    "https://fsf.example/arizona/mesa/kffz/arizona-pilot-academy",
  );
});

test("schoolJsonLd builds a LocalBusiness with page, address, rating and programs", () => {
  const ld = schoolJsonLd({
    school,
    cityName: "Mesa",
    stateAbbreviation: "AZ",
    coords: { lat: 33.46, lng: -111.73 },
    programs: [{ slug: "private-pilot", name: "Private Pilot Certificate", description: "Entry-level certificate." }],
  });
  assert.equal(ld["@type"], "LocalBusiness");
  assert.equal(ld.additionalType, "https://schema.org/EducationalOrganization");
  assert.equal(ld["@id"], "https://fsf.example/arizona/mesa/kffz/arizona-pilot-academy#school");
  assert.equal(ld.mainEntityOfPage, "https://fsf.example/arizona/mesa/kffz/arizona-pilot-academy");
  assert.equal(ld.url, "https://azpa.example");
  assert.equal(ld.telephone, "(480) 555-0100");
  assert.deepEqual(ld.address, {
    "@type": "PostalAddress",
    addressLocality: "Mesa",
    addressRegion: "AZ",
    addressCountry: "US",
  });
  assert.deepEqual(ld.geo, { "@type": "GeoCoordinates", latitude: 33.46, longitude: -111.73 });
  assert.equal(ld.aggregateRating?.ratingValue, "4.5");
  assert.equal(ld.aggregateRating?.reviewCount, 3);
  const offers = ld.hasOfferCatalog?.itemListElement ?? [];
  assert.equal(offers.length, 1);
  assert.equal(offers[0].itemOffered["@type"], "Course");
  assert.equal(offers[0].itemOffered.url, "https://fsf.example/programs/private-pilot");
  assert.equal(offers[0].itemOffered.provider.name, "Arizona Pilot Academy");
});

test("schoolJsonLd omits what it cannot vouch for", () => {
  const ld = schoolJsonLd({
    school: { ...school, reviewCount: 0, rating: 0, website: "", phone: "", logoPath: undefined },
    cityName: "Mesa",
    stateAbbreviation: "AZ",
    coords: undefined,
    programs: [],
  });
  assert.equal("aggregateRating" in ld, false, "no rating without reviews");
  assert.equal("geo" in ld, false);
  assert.equal("hasOfferCatalog" in ld, false);
  assert.equal("image" in ld, false);
  assert.equal(ld.url, undefined);
  assert.equal(ld.telephone, undefined);
});
