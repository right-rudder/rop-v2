import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Sign Up – Flight School Finder",
  description:
    "Create a free Flight School Finder account to add or manage flight school listings, respond to reviews, and connect with students.",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-800 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
              Create an Account
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Join Flight School Finder — it&apos;s free
            </p>
          </div>

          <SignupForm />

          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-700 dark:text-blue-400 font-semibold hover:underline"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
