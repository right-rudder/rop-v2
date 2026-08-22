"use server";

import { withFlash } from "@/lib/toast";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { friendlyDbError } from "@/lib/supabase/errors";
import { getCurrentUser } from "@/lib/auth";
import { getPrograms } from "@/lib/data";
import { validateProfile } from "@/lib/profile";

export type ProfileFormState = {
  error?: string;
};

const field = (formData: FormData, key: string) =>
  ((formData.get(key) as string | null) ?? "").trim();

/**
 * Update the signed-in user's own profile. The row is always the viewer's —
 * there is no id in the form to tamper with — and the "Own profile update"
 * RLS policy plus the column-level grant (role is excluded) are the real gate.
 */
export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const viewer = await getCurrentUser();
  if (!viewer) return { error: "You must be logged in to edit your profile." };
  // The profiles row is created by a trigger on signup; if it's missing there
  // is nothing to update, so say so instead of redirecting after a no-op.
  if (!viewer.profile) return { error: "Profile not found. Please sign out and back in." };

  const catalog = (await getPrograms()).map((p) => p.slug);
  const parsed = validateProfile(
    {
      firstName: field(formData, "firstName"),
      lastName: field(formData, "lastName"),
      bio: field(formData, "bio"),
      pilotCertificates: formData
        .getAll("pilotCertificates")
        .filter((p): p is string => typeof p === "string"),
    },
    catalog,
  );
  if (!parsed.ok) return { error: parsed.error };
  const { value } = parsed;

  const supabase = await createClient();
  // Select the updated row back: a 0-row update (row gone, or blocked by RLS)
  // is not an error to PostgREST, and must not redirect as if it saved.
  const { data, error } = await supabase
    .from("profiles")
    .update({
      first_name: value.firstName,
      last_name: value.lastName,
      bio: value.bio,
      pilot_certificates: value.pilotCertificates,
    })
    .eq("id", viewer.id)
    .select("id")
    .maybeSingle();
  if (error) return { error: friendlyDbError(error) };
  if (!data) return { error: "Profile not found (or the update was blocked)." };

  revalidatePath(`/profile/${viewer.id}`);
  revalidatePath(`/profile/${viewer.id}/edit`);
  // Reviewer names on school pages come from profiles; the root layout
  // re-render is cheap and keeps the navbar/viewer consistent.
  revalidatePath("/", "layout");
  // Land on the profile so the user sees the saved result in place.
  redirect(withFlash(`/profile/${viewer.id}`, "profile-updated"));
}
