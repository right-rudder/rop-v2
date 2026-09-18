/**
 * Pure helpers for a listing's key contacts. Shared by the school edit form
 * (which reads them out of a FormData) and listing suggestions (which also
 * re-validate them after a round trip through jsonb). No runtime imports, so
 * the tests in scripts/tests run this file directly under `node --test`.
 */
import type { ContactPerson } from "./types";

/** Mirrors LIMITS.contactField / LIMITS.contacts in ./types. */
export const CONTACT_LIMITS = { field: 120, count: 10 } as const;

const KEYS = ["name", "title", "phone", "email"] as const;

const emptyContact = (): ContactPerson => ({ name: "", title: "", phone: "", email: "" });
const isBlank = (c: ContactPerson) => !c.name && !c.title && !c.phone && !c.email;

function tooLong(): { error: string } {
  return { error: `Contact details must be ${CONTACT_LIMITS.field} characters or fewer.` };
}
function tooMany(): { error: string } {
  return { error: `Please list at most ${CONTACT_LIMITS.count} contacts.` };
}

/**
 * Rebuild ContactPerson[] from `contacts[i][field]` form inputs, dropping
 * empty rows. An empty list is fine here — an owner may clear their contacts.
 */
export function contactsFromEntries(
  entries: Iterable<[string, unknown]>,
): ContactPerson[] | { error: string } {
  const byIndex = new Map<number, ContactPerson>();
  for (const [key, value] of entries) {
    const match = key.match(/^contacts\[(\d+)\]\[(name|title|phone|email)\]$/);
    if (!match || typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed.length > CONTACT_LIMITS.field) return tooLong();
    const index = Number(match[1]);
    const contact = byIndex.get(index) ?? emptyContact();
    contact[match[2] as keyof ContactPerson] = trimmed;
    byIndex.set(index, contact);
  }
  const contacts = [...byIndex.values()].filter((c) => !isBlank(c));
  if (contacts.length > CONTACT_LIMITS.count) return tooMany();
  return contacts;
}

/**
 * Validate a JSON-shaped contact list — what a suggestion stores and what an
 * admin's edit sends back. Stricter than the form reader: at least one
 * non-empty contact, and nothing but the four known string fields.
 */
export function validateContacts(raw: unknown): ContactPerson[] | { error: string } {
  if (!Array.isArray(raw)) return { error: "Contacts must be a list." };
  const contacts: ContactPerson[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return { error: "Each contact must have a name, title, phone and email." };
    }
    const record = item as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (!(KEYS as readonly string[]).includes(key)) {
        return { error: "Each contact must have only a name, title, phone and email." };
      }
    }
    const contact = emptyContact();
    for (const key of KEYS) {
      const value = record[key];
      if (value === undefined) continue;
      if (typeof value !== "string") return { error: "Contact details must be text." };
      const trimmed = value.trim();
      if (trimmed.length > CONTACT_LIMITS.field) return tooLong();
      contact[key] = trimmed;
    }
    if (!isBlank(contact)) contacts.push(contact);
  }
  if (contacts.length === 0) return { error: "Add at least one contact." };
  if (contacts.length > CONTACT_LIMITS.count) return tooMany();
  return contacts;
}

/** "Jane Smith — Chief Flight Instructor · (555) 000-0000 · jane@school.com", skipping blanks. */
export function formatContact(contact: ContactPerson): string {
  const who = [contact.name, contact.title].filter(Boolean).join(" — ");
  return [who, contact.phone, contact.email].filter(Boolean).join(" · ");
}
