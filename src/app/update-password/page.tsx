import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { UpdatePasswordForm } from "./UpdatePasswordForm";
import { AuthShell } from "@/components/AuthShell";

export const metadata: Metadata = {
  title: "Update Password",
  description: "Choose a new password for your Flight School Finder account.",
  robots: { index: false },
};

export default async function UpdatePasswordPage() {
  // The recovery link establishes a session before landing here; without one
  // updateUser() would fail with a confusing "Auth session missing" error.
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/forgot-password");

  return (
    <AuthShell title="Update password" subtitle="Choose a new password for your account">
      <UpdatePasswordForm />
    </AuthShell>
  );
}
