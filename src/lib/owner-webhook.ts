/**
 * Payload for the GoHighLevel "owner approved" webhook — the CRM contact for
 * someone an admin just made the owner of a listing. Pure — no imports — so
 * the tests in scripts/tests run this file directly under `node --test`. The
 * delivery side (contact lookup + POST) lives in src/lib/notify.ts.
 */

/** How the person became the owner. */
export type OwnerSource =
  | "claim_approved"
  | "admin_assigned"
  | "admin_invited"
  | "submission_approved";

/** "invited" until the person has accepted the invite email and set a password. */
export type OwnerAccountStatus = "active" | "invited";

export type OwnerPayloadArgs = {
  source: OwnerSource;
  /** ISO timestamp of the admin's decision */
  approvedAt: string;
  /** auth.users id of the deciding admin */
  approvedBy: string;
  accountStatus: OwnerAccountStatus;
  owner: {
    userId: string;
    firstName: string;
    lastName: string;
    /** The account email — where product mail goes */
    email: string;
    phone: string;
    /** Their role at the school, when the path that approved them recorded one */
    roleTitle: string;
    /** Where they can be reached at the school, when known */
    workEmail: string;
  };
  school: {
    id: string;
    name: string;
    slug: string;
    url: string;
    editUrl: string;
    website: string;
    phone: string;
    airportCode: string;
    city: string;
    state: string;
  };
};

/** Flat, string-valued body for a GHL workflow "Inbound Webhook" trigger. */
export function buildOwnerPayload(a: OwnerPayloadArgs): Record<string, string> {
  const firstName = a.owner.firstName.trim();
  const lastName = a.owner.lastName.trim();
  return {
    source: "flight-school-finder",
    event: "owner_approved",
    owner_source: a.source,
    approved_at: a.approvedAt,
    approved_by: a.approvedBy,
    account_status: a.accountStatus,
    user_id: a.owner.userId,
    first_name: firstName,
    last_name: lastName,
    name: [firstName, lastName].filter(Boolean).join(" "),
    email: a.owner.email.trim(),
    phone: a.owner.phone.trim(),
    role_title: a.owner.roleTitle.trim(),
    work_email: a.owner.workEmail.trim(),
    company_name: a.school.name,
    school_id: a.school.id,
    school_name: a.school.name,
    school_slug: a.school.slug,
    school_url: a.school.url,
    school_edit_url: a.school.editUrl,
    school_website: a.school.website,
    school_phone: a.school.phone,
    airport_code: a.school.airportCode,
    city: a.school.city,
    state: a.school.state,
  };
}

type Contact = { name: string; title: string; phone: string; email: string };

const norm = (s: string | undefined) => (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");

/**
 * The listing contact that is the submitter themselves, if they listed
 * themselves: same email as the account, else the same full name. A submission
 * has no "your role" field, so this is the only source for a submitter's title
 * and work email.
 */
export function matchSubmitterContact<T extends Contact>(
  contacts: readonly T[] | undefined,
  who: { email: string; firstName: string; lastName: string },
): T | undefined {
  if (!contacts || contacts.length === 0) return undefined;
  const email = norm(who.email);
  if (email) {
    const byEmail = contacts.find((c) => norm(c.email) === email);
    if (byEmail) return byEmail;
  }
  const fullName = norm(`${who.firstName} ${who.lastName}`);
  if (!fullName) return undefined;
  return contacts.find((c) => norm(c.name) === fullName);
}
