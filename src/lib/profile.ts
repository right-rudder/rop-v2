/**
 * Pure profile validation, shared by the updateProfile server action and
 * scripts/tests. Relative imports only so it runs under `node --test`.
 */
import type { LIMITS } from "./types";

/**
 * Mirrors LIMITS.personName / LIMITS.bio (and the profiles_* CHECK
 * constraints). Spelled out here because a runtime import of ./types has no
 * extension for Node to resolve under `node --test`; `satisfies` against the
 * literal types keeps the two in lockstep at compile time.
 */
export const PROFILE_LIMITS = { name: 60, bio: 1000 } as const satisfies {
  name: typeof LIMITS.personName;
  bio: typeof LIMITS.bio;
};

export type ProfileValues = {
  firstName: string;
  lastName: string;
  /** null (not "") when blank, so the column stays NULL */
  bio: string | null;
  /** Program slugs, restricted to the catalog and in catalog order */
  pilotCertificates: string[];
};

export type ProfileInput = {
  firstName?: string;
  lastName?: string;
  bio?: string;
  pilotCertificates?: string[];
};

export type ProfileValidation = { ok: true; value: ProfileValues } | { ok: false; error: string };

/**
 * Validate to the same limits the database enforces (profiles_name_length,
 * profiles_bio_length in supabase/schema.sql) so users get a clear message
 * instead of a constraint error. `catalog` is the ordered list of program
 * slugs; anything outside it is dropped silently — the form only offers
 * catalog entries, so a stray value is a stale page, not a user mistake.
 */
export function validateProfile(
  input: ProfileInput,
  catalog: readonly string[],
): ProfileValidation {
  const firstName = (input.firstName ?? "").trim();
  const lastName = (input.lastName ?? "").trim();
  const bio = (input.bio ?? "").trim();

  if (!firstName || !lastName) {
    return { ok: false, error: "Please enter your first and last name." };
  }
  if (firstName.length > PROFILE_LIMITS.name || lastName.length > PROFILE_LIMITS.name) {
    return { ok: false, error: `Names must be ${PROFILE_LIMITS.name} characters or fewer.` };
  }
  if (bio.length > PROFILE_LIMITS.bio) {
    return {
      ok: false,
      error: `Your bio must be ${PROFILE_LIMITS.bio.toLocaleString()} characters or fewer.`,
    };
  }

  const chosen = new Set(input.pilotCertificates ?? []);
  const pilotCertificates = catalog.filter((slug) => chosen.has(slug));

  return { ok: true, value: { firstName, lastName, bio: bio || null, pilotCertificates } };
}
