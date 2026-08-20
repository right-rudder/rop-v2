import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { safeInternalPath } from "@/lib/safe-path";

export const metadata: Metadata = {
  title: "Log In",
  description:
    "Log in to your Flight School Finder account to manage listings, respond to reviews, and more.",
};

// Query-string codes → copy. Codes only: never echo free text from the URL.
const NOTICES: Record<string, string> = {
  "password-updated":
    "Your password has been updated. Log in with your new password.",
};
const ERRORS: Record<string, string> = {
  "confirm-failed":
    "We couldn't verify that link — it may have expired. Log in below, or request a new link.",
};

type Props = {
  searchParams: Promise<{ message?: string; error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { message, error, next } = await searchParams;
  const nextPath = safeInternalPath(next, "");

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-800 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Log in to your Flight School Finder account
            </p>
          </div>

          <LoginForm
            notice={message ? NOTICES[message] : undefined}
            errorNotice={error ? ERRORS[error] : undefined}
            next={nextPath || undefined}
          />

          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-blue-700 dark:text-blue-400 font-semibold hover:underline"
            >
              Sign up free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
