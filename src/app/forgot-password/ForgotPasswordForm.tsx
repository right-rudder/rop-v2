"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword } from "@/app/actions/auth";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(resetPassword, {});

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

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold rounded-lg transition"
      >
        {pending ? "Sending…" : "Send Reset Link"}
      </button>

      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        Remembered it?{" "}
        <Link
          href="/login"
          className="text-blue-700 dark:text-blue-400 font-semibold hover:underline"
        >
          Back to log in
        </Link>
      </div>
    </form>
  );
}
