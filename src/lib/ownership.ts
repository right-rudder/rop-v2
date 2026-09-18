/**
 * The one write that makes someone a listing's owner. Server-only, and
 * deliberately NOT a "use server" file: every export of one becomes a publicly
 * callable action, and this has no admin check of its own — its callers do.
 *
 * It runs on the admin's own session rather than the service role, so the
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
