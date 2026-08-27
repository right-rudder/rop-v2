"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { friendlyDbError } from "@/lib/supabase/errors";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import {
  loadSchoolById,
  loadSchoolBySlug,
  getClaimById,
  getPendingClaimFor,
  invalidateCatalog,
} from "@/lib/data";
import { notifyUser } from "@/lib/notify";
import { validateClaim } from "@/lib/claims";
import { schoolHref } from "@/lib/utils";
import { withFlash } from "@/lib/toast";
import type { FlightSchool } from "@/lib/types";

export type ClaimActionState = {
  error?: string;
  message?: string;
};

const field = (formData: FormData, key: string) =>
  ((formData.get(key) as string | null) ?? "").trim();

const editHref = (school: Pick<FlightSchool, "slug">) => `/schools/${school.slug}/edit`;

/** The shape notifyUser needs, from a listing. */
const notifyTarget = (school: FlightSchool) => ({
  id: school.id,
  name: school.name,
  path: schoolHref(school),
  editPath: editHref(school),
});

// ── Claiming ──────────────────────────────────────────────────────────────────

export async function createClaim(
  _prev: ClaimActionState,
  formData: FormData,
): Promise<ClaimActionState> {
  const viewer = await getCurrentUser();
  if (!viewer) return { error: "Please sign in to claim a listing." };

  const schoolId = field(formData, "schoolId");
  const school = schoolId ? await loadSchoolById(schoolId) : undefined;
  if (!school) return { error: "Missing school." };
  if (school.managedBy) {
    return { error: "This listing is already managed by someone. Contact us if that's wrong." };
  }

  const validation = validateClaim({
    roleTitle: field(formData, "roleTitle"),
    message: field(formData, "message"),
    workEmail: field(formData, "workEmail"),
  });
  if (!validation.ok) return { error: validation.error };
  const claim = validation.value;

  // Friendlier than letting the partial unique index raise 23505 — though the
  // insert below still handles that, for two submits racing each other.
  if (await getPendingClaimFor(viewer.id, school.id)) {
    return { error: "You already have a claim pending on this listing." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("school_claims").insert({
    school_id: school.id,
    user_id: viewer.id,
    status: "pending",
    role_title: claim.roleTitle,
    message: claim.message,
    work_email: claim.workEmail,
  });
  if (error) {
    return {
      error:
        error.code === "23505"
          ? "You already have a claim pending on this listing."
          : friendlyDbError(error),
    };
  }

  revalidatePath("/admin/claims");
  redirect(withFlash(schoolHref(school), "claim-submitted"));
}

// ── Review ────────────────────────────────────────────────────────────────────

export async function approveClaim(
  _prev: ClaimActionState,
  formData: FormData,
): Promise<ClaimActionState> {
  // The !viewer half is redundant with isAdmin, but it narrows the type so
  // recording who decided the claim below needs no non-null assertion.
  const viewer = await getCurrentUser();
  if (!viewer || !isAdmin(viewer)) return { error: "Admin access required." };

  const claimId = field(formData, "claimId");
  const claim = await getClaimById(claimId);
  if (!claim) return { error: "Claim not found." };
  if (claim.status !== "pending") return { error: "This claim has already been processed." };

  const school = await loadSchoolById(claim.schoolId);
  if (!school) return { error: "That listing no longer exists." };
  if (school.managedBy && school.managedBy !== claim.userId) {
    return { error: "Someone else already manages this listing. Revoke them first." };
  }

  const supabase = await createClient();
  const decided = { decided_by: viewer.id, decided_at: new Date().toISOString() };

  // Ownership first, then the status flip — the same crash-safe order as
  // approveSubmission. Setting managed_by is idempotent, so if anything fails
  // in between, the claim stays pending and approving again finishes the job.
  // The reverse order could strand a claim as approved with no ownership.
  try {
    const { error } = await supabase
      .from("flight_schools")
      .update({ managed_by: claim.userId })
      .eq("id", school.id);
    if (error) return { error: friendlyDbError(error) };
  } finally {
    invalidateCatalog();
  }

  const { data: updated, error: updateError } = await supabase
    .from("school_claims")
    .update({ status: "approved", ...decided })
    .eq("id", claim.id)
    .eq("status", "pending")
    .select("id");
  if (updateError) {
    return {
      error: `${school.name} was assigned, but the claim could not be marked approved (${updateError.message}). Approve again to finish.`,
    };
  }
  if (!updated || updated.length === 0) {
    return { error: "This claim has already been processed." };
  }

  // One owner per listing, so every other live claim on it is now moot.
  // Leaving them pending would clutter the queue forever and invite an admin
  // to "approve" a claim the ownership guard above would then refuse.
  const { data: superseded, error: supersedeError } = await supabase
    .from("school_claims")
    .update({ status: "rejected", ...decided })
    .eq("school_id", school.id)
    .eq("status", "pending")
    .select("user_id");
  if (supersedeError) {
    console.error("[claims] could not supersede rival claims:", supersedeError.message);
  }

  const target = notifyTarget(school);
  await notifyUser({ userId: claim.userId, type: "claim_approved", school: target });
  for (const row of superseded ?? []) {
    await notifyUser({ userId: row.user_id, type: "claim_rejected", school: target });
  }

  revalidatePath("/admin/claims");
  const also = superseded?.length
    ? ` ${superseded.length} other pending ${superseded.length === 1 ? "claim was" : "claims were"} declined.`
    : "";
  return { message: `Approved — ${school.name} is now managed by its claimant.${also}` };
}

export async function rejectClaim(
  _prev: ClaimActionState,
  formData: FormData,
): Promise<ClaimActionState> {
  const viewer = await getCurrentUser();
  if (!viewer || !isAdmin(viewer)) return { error: "Admin access required." };

  const claimId = field(formData, "claimId");
  const claim = await getClaimById(claimId);
  if (!claim) return { error: "Claim not found." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("school_claims")
    .update({
      status: "rejected",
      decided_by: viewer.id,
      decided_at: new Date().toISOString(),
    })
    .eq("id", claim.id)
    .eq("status", "pending")
    .select("id");
  if (error) return { error: friendlyDbError(error) };
  if (!data || data.length === 0) return { error: "This claim has already been processed." };

  const school = await loadSchoolById(claim.schoolId);
  if (school) {
    await notifyUser({
      userId: claim.userId,
      type: "claim_rejected",
      school: notifyTarget(school),
    });
  }

  revalidatePath("/admin/claims");
  return { message: "Claim declined." };
}

// ── Direct assignment ─────────────────────────────────────────────────────────

export async function assignOwner(
  _prev: ClaimActionState,
  formData: FormData,
): Promise<ClaimActionState> {
  const viewer = await getCurrentUser();
  if (!isAdmin(viewer)) return { error: "Admin access required." };

  const slug = field(formData, "schoolSlug");
  const email = field(formData, "email");
  if (!slug) return { error: "Enter the listing's slug." };
  if (!email) return { error: "Enter the new owner's email." };

  const school = await loadSchoolBySlug(slug);
  if (!school) return { error: `No listing with the slug "${slug}".` };
  if (school.managedBy) {
    return { error: `${school.name} already has an owner. Revoke them first.` };
  }

  // auth.users is not on the Data API and profiles has no email column, so the
  // lookup runs through a definer function only service_role may execute.
  let service: ReturnType<typeof createServiceClient>;
  try {
    service = createServiceClient();
  } catch (e) {
    console.error("[claims]", e instanceof Error ? e.message : e);
    return { error: "Owner lookup isn't configured on this server yet." };
  }
  const { data: userId, error: lookupError } = await service.rpc("user_id_by_email", {
    p_email: email,
  });
  if (lookupError) return { error: friendlyDbError(lookupError) };
  if (!userId) return { error: `No account with the email "${email}".` };

  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from("flight_schools")
      .update({ managed_by: userId })
      .eq("id", school.id)
      .is("managed_by", null);
    if (error) return { error: friendlyDbError(error) };
  } finally {
    invalidateCatalog();
  }

  await notifyUser({ userId, type: "listing_assigned", school: notifyTarget(school) });

  revalidatePath("/admin/claims");
  return { message: `${school.name} is now managed by ${email}.` };
}

export async function revokeOwner(
  _prev: ClaimActionState,
  formData: FormData,
): Promise<ClaimActionState> {
  const viewer = await getCurrentUser();
  if (!isAdmin(viewer)) return { error: "Admin access required." };

  const slug = field(formData, "schoolSlug");
  if (!slug) return { error: "Enter the listing's slug." };

  const school = await loadSchoolBySlug(slug);
  if (!school) return { error: `No listing with the slug "${slug}".` };
  const previousOwner = school.managedBy;
  if (!previousOwner) return { error: `${school.name} has no owner to revoke.` };

  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("flight_schools")
      .update({ managed_by: null })
      .eq("id", school.id)
      .eq("managed_by", previousOwner)
      .select("id");
    if (error) return { error: friendlyDbError(error) };
    if (!data || data.length === 0) {
      return { error: "Ownership changed while you were looking — refresh and try again." };
    }
  } finally {
    invalidateCatalog();
  }

  await notifyUser({
    userId: previousOwner,
    type: "listing_revoked",
    school: notifyTarget(school),
  });

  revalidatePath("/admin/claims");
  return { message: `${school.name} no longer has an owner.` };
}

// ── Notifications ─────────────────────────────────────────────────────────────

/**
 * Mark one notification read, or every unread one when no id is given —
 * the per-row button and "Mark all as read" differ only by that field.
 */
export async function markNotificationsRead(
  _prev: ClaimActionState,
  formData: FormData,
): Promise<ClaimActionState> {
  const viewer = await getCurrentUser();
  if (!viewer) return { error: "Please sign in." };

  const id = field(formData, "notificationId");
  const supabase = await createClient();
  // read_at is the only column the grant allows and the policy scopes the row
  // to its owner; the user_id filter states the same intent in the query.
  let query = supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", viewer.id)
    .is("read_at", null);
  if (id) query = query.eq("id", id);
  const { error } = await query;
  if (error) return { error: friendlyDbError(error) };

  revalidatePath("/notifications");
  return { message: id ? "Marked as read." : "All caught up." };
}
