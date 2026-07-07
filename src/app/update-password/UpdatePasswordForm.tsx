"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/actions/auth";

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, {});

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center rounded-lg bg-red-50 dark:bg-red-950 px-4 py-2">
          {state.error}
        </p>
      )}

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
        >
          New Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="••••••••"
          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
        >
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="••••••••"
          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold rounded-lg transition"
      >
        {pending ? "Updating…" : "Update Password"}
      </button>
    </form>
  );
}
