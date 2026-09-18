/**
 * The one write that makes someone a listing's owner, and the read of the
 * ownership audit trail. Server-only, and deliberately NOT a "use server"
 * file: every export of one becomes a publicly callable action, and
 * grantOwnership has no admin check of its own — its callers do.
 *
 * The write runs on the admin's own session rather than the service role, so the
 * protect_flight_school_columns trigger and RLS stay the real boundary: for
 * anyone but an admin this update is refused by the database.
 */
import { createClient } from "@/lib/supabase/server";
import { friendlyDbError } from "@/lib/supabase/errors";
import { invalidateCatalog } from "@/lib/data";

export type GrantResult = { ok: true } | { ok: false; error: string };

/** Assign an unowned listing. Refuses, rather than overwrites, an existing owner. */
export async function grantOwnership(schoolId: string, userId: string): Promise<GrantResult> {
  const supabase = await createClient();
  try {
    // The null filter repeats the caller's check inside the write, and the
    // select proves it matched: without it, losing a race to another admin
    // updates zero rows and still looks like success.
    const { data, error } = await supabase
      .from("flight_schools")
      .update({ managed_by: userId })
      .eq("id", schoolId)
      .is("managed_by", null)
      .select("id");
    if (error) return { ok: false, error: friendlyDbError(error) };
    if (!data || data.length === 0) {
      return { ok: false, error: "That listing already has an owner. Revoke them first." };
    }
    return { ok: true };
  } finally {
    invalidateCatalog();
  }
}

/** One row of the ownership audit trail. */
export type OwnershipEvent = {
  id: string;
  kind: "granted" | "revoked";
  /** auth.users id of the person who gained or lost the listing */
  userId: string;
  /** null once the listing itself has been removed — schoolName still reads */
  schoolId: string | null;
  schoolName: string;
  /** auth.users id of the admin who made the change; unset when it was made outside the app */
  actorId?: string;
  at: string;
};

/**
 * The newest ownership changes, from public.ownership_events. That table is
 * written by a database trigger on flight_schools.managed_by — never by this
 * app — so it covers every path that changes an owner, claim and submission
 * approvals included. RLS returns rows to admins only; anyone else gets [].
 */
export async function loadOwnershipEvents(limit = 50): Promise<OwnershipEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ownership_events")
    .select("id, kind, user_id, school_id, school_name, actor_id, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 200));
  if (error) throw new Error(`Could not load ownership events: ${error.message}`);

  return data.map((row) => ({
    id: row.id,
    kind: row.kind === "revoked" ? "revoked" : "granted",
    userId: row.user_id,
    schoolId: row.school_id,
    schoolName: row.school_name,
    actorId: row.actor_id ?? undefined,
    at: row.created_at,
  }));
}
