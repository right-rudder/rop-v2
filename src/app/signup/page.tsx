import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./SignupForm";
import { AuthShell } from "@/components/AuthShell";
import { safeInternalPath } from "@/lib/safe-path";
import { LIMITS } from "@/lib/types";
import { LEAD_LIMITS } from "@/lib/leads";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create a free Flight School Finder account to add or manage flight school listings, respond to reviews, and connect with students.",
  robots: { index: false },
};

type Props = {
  searchParams: Promise<{ firstName?: string; lastName?: string; email?: string; next?: string }>;
};

// Query values only ever become input defaults (React escapes them); trim and
// cap so an oversized URL can't exceed what the action accepts anyway.
const text = (v: string | undefined, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export default async function SignupPage({ searchParams }: Props) {
  const sp = await searchParams;
  const defaults = {
    firstName: text(sp.firstName, LIMITS.personName),
    lastName: text(sp.lastName, LIMITS.personName),
    email: text(sp.email, LEAD_LIMITS.email),
  };
  const next = safeInternalPath(sp.next, "");

  return (
    <AuthShell
      title="Create an account"
      subtitle="Join Flight School Finder — it's free"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent-ink hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm defaults={defaults} next={next || undefined} />
    </AuthShell>
  );
}
