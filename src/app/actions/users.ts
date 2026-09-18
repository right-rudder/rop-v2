"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { friendlyDbError } from "@/lib/supabase/errors";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { loadSchoolById } from "@/lib/data";
import { notifyUser, sendOwnerWebhook } from "@/lib/notify";
import { grantOwnership } from "@/lib/ownership";
import { inviteStatus, validateInvite } from "@/lib/admin-users";
import { absoluteUrl } from "@/lib/site";
import { schoolHref } from "@/lib/utils";
import type { FlightSchool } from "@/lib/types";

export type UserActionState = {
  error?: string;
  message?: string;
};

const field = (formData: FormData, key: string) =>
  ((formData.get(key) as string | null) ?? "").trim();

// Lands on the same route as a password reset: the invite link signs the person
// in, and setting a password is the one thing their account still lacks.
const inviteRedirect = () => absoluteUrl("/auth/confirm?next=/update-password");

const notifyTarget = (school: FlightSchool) => ({
  id: school.id,
  name: school.name,
  path: schoolHref(school),
  editPath: `/schools/${school.slug}/edit`,
});

/** Invite mail goes through Supabase, whose failures are worth a plainer word. */
function inviteError(error: { message: string; status?: number; code?: string }): string {
  console.error("[users] invite failed:", error.code ?? error.status, error.message);
  if (error.status === 429 || error.code === "over_email_send_rate_limit") {
    return "Supabase's email limit was reached — wait a few minutes and try again.";
  }
  if (error.code === "email_exists") return "That email already has a confirmed account.";
  return `The invite could not be sent: ${error.message}`;
}

function serviceClient(): ReturnType<typeof createServiceClient> | null {
  try {
    return createServiceClient();
  } catch (e) {
    console.error("[users]", e instanceof Error ? e.message : e);
    return null;
  }
}

const NOT_CONFIGURED = "Inviting users isn't configured on this server yet.";

/**
 * Invite someone by email and, optionally, make them the owner of an unowned
 * listing in the same step. Supabase sends the invite; the account exists —
 * unconfirmed — from that moment, which is what lets ownership be assigned
 * before the person has ever signed in.
 */
export async function inviteUser(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const viewer = await getCurrentUser();
  if (!viewer || !isAdmin(viewer)) return { error: "Admin access required." };

  const parsed = validateInvite({
    email: field(formData, "email"),
    firstName: field(formData, "firstName"),
    lastName: field(formData, "lastName"),
    phone: field(formData, "phone"),
    roleTitle: field(formData, "roleTitle"),
  });
  if (!parsed.ok) return { error: parsed.error };
  const invite = parsed.value;

  // The listing is checked before any email goes out: an invite cannot be
  // unsent, so everything that can be refused is refused first.
  const schoolId = field(formData, "schoolId");
  let school: FlightSchool | undefined;
  if (schoolId) {
    school = await loadSchoolById(schoolId);
    if (!school) return { error: "That listing no longer exists." };
    if (school.managedBy) {
      return { error: `${school.name} already has an owner. Revoke them first.` };
    }
  }

  const service = serviceClient();
  if (!service) return { error: NOT_CONFIGURED };

  const { data: existingId, error: lookupError } = await service.rpc("user_id_by_email", {
    p_email: invite.email,
  });
  if (lookupError) return { error: friendlyDbError(lookupError) };

  // An account that exists but never confirmed is invited again, which
  // re-issues its link. A confirmed one needs no invite: with a listing picked
  // this becomes a plain assignment, and without one there is nothing to do.
  let userId: string = existingId ?? "";
  let invited = true;
  if (existingId) {
    const { data, error } = await service.auth.admin.getUserById(existingId);
    if (error || !data.user) return { error: "Could not read that account — try again." };
    const status = inviteStatus(data.user);
    if (status === "accepted" || status === "active") {
      if (!school) return { error: `${invite.email} already has an account — nothing to invite.` };
      invited = false;
    }
  }

  if (invited) {
    const { data, error } = await service.auth.admin.inviteUserByEmail(invite.email, {
      // first_name/last_name feed the handle_new_user trigger's profiles row.
      // Never a role: profiles.role is not settable from here by design.
      data: { first_name: invite.firstName, last_name: invite.lastName, phone: invite.phone },
      redirectTo: inviteRedirect(),
    });
    if (error) return { error: inviteError(error) };
    userId = data.user.id;
  }

  revalidatePath("/admin/users");
  if (!school) return { message: `Invite sent to ${invite.email}.` };

  const granted = await grantOwnership(school.id, userId);
  if (!granted.ok) {
    return {
      error: invited
        ? `Invite sent to ${invite.email}, but ${school.name} couldn't be assigned: ${granted.error} Submit again with the same email to assign a listing.`
        : granted.error,
    };
  }

  await Promise.all([
    // In-app only for an invitee — see NotifyArgs.email.
    notifyUser({
      userId,
      type: "listing_assigned",
      school: notifyTarget(school),
      email: !invited,
    }),
    sendOwnerWebhook({
      userId,
      source: invited ? "admin_invited" : "admin_assigned",
      school,
      approvedBy: viewer.id,
      accountStatus: invited ? "invited" : "active",
      contact: invited
        ? { ...invite, workEmail: "" }
        : { roleTitle: invite.roleTitle },
    }),
  ]);

  revalidatePath("/admin/claims");
  return {
    message: invited
      ? `Invite sent to ${invite.email} — they now manage ${school.name}.`
      : `${invite.email} already had an account, so no invite was sent — they now manage ${school.name}.`,
  };
}

/** Send the invite email again to someone who has not accepted it yet. */
export async function resendInvite(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const viewer = await getCurrentUser();
  if (!isAdmin(viewer)) return { error: "Admin access required." };

  const userId = field(formData, "userId");
  if (!userId) return { error: "Missing user." };

  const service = serviceClient();
  if (!service) return { error: NOT_CONFIGURED };

  const { data, error } = await service.auth.admin.getUserById(userId);
  if (error || !data.user?.email) return { error: "That account no longer exists." };
  if (inviteStatus(data.user) !== "invited") {
    return { error: "This person has already accepted their invite." };
  }

  const { error: inviteFailed } = await service.auth.admin.inviteUserByEmail(data.user.email, {
    redirectTo: inviteRedirect(),
  });
  if (inviteFailed) return { error: inviteError(inviteFailed) };

  revalidatePath("/admin/users");
  return { message: `Invite sent again to ${data.user.email}.` };
}
