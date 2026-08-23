import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { AuthShell } from "@/components/AuthShell";
import { safeInternalPath } from "@/lib/safe-path";

export const metadata: Metadata = {
  title: "Log In",
  description:
    "Log in to your Flight School Finder account to manage listings, respond to reviews, and more.",
  robots: { index: false },
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
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your Flight School Finder account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-accent-ink hover:underline">
            Sign up free
          </Link>
        </>
      }
    >
      <LoginForm
        notice={message ? NOTICES[message] : undefined}
        errorNotice={error ? ERRORS[error] : undefined}
        next={nextPath || undefined}
      />
    </AuthShell>
  );
}
