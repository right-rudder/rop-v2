import { test } from "node:test";
import assert from "node:assert/strict";
import { validateProfile, PROFILE_LIMITS } from "../../src/lib/profile.ts";

const catalog = ["private-pilot", "instrument-rating", "commercial-pilot"];
const good = {
  firstName: "  Ada ",
  lastName: "Lovelace ",
  bio: "  Student pilot in Mesa.  ",
  pilotCertificates: ["private-pilot"],
};

test("validateProfile: trims and accepts a valid profile", () => {
  const r = validateProfile(good, catalog);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.deepEqual(r.value, {
      firstName: "Ada",
      lastName: "Lovelace",
      bio: "Student pilot in Mesa.",
      pilotCertificates: ["private-pilot"],
    });
  }
});

test("validateProfile: requires both names", () => {
  assert.equal(validateProfile({ ...good, firstName: " " }, catalog).ok, false);
  assert.equal(validateProfile({ ...good, lastName: "" }, catalog).ok, false);
  assert.equal(validateProfile({ lastName: "L" }, catalog).ok, false);
});

test("validateProfile: enforces name and bio lengths", () => {
  const long = "x".repeat(PROFILE_LIMITS.name + 1);
  assert.equal(validateProfile({ ...good, firstName: long }, catalog).ok, false);
  assert.equal(validateProfile({ ...good, lastName: long }, catalog).ok, false);
  assert.equal(validateProfile({ ...good, bio: "b".repeat(PROFILE_LIMITS.bio + 1) }, catalog).ok, false);
  assert.equal(validateProfile({ ...good, bio: "b".repeat(PROFILE_LIMITS.bio) }, catalog).ok, true);
});

test("validateProfile: an empty bio is stored as null, not an empty string", () => {
  const r = validateProfile({ ...good, bio: "   " }, catalog);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.value.bio, null);
  const missing = validateProfile({ firstName: "A", lastName: "B" }, catalog);
  assert.equal(missing.ok, true);
  if (missing.ok) assert.equal(missing.value.bio, null);
});

test("validateProfile: certificates are restricted to the catalog, de-duplicated, catalog-ordered", () => {
  const r = validateProfile(
    {
      ...good,
      pilotCertificates: [
        "commercial-pilot",
        "<script>",
        "private-pilot",
        "commercial-pilot",
        "airline-transport",
      ],
    },
    catalog,
  );
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.value.pilotCertificates, ["private-pilot", "commercial-pilot"]);
});

test("validateProfile: missing certificates default to an empty list", () => {
  const r = validateProfile({ firstName: "A", lastName: "B" }, catalog);
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.value.pilotCertificates, []);
});
