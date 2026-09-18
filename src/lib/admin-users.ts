/**
 * Pure helpers for the admin Users page: invite-form validation and the
 * status shown per account. No imports — the tests in scripts/tests run this
 * file directly under `node --test`.
 */
export const INVITE_LIMITS = { name: 60, email: 254, phone: 40, roleTitle: 120 } as const;

export type InviteValues = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  roleTitle: string;
};

export type InviteValidation = { ok: true; value: InviteValues } | { ok: false; error: string };

// Same shape as the claims/leads validators: "something@something.tld".
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function validateInvite(input: Partial<InviteValues>): InviteValidation {
  const email = (input.email ?? "").trim().toLowerCase();
  const firstName = (input.firstName ?? "").trim();
  const lastName = (input.lastName ?? "").trim();
  const phone = (input.phone ?? "").trim();
  const roleTitle = (input.roleTitle ?? "").trim();

  if (!email) return { ok: false, error: "Enter the person's email." };
  if (email.length > INVITE_LIMITS.email || !EMAIL.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (!firstName || !lastName) return { ok: false, error: "Enter a first and last name." };
  // profiles_name_length — the signup trigger would silently truncate instead
  if (firstName.length > INVITE_LIMITS.name || lastName.length > INVITE_LIMITS.name) {
    return { ok: false, error: `Names can be at most ${INVITE_LIMITS.name} characters.` };
  }
  if (phone.length > INVITE_LIMITS.phone) {
    return { ok: false, error: `Phone numbers can be at most ${INVITE_LIMITS.phone} characters.` };
  }
  if (roleTitle.length > INVITE_LIMITS.roleTitle) {
    return { ok: false, error: `Roles can be at most ${INVITE_LIMITS.roleTitle} characters.` };
  }
  return { ok: true, value: { email, firstName, lastName, phone, roleTitle } };
}

/**
 * - invited: an admin invited them and they have not followed the link yet
 * - accepted: they were invited and have confirmed
 * - unconfirmed: they signed up themselves and have not confirmed their email
 * - active: a confirmed self-signup
 */
export type InviteStatus = "invited" | "accepted" | "unconfirmed" | "active";

/** The fields of a Supabase auth user this module reads. */
export type AuthUserTimestamps = {
  invited_at?: string | null;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
};

export function inviteStatus(u: AuthUserTimestamps): InviteStatus {
  const confirmed = Boolean(u.email_confirmed_at || u.confirmed_at);
  if (u.invited_at) return confirmed ? "accepted" : "invited";
  return confirmed ? "active" : "unconfirmed";
}

export const INVITE_STATUS_LABEL: Record<InviteStatus, string> = {
  invited: "Invite pending",
  accepted: "Invite accepted",
  unconfirmed: "Unconfirmed",
  active: "Active",
};

/** Pending invites first — they are the rows with an action — then newest. */
export function sortAdminUsers<T extends { status: InviteStatus; createdAt: string }>(
  rows: readonly T[],
): T[] {
  return [...rows].sort((a, b) => {
    const pending = Number(b.status === "invited") - Number(a.status === "invited");
    return pending || b.createdAt.localeCompare(a.createdAt);
  });
}
