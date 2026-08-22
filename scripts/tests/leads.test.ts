import { test } from "node:test";
import assert from "node:assert/strict";
import { validateLead, buildGhlPayload, hashIp, LEAD_LIMITS } from "../../src/lib/leads.ts";

const programs = ["private-pilot", "instrument-rating"];
const good = { name: "  Ada Lovelace ", email: "ada@example.com", phone: "", programSlug: "private-pilot", message: "Hi" };

test("validateLead: trims and accepts a valid lead", () => {
  const r = validateLead(good, programs);
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.value, { name: "Ada Lovelace", email: "ada@example.com", phone: "", programSlug: "private-pilot", message: "Hi" });
});

test("validateLead: requires name and a plausible email", () => {
  assert.equal(validateLead({ ...good, name: " " }, programs).ok, false);
  assert.equal(validateLead({ ...good, email: "" }, programs).ok, false);
  assert.equal(validateLead({ ...good, email: "not-an-email" }, programs).ok, false);
  assert.equal(validateLead({ ...good, email: "a@b" }, programs).ok, false);
  assert.equal(validateLead({ ...good, email: "a@b.co" }, programs).ok, true);
});

test("validateLead: enforces lengths", () => {
  assert.equal(validateLead({ ...good, name: "x".repeat(LEAD_LIMITS.name + 1) }, programs).ok, false);
  assert.equal(validateLead({ ...good, phone: "1".repeat(LEAD_LIMITS.phone + 1) }, programs).ok, false);
  assert.equal(validateLead({ ...good, message: "m".repeat(LEAD_LIMITS.message + 1) }, programs).ok, false);
  assert.equal(validateLead({ ...good, message: "m".repeat(LEAD_LIMITS.message) }, programs).ok, true);
});

test("validateLead: program must be one of the school's (or empty)", () => {
  assert.equal(validateLead({ ...good, programSlug: "" }, programs).ok, true);
  assert.equal(validateLead({ ...good, programSlug: "airline-transport" }, programs).ok, false);
  assert.equal(validateLead({ ...good, programSlug: "<script>" }, programs).ok, false);
});

test("validateLead: missing optional fields default to empty strings", () => {
  const r = validateLead({ name: "A", email: "a@b.co" }, programs);
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.value, { name: "A", email: "a@b.co", phone: "", programSlug: "", message: "" });
});

test("buildGhlPayload: flat string map with every key", () => {
  const p = buildGhlPayload({
    leadId: "11111111-1111-1111-1111-111111111111",
    submittedAt: "2026-08-21T12:00:00.000Z",
    sourcePath: "/arizona/mesa/kffz/arizona-pilot-academy",
    school: { id: "arizona-pilot-academy-mesa", name: "Arizona Pilot Academy", slug: "arizona-pilot-academy", url: "https://example.com/arizona/mesa/kffz/arizona-pilot-academy", airportCode: "KFFZ", city: "Mesa", state: "AZ" },
    lead: { name: "Ada", email: "ada@example.com", phone: "", programSlug: "private-pilot", programName: "Private Pilot", message: "Hi" },
  });
  const keys = ["lead_id","submitted_at","source","school_id","school_name","school_slug","school_url","airport_code","city","state","name","email","phone","program","program_slug","message","source_path"];
  assert.deepEqual(Object.keys(p).sort(), [...keys].sort());
  for (const v of Object.values(p)) assert.equal(typeof v, "string");
  assert.equal(p.source, "flight-school-finder");
  assert.equal(p.program, "Private Pilot");
});

test("hashIp: deterministic sha-256 hex, salt-sensitive, never the raw ip", () => {
  const a = hashIp("203.0.113.7", "salt");
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.equal(a, hashIp("203.0.113.7", "salt"));
  assert.notEqual(a, hashIp("203.0.113.7", "other"));
  assert.notEqual(a, hashIp("203.0.113.8", "salt"));
  assert.ok(!a.includes("203.0.113.7"));
});
