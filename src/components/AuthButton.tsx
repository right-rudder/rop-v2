"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/actions/auth";

/** Admin-only navigation destinations shown as pills next to the auth controls */
const adminLinks = [{ label: "Submissions", href: "/admin/submissions" }];

/**
 * Login button that swaps to Profile + Log Out once a session exists, plus
 * admin shortcuts when the signed-in user's profile has role = 'admin'.
 * Subscribes to auth state so it updates immediately after login/logout
 * without a full page reload.
 */
export function AuthButton({ mobile = false }: { mobile?: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  // id of the user confirmed as admin — comparing against the current user
  // avoids a stale admin badge flashing after switching accounts
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    let cancelled = false;
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.role === "admin") setAdminUserId(user.id);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isAdmin = user !== null && adminUserId === user.id;

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
    <div
      className={`flex items-center gap-4 ${mobile ? "w-full flex-wrap" : ""}`}
    >
      {isAdmin &&
        adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            title={`Admin: ${link.label}`}
            className={`${
              mobile ? "flex-1 justify-center" : ""
            } flex items-center gap-1.5 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-rose-200 dark:hover:bg-rose-900 transition-colors`}
          >
            <ShieldCheck size={14} />
            {link.label}
          </Link>
        ))}
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
