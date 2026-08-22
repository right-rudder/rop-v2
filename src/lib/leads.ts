/**
 * Pure lead helpers: validation, the GoHighLevel webhook payload, and IP
 * hashing. Node-only (uses node:crypto) — imported by the server action and
 * by scripts/tests; relative imports only.
 */
import { createHash } from "node:crypto";

export const LEAD_LIMITS = { name: 120, email: 254, phone: 40, message: 2000 } as const;

export type LeadValues = {
  name: string;
  email: string;
  phone: string;
  programSlug: string;
  message: string;
};

export type LeadValidation = { ok: true; value: LeadValues } | { ok: false; error: string };

// Deliberately loose: "something@something.tld". The DB CHECK mirrors it.
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function validateLead(
  input: Partial<LeadValues>,
  allowedPrograms: readonly string[],
): LeadValidation {
  const name = (input.name ?? "").trim();
  const email = (input.email ?? "").trim();
  const phone = (input.phone ?? "").trim();
  const programSlug = (input.programSlug ?? "").trim();
  const message = (input.message ?? "").trim();

  if (!name) return { ok: false, error: "Please enter your name." };
  if (name.length > LEAD_LIMITS.name) {
    return { ok: false, error: `Names can be at most ${LEAD_LIMITS.name} characters.` };
  }
  if (!email) return { ok: false, error: "Please enter your email." };
  if (email.length > LEAD_LIMITS.email || !EMAIL.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (phone.length > LEAD_LIMITS.phone) {
    return { ok: false, error: `Phone numbers can be at most ${LEAD_LIMITS.phone} characters.` };
  }
  if (programSlug && !allowedPrograms.includes(programSlug)) {
    return { ok: false, error: "Please pick one of this school's programs." };
  }
  if (message.length > LEAD_LIMITS.message) {
    return {
      ok: false,
      error: `Messages can be at most ${LEAD_LIMITS.message.toLocaleString()} characters.`,
    };
  }
  return { ok: true, value: { name, email, phone, programSlug, message } };
}

export type GhlPayloadArgs = {
  leadId: string;
  submittedAt: string;
  sourcePath: string;
  school: {
    id: string;
    name: string;
    slug: string;
    url: string;
    airportCode: string;
    city: string;
    state: string;
  };
  lead: LeadValues & { programName: string };
};

/** Flat, string-valued body for a GHL workflow "Inbound Webhook" trigger. */
export function buildGhlPayload(a: GhlPayloadArgs): Record<string, string> {
  return {
    lead_id: a.leadId,
    submitted_at: a.submittedAt,
    source: "flight-school-finder",
    school_id: a.school.id,
    school_name: a.school.name,
    school_slug: a.school.slug,
    school_url: a.school.url,
    airport_code: a.school.airportCode,
    city: a.school.city,
    state: a.school.state,
    name: a.lead.name,
    email: a.lead.email,
    phone: a.lead.phone,
    program: a.lead.programName,
    program_slug: a.lead.programSlug,
    message: a.lead.message,
    source_path: a.sourcePath,
  };
}

/** SHA-256 of salt + ip; the raw address is never stored. */
export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/**
 * "Ada King Lovelace" → { firstName: "Ada", lastName: "King Lovelace" }.
 * Used to pre-fill the signup form from a lead's single name field.
 */
export function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}
