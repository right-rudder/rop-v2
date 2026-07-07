"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/actions/auth";

/**
 * Login button that swaps to Profile + Log Out once a session exists.
 * Subscribes to auth state so it updates immediately after login/logout
 * without a full page reload.
 */
export function AuthButton({ mobile = false }: { mobile?: boolean }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!user) {
    return (
      <Link
        href="/login"
        className={`${
          mobile ? "block w-full text-center text-sm" : ""
        } bg-rose-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-rose-600 transition-colors shadow-sm`}
      >
        Log In
      </Link>
    );
  }

  return (
    <div className={`flex items-center gap-4 ${mobile ? "w-full" : ""}`}>
      <Link
        href={`/profile/${user.id}`}
        className={`${
          mobile ? "flex-1 text-center text-sm" : ""
        } text-slate-700 dark:text-slate-300 hover:text-rose-900 dark:hover:text-rose-400 font-medium`}
      >
        My Profile
      </Link>
      <form action={logout} className={mobile ? "flex-1" : ""}>
        <button
          type="submit"
          className={`${
            mobile ? "block w-full text-sm" : ""
          } bg-rose-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-rose-600 transition-colors shadow-sm`}
        >
          Log Out
        </button>
      </form>
    </div>
  );
}
