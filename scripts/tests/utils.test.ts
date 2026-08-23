import { test } from "node:test";
import assert from "node:assert/strict";
import { isHttpUrl, isAirportCode, slugify, schoolHref, pickAirportMatch } from "../../src/lib/utils.ts";

test("isHttpUrl accepts only http(s) URLs", () => {
  assert.equal(isHttpUrl("https://example.com"), true);
  assert.equal(isHttpUrl("http://example.com/path?q=1"), true);
  assert.equal(isHttpUrl("javascript:alert(1)"), false);
  assert.equal(isHttpUrl("ftp://example.com"), false);
  assert.equal(isHttpUrl("data:text/html,hi"), false);
  assert.equal(isHttpUrl("example.com"), false);
  assert.equal(isHttpUrl(""), false);
});

test("isAirportCode accepts every identifier shape the catalog uses", () => {
  // 4-letter ICAO, FAA local identifiers (3 and 4 char, digits anywhere), and
  // the "US-1234" placeholder OurAirports gives fields with no published code.
  assert.equal(isAirportCode("KFFZ"), true);
  assert.equal(isAirportCode("ffz"), true);
  assert.equal(isAirportCode("1G0"), true);
  assert.equal(isAirportCode("01J"), true);
  assert.equal(isAirportCode("43CO"), true);
  assert.equal(isAirportCode("US-0880"), true);
  assert.equal(isAirportCode("US-10896"), true);

  assert.equal(isAirportCode("KF"), false);
  assert.equal(isAirportCode("KFFZZZZZZ"), false);
  assert.equal(isAirportCode(""), false);
});

test("isAirportCode rejects anything that could break the PostgREST or() filter", () => {
  // getAirportByCode interpolates the code into "icao.eq.X,iata.eq.X,..." —
  // a comma or paren would let a caller inject extra filter terms.
  assert.equal(isAirportCode("KFFZ,icao.eq.x"), false);
  assert.equal(isAirportCode("(KFFZ)"), false);
  assert.equal(isAirportCode("KFF."), false);
  assert.equal(isAirportCode("K*FZ"), false);
  assert.equal(isAirportCode("K FZ"), false);
});

test("slugify", () => {
  assert.equal(slugify("Arizona Pilot Academy"), "arizona-pilot-academy");
  assert.equal(slugify("  St. Louis  "), "st-louis");
});

test("slugify collapses hyphen runs and never leaves a dangling hyphen", () => {
  // " - " becomes three hyphens before collapsing: stripping the spaces around
  // an existing hyphen is what produces the run.
  assert.equal(slugify("AeroDynamic Aviation - Monterey"), "aerodynamic-aviation-monterey");
  assert.equal(slugify("CableAir - School of Flight"), "cableair-school-of-flight");
  assert.equal(slugify("- Leading and trailing -"), "leading-and-trailing");
  assert.equal(slugify("Wings // Things"), "wings-things");
  assert.equal(slugify("A -- B"), "a-b");
});

test("schoolHref lowercases the airport code", () => {
  const href = schoolHref({
    id: "x",
    name: "X",
    slug: "x-school",
    description: "",
    primaryAirportCode: "KFFZ",
    citySlug: "mesa",
    stateSlug: "arizona",
    programSlugs: [],
    rating: 0,
    reviewCount: 0,
    website: "",
    phone: "",
  });
  assert.equal(href, "/arizona/mesa/kffz/x-school");
});

test("pickAirportMatch prefers the ICAO hit over alternate identifiers", () => {
  const rows = [
    { icao: "KABC", iata: "FFZ", faa_lid: null },
    { icao: "KFFZ", iata: "MSC", faa_lid: "FFZ" },
  ];
  // FFZ is KABC's IATA and KFFZ's FAA LID — neither is an ICAO match, so the
  // first row (callers order by icao) wins.
  assert.equal(pickAirportMatch(rows, "FFZ"), rows[0]);
  assert.equal(pickAirportMatch(rows, "KFFZ"), rows[1]);
  assert.equal(pickAirportMatch([], "KFFZ"), undefined);
});
