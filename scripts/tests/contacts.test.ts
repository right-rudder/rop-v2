import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CONTACT_LIMITS,
  contactsFromEntries,
  validateContacts,
  formatContact,
} from "../../src/lib/contacts.ts";

const jane = { name: "Jane Smith", title: "Chief Flight Instructor", phone: "(555) 000-0000", email: "jane@school.com" };

test("contactsFromEntries rebuilds contacts from indexed form keys, trimmed", () => {
  const result = contactsFromEntries([
    ["contacts[0][name]", "  Jane Smith  "],
    ["contacts[0][title]", "Chief Flight Instructor"],
    ["contacts[0][phone]", "(555) 000-0000 "],
    ["contacts[0][email]", " jane@school.com"],
    ["schoolId", "abc"],
    ["contacts[x][name]", "ignored"],
  ]);
  assert.deepEqual(result, [jane]);
});

test("contactsFromEntries drops empty rows, keeps index gaps and sparse rows", () => {
  const result = contactsFromEntries([
    ["contacts[0][name]", ""],
    ["contacts[0][email]", "  "],
    ["contacts[3][name]", "Sam"],
    ["contacts[3][phone]", "123"],
  ]);
  assert.deepEqual(result, [{ name: "Sam", title: "", phone: "123", email: "" }]);
});

test("contactsFromEntries allows an empty contact list (the owner may clear it)", () => {
  assert.deepEqual(contactsFromEntries([]), []);
});

test("contactsFromEntries enforces the per-field and count limits", () => {
  const long = contactsFromEntries([["contacts[0][name]", "x".repeat(CONTACT_LIMITS.field + 1)]]);
  assert.ok(!Array.isArray(long) && /characters/.test(long.error));
  const many = contactsFromEntries(
    Array.from({ length: CONTACT_LIMITS.count + 1 }, (_, i) => [`contacts[${i}][name]`, `P${i}`] as [string, string]),
  );
  assert.ok(!Array.isArray(many) && /at most/.test(many.error));
  const exactly = contactsFromEntries(
    Array.from({ length: CONTACT_LIMITS.count }, (_, i) => [`contacts[${i}][name]`, `P${i}`] as [string, string]),
  );
  assert.ok(Array.isArray(exactly) && exactly.length === CONTACT_LIMITS.count);
});

test("validateContacts accepts a JSON-shaped list, trims, and drops empty rows", () => {
  const result = validateContacts([
    { name: " Jane Smith ", title: "Chief Flight Instructor", phone: "(555) 000-0000", email: "jane@school.com" },
    { name: "", title: "", phone: "", email: "" },
  ]);
  assert.deepEqual(result, [jane]);
});

test("validateContacts fills missing keys and rejects the wrong shapes", () => {
  assert.deepEqual(validateContacts([{ name: "Sam" }]), [{ name: "Sam", title: "", phone: "", email: "" }]);
  for (const bad of [null, "Jane", { name: "Jane" }, [null], ["Jane"], [{ name: 5 }], [{ name: "Jane", extra: 1 }]]) {
    const result = validateContacts(bad);
    assert.ok(!Array.isArray(result), JSON.stringify(bad));
  }
});

test("validateContacts requires at least one contact and respects the limits", () => {
  const none = validateContacts([]);
  assert.ok(!Array.isArray(none) && /at least one/i.test(none.error));
  const blank = validateContacts([{ name: "", title: "", phone: "", email: "" }]);
  assert.ok(!Array.isArray(blank));
  const long = validateContacts([{ ...jane, email: "e".repeat(CONTACT_LIMITS.field + 1) }]);
  assert.ok(!Array.isArray(long));
  const many = validateContacts(Array.from({ length: CONTACT_LIMITS.count + 1 }, () => jane));
  assert.ok(!Array.isArray(many));
});

test("formatContact joins the parts that exist", () => {
  assert.equal(formatContact(jane), "Jane Smith — Chief Flight Instructor · (555) 000-0000 · jane@school.com");
  assert.equal(formatContact({ name: "Sam", title: "", phone: "", email: "" }), "Sam");
  assert.equal(formatContact({ name: "", title: "Manager", phone: "", email: "m@x.com" }), "Manager · m@x.com");
  assert.equal(formatContact({ name: "", title: "", phone: "", email: "" }), "");
});
