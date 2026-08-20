import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./SignupForm";
import { AuthShell } from "@/components/AuthShell";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create a free Flight School Finder account to add or manage flight school listings, respond to reviews, and connect with students.",
};

export default function SignupPage() {
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
      <SignupForm />
    </AuthShell>
  );
}
