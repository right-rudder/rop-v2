import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SUGGESTION_FIELDS,
  SUGGESTION_REASONS,
  SUGGESTION_LIMITS,
  isSuggestionField,
  isSuggestionReason,
  suggestionFieldLabel,
  suggestionReasonLabel,
  suggestionColumn,
  validateSuggestion,
  suggestionValuesEqual,
  formatSuggestionValue,
  isSuggestionValue,
  currentValueFor,
} from "../../src/lib/suggestions.ts";

const jane = { name: "Jane Smith", title: "CFI", phone: "555", email: "jane@school.com" };
const base = { reason: "outdated", note: "" };

test("the field and reason lists match the database CHECK constraints", () => {
  assert.deepEqual(
    SUGGESTION_FIELDS.map((f) => f.key),
    ["phone", "website", "address", "hours", "contacts"],
  );
  assert.deepEqual(
    SUGGESTION_REASONS.map((r) => r.key),
    ["outdated", "incorrect", "unreachable", "missing", "moved", "typo", "other"],
  );
  for (const f of SUGGESTION_FIELDS) assert.ok(f.label.length > 0 && f.column.length > 0);
  for (const r of SUGGESTION_REASONS) assert.ok(r.label.length > 0);
  assert.equal(SUGGESTION_REASONS.at(-1)?.key, "other");
});

test("guards and labels", () => {
  assert.equal(isSuggestionField("phone"), true);
  assert.equal(isSuggestionField("name"), false);
  assert.equal(isSuggestionReason("typo"), true);
  assert.equal(isSuggestionReason("bored"), false);
  assert.equal(suggestionFieldLabel("contacts"), "Key contacts");
  assert.equal(suggestionReasonLabel("other"), "Other");
  assert.equal(suggestionColumn("contacts"), "contacts");
  assert.equal(suggestionColumn("hours"), "hours");
});

test("accepts each text field, trimmed, at its limit", () => {
  for (const field of ["phone", "address", "hours"] as const) {
    const value = "x".repeat(SUGGESTION_LIMITS[field]);
    const result = validateSuggestion({ ...base, field, value: `  ${value}  ` });
    assert.equal(result.ok, true, field);
    assert.deepEqual(result.ok && result.value, { field, reason: "outdated", note: "", value });
    const over = validateSuggestion({ ...base, field, value: value + "x" });
    assert.equal(over.ok, false, field);
  }
});

test("website must be a full http(s) URL within the limit", () => {
  assert.equal(validateSuggestion({ ...base, field: "website", value: "https://school.com" }).ok, true);
  assert.equal(validateSuggestion({ ...base, field: "website", value: "school.com" }).ok, false);
  assert.equal(validateSuggestion({ ...base, field: "website", value: "ftp://school.com" }).ok, false);
  assert.equal(
    validateSuggestion({ ...base, field: "website", value: "https://" + "a".repeat(SUGGESTION_LIMITS.website) }).ok,
    false,
  );
});

test("rejects an empty value, an unknown field and an unknown reason", () => {
  const empty = validateSuggestion({ ...base, field: "phone", value: "   " });
  assert.equal(empty.ok, false);
  const field = validateSuggestion({ ...base, field: "name", value: "x" });
  assert.ok(!field.ok && /field/i.test(field.error));
  const reason = validateSuggestion({ field: "phone", reason: "", value: "x" });
  assert.ok(!reason.ok && /reason/i.test(reason.error));
});

test("'other' needs a note; the note is capped", () => {
  const bare = validateSuggestion({ field: "phone", reason: "other", note: "  ", value: "555" });
  assert.ok(!bare.ok && /details/i.test(bare.error));
  const told = validateSuggestion({ field: "phone", reason: "other", note: " Rings a pizza place. ", value: "555" });
  assert.deepEqual(told.ok && told.value, { field: "phone", reason: "other", note: "Rings a pizza place.", value: "555" });
  const long = validateSuggestion({ ...base, field: "phone", note: "n".repeat(SUGGESTION_LIMITS.note + 1), value: "555" });
  assert.equal(long.ok, false);
});

test("contacts are validated as a list and empty rows are dropped", () => {
  const ok = validateSuggestion({ ...base, field: "contacts", value: [jane, { name: "", title: "", phone: "", email: "" }] });
  assert.deepEqual(ok.ok && ok.value.value, [jane]);
  assert.equal(validateSuggestion({ ...base, field: "contacts", value: [] }).ok, false);
  assert.equal(validateSuggestion({ ...base, field: "contacts", value: "Jane" }).ok, false);
  assert.equal(validateSuggestion({ ...base, field: "contacts", value: Array.from({ length: 11 }, () => jane) }).ok, false);
});

test("a text value offered for the contacts field, or a list for a text field, is refused", () => {
  assert.equal(validateSuggestion({ ...base, field: "contacts", value: "555" }).ok, false);
  assert.equal(validateSuggestion({ ...base, field: "phone", value: [jane] }).ok, false);
});

test("suggestionValuesEqual compares trimmed text and normalised contacts", () => {
  assert.equal(suggestionValuesEqual(" 555 ", "555"), true);
  assert.equal(suggestionValuesEqual("555", "556"), false);
  assert.equal(suggestionValuesEqual([jane], [{ ...jane, name: " Jane Smith " }]), true);
  assert.equal(suggestionValuesEqual([jane], [{ ...jane, phone: "556" }]), false);
  assert.equal(suggestionValuesEqual([jane], "Jane"), false);
  assert.equal(suggestionValuesEqual([], []), true);
});

test("formatSuggestionValue renders text, contacts one per line, and a placeholder for nothing", () => {
  assert.equal(formatSuggestionValue("phone", "555"), "555");
  assert.equal(formatSuggestionValue("phone", ""), "Not listed");
  assert.equal(formatSuggestionValue("phone", undefined), "Not listed");
  assert.equal(formatSuggestionValue("contacts", []), "Not listed");
  assert.equal(
    formatSuggestionValue("contacts", [jane, { name: "Sam", title: "", phone: "", email: "" }]),
    "Jane Smith — CFI · 555 · jane@school.com\nSam",
  );
});

test("isSuggestionValue guards what comes back from jsonb", () => {
  assert.equal(isSuggestionValue("phone", "555"), true);
  assert.equal(isSuggestionValue("phone", ["555"]), false);
  assert.equal(isSuggestionValue("contacts", [jane]), true);
  assert.equal(isSuggestionValue("contacts", [{ name: "x" }]), false);
  assert.equal(isSuggestionValue("contacts", "Jane"), false);
  assert.equal(isSuggestionValue("contacts", null), false);
});

test("currentValueFor reads the listing with nulls normalised", () => {
  const school = { phone: "555", website: "https://s.com", address: null, hours: undefined, contacts: null };
  assert.equal(currentValueFor(school, "phone"), "555");
  assert.equal(currentValueFor(school, "website"), "https://s.com");
  assert.equal(currentValueFor(school, "address"), "");
  assert.equal(currentValueFor(school, "hours"), "");
  assert.deepEqual(currentValueFor(school, "contacts"), []);
  assert.deepEqual(currentValueFor({ ...school, contacts: [jane] }, "contacts"), [jane]);
});
