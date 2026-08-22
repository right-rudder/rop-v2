import { test } from "node:test";
import assert from "node:assert/strict";
import {
  haversineMiles,
  isValidLatLng,
  parseRadius,
  centroid,
  formatMiles,
  formatNearParam,
  parseNearParam,
  originLabel,
  DEFAULT_RADIUS,
  type NearLookup,
} from "../../src/lib/geo.ts";

const KLAX = { lat: 33.9425, lng: -118.4081 };
const KPHX = { lat: 33.4373, lng: -112.0078 };
const KFFZ = { lat: 33.4608, lng: -111.7283 };

const lookup: NearLookup = {
  airportByIcao: (icao) =>
    icao === "KFFZ" ? { coords: KFFZ, label: "Falcon Field Airport" } : undefined,
  cityBySlug: (slug) =>
    slug === "mesa" ? { coords: KFFZ, label: "Mesa, AZ" } : undefined,
};

test("haversineMiles: known distance and zero distance", () => {
  const d = haversineMiles(KLAX, KPHX);
  assert.ok(Math.abs(d - 370) < 3, `expected ~370 mi, got ${d}`);
  assert.equal(haversineMiles(KFFZ, KFFZ), 0);
  assert.equal(haversineMiles(KLAX, KPHX), haversineMiles(KPHX, KLAX));
});

test("isValidLatLng rejects out-of-range and non-finite values", () => {
  assert.equal(isValidLatLng({ lat: 0, lng: 0 }), true);
  assert.equal(isValidLatLng({ lat: 90, lng: -180 }), true);
  assert.equal(isValidLatLng({ lat: 91, lng: 0 }), false);
  assert.equal(isValidLatLng({ lat: 0, lng: 181 }), false);
  assert.equal(isValidLatLng({ lat: NaN, lng: 0 }), false);
});

test("parseRadius accepts only the allowed options", () => {
  assert.equal(parseRadius("25"), 25);
  assert.equal(parseRadius("250"), 250);
  assert.equal(parseRadius("30"), DEFAULT_RADIUS);
  assert.equal(parseRadius("abc"), DEFAULT_RADIUS);
  assert.equal(parseRadius(null), DEFAULT_RADIUS);
});

test("centroid averages points and is undefined for none", () => {
  assert.equal(centroid([]), undefined);
  assert.deepEqual(centroid([KFFZ]), KFFZ);
  const c = centroid([{ lat: 0, lng: 0 }, { lat: 2, lng: 4 }]);
  assert.deepEqual(c, { lat: 1, lng: 2 });
});

test("formatMiles", () => {
  assert.equal(formatMiles(0.4), "<1 mi");
  assert.equal(formatMiles(41.6), "42 mi");
  assert.equal(formatMiles(100), "100 mi");
});

test("near param: geo round-trip rounds to 4 dp", () => {
  const origin = { kind: "geo" as const, coords: { lat: 33.46081234, lng: -111.72829876 } };
  const param = formatNearParam(origin);
  assert.equal(param, "33.4608,-111.7283");
  assert.deepEqual(parseNearParam(param, lookup), {
    kind: "geo",
    coords: { lat: 33.4608, lng: -111.7283 },
  });
});

test("near param: airport and city forms resolve through the lookup", () => {
  assert.deepEqual(parseNearParam("kffz", lookup), {
    kind: "airport",
    icao: "KFFZ",
    coords: KFFZ,
    label: "Falcon Field Airport",
  });
  assert.equal(
    formatNearParam({ kind: "airport", icao: "KFFZ", coords: KFFZ, label: "x" }),
    "kffz",
  );
  assert.deepEqual(parseNearParam("city:mesa", lookup), {
    kind: "city",
    slug: "mesa",
    coords: KFFZ,
    label: "Mesa, AZ",
  });
  assert.equal(formatNearParam({ kind: "city", slug: "mesa", coords: KFFZ, label: "x" }), "city:mesa");
});

test("near param: unknown or malformed input is ignored", () => {
  assert.equal(parseNearParam(null, lookup), null);
  assert.equal(parseNearParam("", lookup), null);
  assert.equal(parseNearParam("kzzz", lookup), null);
  assert.equal(parseNearParam("city:nowhere", lookup), null);
  assert.equal(parseNearParam("95,10", lookup), null);
  assert.equal(parseNearParam("abc,def", lookup), null);
  assert.equal(parseNearParam("<script>", lookup), null);
});

test("originLabel", () => {
  assert.equal(originLabel({ kind: "geo", coords: KFFZ }), "Your location");
  assert.equal(originLabel({ kind: "airport", icao: "KFFZ", coords: KFFZ, label: "Falcon Field Airport" }), "Falcon Field Airport");
  assert.equal(originLabel({ kind: "city", slug: "mesa", coords: KFFZ, label: "Mesa, AZ" }), "Mesa, AZ");
});
