import { test } from "node:test";
import assert from "node:assert/strict";
import { isHttpUrl, isAirportCode, slugify, schoolHref } from "../../src/lib/utils.ts";

test("isHttpUrl accepts only http(s) URLs", () => {
  assert.equal(isHttpUrl("https://example.com"), true);
  assert.equal(isHttpUrl("http://example.com/path?q=1"), true);
  assert.equal(isHttpUrl("javascript:alert(1)"), false);
  assert.equal(isHttpUrl("ftp://example.com"), false);
  assert.equal(isHttpUrl("data:text/html,hi"), false);
  assert.equal(isHttpUrl("example.com"), false);
  assert.equal(isHttpUrl(""), false);
});

test("isAirportCode accepts 3–4 alphanumerics only", () => {
  assert.equal(isAirportCode("KFFZ"), true);
  assert.equal(isAirportCode("ffz"), true);
  assert.equal(isAirportCode("1G0"), true);
  assert.equal(isAirportCode("KF"), false);
  assert.equal(isAirportCode("KFFZZ"), false);
  assert.equal(isAirportCode("KFFZ,icao.eq.x"), false);
  assert.equal(isAirportCode("(KFFZ)"), false);
  assert.equal(isAirportCode(""), false);
});

test("slugify", () => {
  assert.equal(slugify("Arizona Pilot Academy"), "arizona-pilot-academy");
  assert.equal(slugify("  St. Louis  "), "st-louis");
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
