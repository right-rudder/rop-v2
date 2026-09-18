/**
 * Pure claim helpers: form validation and the work-email/website domain
 * comparison shown to admins. No imports — the tests in scripts/tests run this
 * file directly under `node --test`.
 */
export const CLAIM_LIMITS = { roleTitle: 120, message: 2000, email: 254 } as const;

/**
 * The word an admin types to confirm an ownership change. The dialog asks for
 * it and the action checks it again, so a request that skipped the dialog is
 * refused too.
 */
export const OWNERSHIP_CONFIRM = { assign: "ASSIGN", revoke: "REVOKE" } as const;

/** Forgiving about case and stray spaces — the point is intent, not typing accuracy. */
export function confirmsWith(typed: string, word: string): boolean {
  return typed.trim().toUpperCase() === word;
}

const CLAIM_GRANT_WINDOW_MS = 10 * 60_000;

type GrantEvent = { id: string; kind: string; schoolId: string | null; userId: string; at: string };
type DecidedClaim = { status: string; schoolId: string; userId: string; decidedAt?: string };

/**
 * The ids of the grant events that approved claims produced — the timeline
 * already shows those claims, so their grants would be the same event twice.
 *
 * Each approved claim consumes at most ONE grant: the one for its listing and
 * person closest to its decision time, within a few minutes (approveClaim
 * writes the ownership and stamps the decision seconds apart). Consuming
 * exactly one is what keeps a later, separate grant to the same person
 * visible — approve, revoke, re-assign within minutes shows the re-assignment.
 */
export function claimGrantEventIds(
  events: readonly GrantEvent[],
  claims: readonly DecidedClaim[],
): Set<string> {
  const consumed = new Set<string>();
  for (const claim of claims) {
    if (claim.status !== "approved" || claim.decidedAt === undefined) continue;
    const decidedAt = Date.parse(claim.decidedAt);
    let best: GrantEvent | undefined;
    let bestDistance = CLAIM_GRANT_WINDOW_MS + 1;
    for (const event of events) {
      if (event.kind !== "granted" || consumed.has(event.id)) continue;
      if (event.schoolId !== claim.schoolId || event.userId !== claim.userId) continue;
      const distance = Math.abs(Date.parse(event.at) - decidedAt);
      if (distance < bestDistance) {
        best = event;
        bestDistance = distance;
      }
    }
    if (best) consumed.add(best.id);
  }
  return consumed;
}

export type ClaimValues = {
  roleTitle: string;
  message: string;
  workEmail: string;
};

export type ClaimValidation = { ok: true; value: ClaimValues } | { ok: false; error: string };

// Same shape as the leads validator and the DB CHECK: "something@something.tld".
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function validateClaim(input: Partial<ClaimValues>): ClaimValidation {
  const roleTitle = (input.roleTitle ?? "").trim();
  const message = (input.message ?? "").trim();
  const workEmail = (input.workEmail ?? "").trim();

  if (!roleTitle) return { ok: false, error: "Please enter your role at the school." };
  if (roleTitle.length > CLAIM_LIMITS.roleTitle) {
    return { ok: false, error: `Roles can be at most ${CLAIM_LIMITS.roleTitle} characters.` };
  }
  if (!workEmail) return { ok: false, error: "Please enter your work email." };
  if (workEmail.length > CLAIM_LIMITS.email || !EMAIL.test(workEmail)) {
    return { ok: false, error: "Please enter a valid work email address." };
  }
  if (message.length > CLAIM_LIMITS.message) {
    return {
      ok: false,
      error: `Messages can be at most ${CLAIM_LIMITS.message.toLocaleString()} characters.`,
    };
  }
  return { ok: true, value: { roleTitle, message, workEmail } };
}

/** "Ada@Mail.School.com" → "mail.school.com"; "" when there is no domain part. */
export function emailDomain(email: string): string {
  const at = email.trim().lastIndexOf("@");
  return at === -1 ? "" : email.trim().slice(at + 1).toLowerCase();
}

/**
 * "https://www.school.com/about" → "school.com". Listings store the website as
 * free text, so anything unparseable — and anything without a dot, which URL()
 * happily accepts as a hostname — yields "" rather than a bogus domain.
 */
export function websiteDomain(website: string): string {
  const raw = website.trim();
  if (!raw) return "";
  try {
    const host = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).hostname.toLowerCase();
    const bare = host.startsWith("www.") ? host.slice(4) : host;
    return bare.includes(".") ? bare : "";
  } catch {
    return "";
  }
}

/**
 * Whether a claimant's work email looks like it belongs to the listing's own
 * domain — an admin hint, never an authorization decision. Subdomains count
 * ("ada@mail.school.com" for school.com); an unknown domain on either side
 * never matches.
 */
export function domainsMatch(workEmail: string, website: string): boolean {
  const site = websiteDomain(website);
  const mail = emailDomain(workEmail);
  if (!site || !mail) return false;
  return mail === site || mail.endsWith(`.${site}`);
}
