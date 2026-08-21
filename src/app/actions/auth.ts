"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { absoluteUrl } from "@/lib/site";
import { safeInternalPath } from "@/lib/safe-path";
import { LIMITS } from "@/lib/types";

export type AuthFormState = {
  error?: string;
  message?: string;
};

const MIN_PASSWORD_LENGTH = 8;

const field = (formData: FormData, key: string) =>
  ((formData.get(key) as string | null) ?? "").trim();

export async function login(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: field(formData, "email"),
    password: (formData.get("password") as string | null) ?? "",
  });

  if (error) return { error: error.message };
  // Re-render the root layout so the navbar picks up the new session
  revalidatePath("/", "layout");
  // Back to where the user was heading — same-site paths only
  redirect(safeInternalPath(formData.get("next") as string | null));
}

export async function signup(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const supabase = await createClient();

  const firstName = field(formData, "firstName");
  const lastName = field(formData, "lastName");
  const email = field(formData, "email");
  const password = (formData.get("password") as string | null) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string | null) ?? "";

  if (!firstName || !lastName) {
    return { error: "Please enter your first and last name." };
  }
  if (firstName.length > LIMITS.personName || lastName.length > LIMITS.personName) {
    return { error: `Names must be ${LIMITS.personName} characters or fewer.` };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        phone: field(formData, "phone"),
      },
    },
  });

  if (error) return { error: error.message };
  return { message: "Check your email to confirm your account." };
}

export async function resetPassword(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(
    field(formData, "email"),
    {
      redirectTo: absoluteUrl("/auth/confirm?next=/update-password"),
    },
  );

  if (error) return { error: error.message };
  return { message: "Check your email for a password reset link." };
}

export async function updatePassword(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const supabase = await createClient();

  const password = (formData.get("password") as string | null) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string | null) ?? "";

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message };

  // End the recovery session (and any other active sessions) so the user
  // signs in fresh with the new password instead of landing on /login while
  // still logged in.
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login?message=password-updated");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Re-render the root layout so the navbar drops the signed-in state
  revalidatePath("/", "layout");
  redirect("/");
}
