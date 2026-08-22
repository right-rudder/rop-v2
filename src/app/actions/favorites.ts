"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyDbError } from "@/lib/supabase/errors";
import { safeInternalPath } from "@/lib/safe-path";

export type ToggleFavoriteResult = { saved: boolean } | { error: string };

/** Save or un-save a school for the signed-in user. `path` is the page to re-render. */
export async function toggleFavorite(
  schoolId: string,
  path: string,
): Promise<ToggleFavoriteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Log in to save schools." };

  const id = (schoolId ?? "").trim();
  if (!id || id.length > 64) return { error: "Missing school." };

  const existing = await supabase
    .from("favorites")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("school_id", id)
    .maybeSingle();
  if (existing.error) return { error: friendlyDbError(existing.error) };

  let saved: boolean;
  if (existing.data) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("school_id", id);
    if (error) return { error: friendlyDbError(error) };
    saved = false;
  } else {
    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: user.id, school_id: id });
    if (error && error.code !== "23505") return { error: friendlyDbError(error) };
    saved = true;
  }

  const safePath = safeInternalPath(path, "");
  if (safePath) revalidatePath(safePath);
  revalidatePath("/saved");
  return { saved };
}
