"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "@/app/actions/auth";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, {});

  if (state.message) {
    return (
      <p className="text-sm text-green-700 dark:text-green-400 text-center rounded-lg bg-green-50 dark:bg-green-950 px-4 py-6">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center rounded-lg bg-red-50 dark:bg-red-950 px-4 py-2">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
          >
            First Name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            placeholder="Charles"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
          >
            Last Name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            required
            placeholder="Lindbergh"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
        >
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
        >
          Phone Number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="(123) 456-6789"
          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
        >
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        By creating an account you agree to our{" "}
        <Link
          href="/terms-of-service"
          className="text-blue-700 dark:text-blue-400 hover:underline"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy-policy"
          className="text-blue-700 dark:text-blue-400 hover:underline"
        >
          Privacy Policy
        </Link>
        .
      </p>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold rounded-lg transition"
      >
        {pending ? "Creating account…" : "Create Account"}
      </button>
    </form>
  );
}
