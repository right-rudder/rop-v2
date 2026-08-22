import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUserById } from "@/lib/data";
import { LIMITS, type User } from "@/lib/types";

export type CurrentUser = {
  id: string;
  email?: string;
  /**
   * Phone given at signup (auth metadata); profiles has no phone column.
   * Dropped when over LIMITS.phone so a prefilled lead form can't fail validation.
   */
  phone?: string;
  /** The public.profiles row; null if the trigger hasn't created one */
  profile: User | null;
};

/**
 * The signed-in user and their profile, or null when logged out.
 * Server-side only (Server Components, Server Actions, Route Handlers).
 * Memoized per request via React cache().
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = (await getUserById(user.id)) ?? null;
  const rawPhone = user.user_metadata?.phone;
  const phone = typeof rawPhone === "string" ? rawPhone.trim() : "";
  return {
    id: user.id,
    email: user.email,
    phone: phone && phone.length <= LIMITS.phone ? phone : undefined,
    profile,
  };
});

export function isAdmin(viewer: CurrentUser | null): boolean {
  return viewer?.profile?.role === "admin";
}
