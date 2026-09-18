/**
 * Pure helpers for listing suggestions: the field and reason catalogues, form
 * validation, value equality and display. The only runtime import is the
 * contacts helper, pulled in by extension so `node --test` can run this file
 * directly (see scripts/tests/suggestions.test.ts).
 */
import type { ContactPerson } from "./types";
import { validateContacts, formatContact } from "./contacts.ts";

export const SUGGESTION_FIELDS = [
  { key: "phone", label: "Phone number", kind: "text", column: "phone" },
  { key: "website", label: "Website", kind: "url", column: "website" },
  { key: "address", label: "Address", kind: "text", column: "address" },
  { key: "hours", label: "Hours", kind: "multiline", column: "hours" },
  { key: "contacts", label: "Key contacts", kind: "contacts", column: "contacts" },
] as const;

export type SuggestionField = (typeof SUGGESTION_FIELDS)[number]["key"];
export type SuggestionFieldKind = (typeof SUGGESTION_FIELDS)[number]["kind"];
export type SuggestionColumn = (typeof SUGGESTION_FIELDS)[number]["column"];

/** Why the member thinks the listing is wrong. Mirrors the DB CHECK; "other" must come last. */
export const SUGGESTION_REASONS = [
  { key: "outdated", label: "Out of date" },
  { key: "incorrect", label: "Wrong information" },
  { key: "unreachable", label: "Doesn't work (disconnected, site down, bounces)" },
  { key: "missing", label: "Missing from the listing" },
  { key: "moved", label: "School moved or rebranded" },
  { key: "typo", label: "Typo or formatting" },
  { key: "other", label: "Other" },
] as const;

export type SuggestionReason = (typeof SUGGESTION_REASONS)[number]["key"];

/** Text limits, mirroring the flight_schools CHECKs and the suggestion note CHECK. */
export const SUGGESTION_LIMITS = {
  phone: 40,
  website: 300,
  address: 300,
  hours: 300,
  note: 500,
} as const;

/** A JSON string for the text fields, a contact list for contacts. */
export type SuggestionValue = string | ContactPerson[];

export function isSuggestionField(value: string): value is SuggestionField {
  return SUGGESTION_FIELDS.some((f) => f.key === value);
}

export function isSuggestionReason(value: string): value is SuggestionReason {
  return SUGGESTION_REASONS.some((r) => r.key === value);
}

const fieldDef = (field: SuggestionField) => SUGGESTION_FIELDS.find((f) => f.key === field)!;

export function suggestionFieldLabel(field: SuggestionField): string {
  return fieldDef(field).label;
}

export function suggestionFieldKind(field: SuggestionField): SuggestionFieldKind {
  return fieldDef(field).kind;
}

/** The flight_schools column an approved suggestion writes. */
export function suggestionColumn(field: SuggestionField): SuggestionColumn {
  return fieldDef(field).column;
}

export function suggestionReasonLabel(reason: SuggestionReason): string {
  return SUGGESTION_REASONS.find((r) => r.key === reason)!.label;
}

export type SuggestionInput = {
  field: string;
  reason: string;
  note?: string;
  value: unknown;
};

export type SuggestionValues = {
  field: SuggestionField;
  reason: SuggestionReason;
  note: string;
  value: SuggestionValue;
};

export type SuggestionValidation =
  | { ok: true; value: SuggestionValues }
  | { ok: false; error: string };

// Same rule as isHttpUrl in ./utils and the flight_schools website CHECK.
function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validate what a member (or an admin editing before applying) proposes.
 * Deliberately does not compare against the listing's current value — the
 * create action refuses no-op suggestions, while approve reuses this as is.
 */
export function validateSuggestion(input: SuggestionInput): SuggestionValidation {
  const { field, reason } = input;
  if (!isSuggestionField(field)) return { ok: false, error: "Pick a field to correct." };
  if (!isSuggestionReason(reason)) return { ok: false, error: "Pick a reason." };

  const note = (input.note ?? "").trim();
  if (reason === "other" && !note) {
    return { ok: false, error: "Tell us what's wrong in the details box." };
  }
  if (note.length > SUGGESTION_LIMITS.note) {
    return { ok: false, error: `Details can be at most ${SUGGESTION_LIMITS.note} characters.` };
  }

  if (field === "contacts") {
    const contacts = validateContacts(input.value);
    if (!Array.isArray(contacts)) return { ok: false, error: contacts.error };
    return { ok: true, value: { field, reason, note, value: contacts } };
  }

  if (typeof input.value !== "string") {
    return { ok: false, error: `Please enter the ${suggestionFieldLabel(field).toLowerCase()}.` };
  }
  const value = input.value.trim();
  const label = suggestionFieldLabel(field);
  if (!value) return { ok: false, error: `Please enter the ${label.toLowerCase()}.` };
  if (value.length > SUGGESTION_LIMITS[field]) {
    return { ok: false, error: `${label} must be ${SUGGESTION_LIMITS[field]} characters or fewer.` };
  }
  if (field === "website" && !isHttpUrl(value)) {
    return { ok: false, error: "Website must be a full address starting with http:// or https://." };
  }
  return { ok: true, value: { field, reason, note, value } };
}

const normaliseContacts = (contacts: ContactPerson[]) =>
  contacts.map((c) => ({
    name: c.name.trim(),
    title: c.title.trim(),
    phone: c.phone.trim(),
    email: c.email.trim(),
  }));

/** Trimmed text equality, or an order-sensitive comparison of trimmed contacts. */
export function suggestionValuesEqual(a: SuggestionValue, b: SuggestionValue): boolean {
  if (typeof a === "string" || typeof b === "string") {
    return typeof a === "string" && typeof b === "string" && a.trim() === b.trim();
  }
  return JSON.stringify(normaliseContacts(a)) === JSON.stringify(normaliseContacts(b));
}

/** Display text for a value; contacts one per line; "Not listed" for nothing. */
export function formatSuggestionValue(
  field: SuggestionField,
  value: SuggestionValue | undefined,
): string {
  if (value === undefined) return "Not listed";
  if (field === "contacts") {
    const lines = Array.isArray(value) ? value.map(formatContact).filter(Boolean) : [];
    return lines.length > 0 ? lines.join("\n") : "Not listed";
  }
  return typeof value === "string" && value.trim() ? value : "Not listed";
}

function isContact(raw: unknown): raw is ContactPerson {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return false;
  const record = raw as Record<string, unknown>;
  return (["name", "title", "phone", "email"] as const).every((k) => typeof record[k] === "string");
}

/** Guards a value read back from jsonb: a string for text fields, a contact list for contacts. */
export function isSuggestionValue(field: SuggestionField, raw: unknown): raw is SuggestionValue {
  if (field === "contacts") return Array.isArray(raw) && raw.every(isContact);
  return typeof raw === "string";
}

export type SuggestableListing = {
  phone: string;
  website: string;
  address?: string | null;
  hours?: string | null;
  contacts?: ContactPerson[] | null;
};

/**
 * What the listing shows for a field right now, with nulls normalised and
 * every contact carrying all four keys — the shape the DB CHECK expects when
 * this is stored as a suggestion's current_value.
 */
export function currentValueFor(school: SuggestableListing, field: SuggestionField): SuggestionValue {
  switch (field) {
    case "phone":
      return school.phone;
    case "website":
      return school.website;
    case "address":
      return school.address ?? "";
    case "hours":
      return school.hours ?? "";
    case "contacts":
      return (school.contacts ?? []).map((c) => ({
        name: c.name ?? "",
        title: c.title ?? "",
        phone: c.phone ?? "",
        email: c.email ?? "",
      }));
  }
}
