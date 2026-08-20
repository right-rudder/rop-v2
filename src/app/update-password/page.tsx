import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { UpdatePasswordForm } from "./UpdatePasswordForm";

export const metadata: Metadata = {
  title: "Update Password",
  description: "Choose a new password for your Flight School Finder account.",
};

export default async function UpdatePasswordPage() {
  // The recovery link establishes a session before landing here; without one
  // updateUser() would fail with a confusing "Auth session missing" error.
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/forgot-password");

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-800 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
              Update Password
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Choose a new password for your account
            </p>
          </div>

          <UpdatePasswordForm />
        </div>
      </div>
    </div>
  );
}
